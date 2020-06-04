//////////////////////////////////////////////////////////////////////////
// Liquid ver.1.11   Copyright 2020 Cristian Andreon - cristianandreon.eu
// First update 8.1.2020 - Last update  4-6-2020
// TODO : see trello.com
//
// *** File internal priority *** 
// 
//  1°  project LiquidX
//  2°  project Liquid
//  3°  project LiquidD
// 
// 
// 
// *** Automatic event firing *** 
// 
//      suppose a command named "my_command" event strip underline and make first char to uppercase :
//      
//      call beforeMyCommand() event before executing "my_command"
//      call afterMyCommand()  event after executed "my_command"
//     
//  in other words add "before" / "after" and then make toCamelCase()
//

// mnemonics flags 
// requireSelected selection of row is required, don't consider caret as current row

// N.B.: Link to external control by : @controlId o url( controlId )
// N.B.: foreigTable controls default name : ForeignTable$ForeignColumn@controlId



var glLiquidStartupTables = [];
var glLiquidStartupMenuX = [];
var glLiquidStartupWinX = [];
var glLiquidStartupPopup = [];
var glPendingXHRs = [];

var glLiquids = new Array();
var glNavigations = new Array();
var glLiquidContainers = new Array();
var glLiquidContainersObserver = new Array();
var glLiquidsPendingLoad = new Array();
var glMessageInfoList = new Array();
var glLastFocusedLiquid = null;
var glLastFrameId = null;
var glLiquidGenesisToken = null;
var glLiquidDB = null;
var glLiquidIDB = null;
var glLiquidDBEnable = true;
var glWorkReaderLooper = null;

//
// start point of servlet ... the bridge to server
//
if(typeof glLiquidRoot === "undefined")
    var glLiquidRoot = ".";
if(typeof glLiquidServlet === "undefined")
    var glLiquidServlet = glLiquidRoot+"/liquid/liquid.jsp";    // look inside framework : need servlet 3


class LiquidCtrl {
   
    // sourceData format : 
    //  { liquidOrId:... , srcForeignWrk:... , srcForeignTable:... , srcForeignColumn:... , srcColumn:..., rootControlId:... }

    constructor(controlId, outDivObjOrId, tableJsonString, sourceData, mode, parentObjId) {

        // try {
        var retVal = this;
        
        // Container
        this.outDivObjOrId = outDivObjOrId;
        if(outDivObjOrId && typeof outDivObjOrId === "object" && outDivObjOrId.nodeType === 1) {
            this.outDivObj = outDivObjOrId;
            this.outDivId = outDivObjOrId.id;
        } else {
            this.outDivId = outDivObjOrId;
            this.outDivObj = document.getElementById(this.outDivId);
        }

        this.controlId = controlId;
        // this.parentObjId = (typeof parentObjId !== 'undefined' ? parentObjId : null);
        
        if(typeof mode !== 'undefined' && mode !== null ? mode : null) {
            this.mode = mode;
        }
        
        this.parentObj = null;
        this.isIconic = false;
        this.isMaximized = false;
        this.iconicPos = null;
        this.winXStatus = '';
        this.lastSearchCol = -1;
        this.lastSearchRec = -1;
        
        this.askForSave = false;

        // if(controlId=="materials@testGrid4") debugger;
        // if(controlId=="quotes_detail@testGrid4") debugger;
        // if(liquid.srcLiquid.controlId=="quotes_detail@testGrid4") debugger;

        this.sourceData = sourceData;
        this.srcLiquidControlId = null;
        this.srcLiquid = null;
        this.srcForeignWrk = null;
        this.srcForeignTable = null;
        this.srcForeignColumn = null;
        this.srcColumn = null;
        this.rootControlId = null;
        
        if(typeof sourceData !== 'undefined' && sourceData) {
            if(typeof sourceData.liquidOrId === 'string') this.srcLiquidControlId = sourceData.liquidOrId;
            else if(sourceData.liquidOrId instanceof LiquidCtrl) this.srcLiquidControlId = sourceData.liquidOrId.controlId;
            this.srcLiquid = Liquid.getLiquid(sourceData.liquidOrId);
            this.srcForeignWrk = sourceData.foreignWrk;
            this.srcForeignTable = sourceData.foreignTable;
            this.srcForeignColumn = sourceData.foreignColumn;
            this.srcColumn = sourceData.column;
            this.rootControlId = sourceData.rootControlId;
        }
        
        this.linkedLiquids = null;
        this.isAsyncResolve = false;
        this.isAsyncResolveDone = false;
        this.pendingLoad = true;


        // solve source col (foreignTable, etc...)
        Liquid.solveSourceColumn(this, null, null);

        try {
            if(tableJsonString) {
                if(tableJsonString.startsWith("url(") || tableJsonString.startsWith("@(")) {
                    var newLiquid = null;
                    var jsonURL = tableJsonString.startsWith("url(") ? tableJsonString.substring(4) : tableJsonString.substring(2);
                    var eIndex = jsonURL.indexOf(")");
                    var restOfTableJson = "";
                    if(eIndex>0) {
                        restOfTableJson = jsonURL.substring(eIndex+1);
                        jsonURL = jsonURL.substring(0, eIndex-1);
                    }                    
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', glLiquidServlet + '?operation=getJson&fileURL=' + jsonURL, false);
                    xhr.send();
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                var responseText = xhr.responseText;
                                if(restOfTableJson) {
                                    // Union overlaying part of
                                    try {
                                        var responseJSON = xhr.responseText;
                                        if(responseJSON) {
                                            var restOfTableSON = JSON.parse(restOfTableJson);
                                            Liquid.transferFeatures(responseJSON, restOfTableSON);
                                            responseText = JSON.stringify(responseJSON);
                                        }
                                    } catch (e) {
                                        console.error("ERROR: creating control "+this.controlId+":"+e);
                                    }
                                }
                                newLiquid = new LiquidCtrl( controlId, outDivObjOrId, responseText
                                                            , sourceData
                                                            , mode, parentObjId );
                            } else console.error("ERROR: No response reading :"+tableJsonString+" of controlId:"+controlId);
                        } catch (e) {
                            console.error(xhr.responseText);
                            console.error("ERROR: creating control "+this.controlId+":"+e);
                        }
                    }
                    return newLiquid;
                } else {
                    this.tableJson = tableJsonString ? JSON.parse(tableJsonString) : null;
                }
            }
        } catch (e) {
            console.error(tableJsonString);
            console.error("LiquidCtrl() : parse error:" + e);
        }

        if(this.tableJson) {
            
            // if(typeof parentObjId !== 'undefined' && parentObjId) this.tableJson.parentObjId = parentObjId;

            if(typeof this.tableJson.mode === 'undefined') {
                this.tableJson.mode = this.mode;
            }
            if(typeof this.mode === 'undefined') {
                this.mode = this.tableJson.mode;
            }
            if(this.tableJson.askForSave === true) {
                this.askForSave = true;
            } else {
                this.tableJson.askForSave = false;
            }
            
            if(!isDef(this.rootControlId)) { // overlay rootControlId from server (typically for queryX
                if(isDef(this.tableJson.rootControlId)) {
                    this.rootControlId = this.tableJson.rootControlId;
                }
            }
            
            
            this.status = this.tableJson.status;

            this.outDivObjCreated = false;
            this.rootObj = null;

            this.cache = false;
            this.loadCounter = 0;
            this.absoluteLoadCounter = 0;
            this.modifications = null;
            this.cPage = 0;
            this.nPages = 0;
            this.cRow = 0;
            this.nRows = 0;
            this.httpRequest = null;
            this.gridOptions = null;
            this.gridTabsObj = null;
            this.filtersObj = null;
            this.filtersFirstId = null;
            this.popupCaptionObj = null;
            this.lookupObj = null;
            this.tableJson.idColumnField = this.tableJson.idColumn ? Liquid.getField(this, this.tableJson.idColumn) : null;
            this.navObj = null;
            
            this.enableOverscroll = false;
            this.autoLoad = this.tableJson.autoLoad;
            this.autoFocus = this.tableJson.autoFocus;
            this.lastSelectedId = null;
            this.selection = { all:false, include:[], exclude:[] };
            
            this.xhr = null;
            this.xhrDescription = null;
            this.xhrBusy = false;
            this.xhrCount = 0;

            this.bRegisterControl = true;

            if(typeof this.tableJson.tableJsonVariableName !== 'undefined')
                this.tableJsonVariableName = this.tableJson.tableJsonVariableName;
            else
                this.tableJsonVariableName = Liquid.getGlobalVarByContent(tableJsonString);

            // Runtime mode (no db) ?
            if(!isDef(this.tableJson.query)) {
                if(typeof this.tableJson.table === 'undefined' || !this.tableJson.table) {
                    var isFormX = Liquid.isFormX(this);
                    if(isFormX) { // Runtime mode allowed
                        for (var ic = 0; ic < this.tableJson.columns.length; ic++) {
                            if(typeof this.tableJson.columns[ic].field === 'undefined')
                                this.tableJson.columns[ic].field = String(ic + 1);
                        }
                        this.tableJson.columnsResolved = true;
                    } else { // Runtime mode not allowed
                        if(controlId !== 'liquidSelectTables' && controlId !== 'liquidSelectSchemas' && controlId !== 'liquidSelectDatabases') {
                            console.error("ERROR: table not defined on controlId:" + controlId);
                        }
                    }
                }
            }
            
            if(this.tableJson.mode === "auto" || this.tableJson.mode === "autoSync" || !this.tableJson.columnsResolved) {
                // get from server , or still to registter
                var onProcessServerResult = function(liquid) {
                    if(liquid.xhr.status === 200) {
                        try {
                            if(liquid.xhr.responseText) {
                                var resultTableJson = JSON.parse(JSON.stringify(liquid.tableJson));
                                var registeredTableJson = JSON.parse(liquid.xhr.responseText);
                                if(registeredTableJson.error) {
                                    alert("LIQUID Error : "+registeredTableJson.error);
                                } else {
                                    resultTableJson.mode = liquid.tableJson.mode !== 'auto' && liquid.tableJson.mode !== 'Sync' ? liquid.tableJson.mode : "";
                                    resultTableJson.database = registeredTableJson.database;
                                    resultTableJson.schema = registeredTableJson.schema;
                                    resultTableJson.columns = registeredTableJson.columns;
                                    resultTableJson.primaryKeyField = registeredTableJson.primaryKeyField;
                                    resultTableJson.primaryKey = registeredTableJson.primaryKey;
                                    resultTableJson.columnsResolved = registeredTableJson.columnsResolved;
                                    resultTableJson.columnsResolvedBy = registeredTableJson.columnsResolvedBy;
                                    if(typeof registeredTableJson.events !== 'undefined') resultTableJson.events = registeredTableJson.events;
                                    if(typeof registeredTableJson.commands !== 'undefined') resultTableJson.commands = registeredTableJson.commands;
                                    resultTableJson.tableJsonVariableName = liquid.tableJsonVariableName;
                                    resultTableJson.columnsResolved = true;
                                    resultTableJson.token = liquid.tableJson.token;
                                    if(liquid.tableJson.mode === 'auto') {
                                        resultTableJson.autoSizeColumns = false;
                                        resultTableJson.autoFitColumns = true;
                                        resultTableJson.autoselect = true;
                                    }

                                    if(liquid.mode === 'winX' || liquid.mode === 'WinX') {
                                        liquid.tableJson.mode = liquid.mode;
                                        if(liquid.tableJson.resize !== false)
                                            resultTableJson.resize = 'both';
                                    }

                                    return new LiquidCtrl(  liquid.controlId, liquid.outDivObjOrId, JSON.stringify(resultTableJson)
                                                            , liquid.sourceData
                                                            , liquid.tableJson.mode, parentObjId);
                                }
                                if(registeredTableJson.warning)
                                    console.warn(registeredTableJson.warning);
                            } else {
                                console.error(liquid.xhr.responseText);
                                console.error("ERROR: controlId:"+liquid.controlId+" mode:"+this.tableJson.mode+", ibvalid respons...check server log");
                            }
                        } catch (e) {
                            console.error(liquid.xhr.responseText);
                            console.error("ERROR: controlId:"+liquid.controlId+" mode:"+(typeof liquid.tableJson !== 'undefined' ? liquid.tableJson.mode : "unknown")+", error in response process:" + e);
                        }
                    } else {
                        console.error("ERROR: controlId:"+liquid.controlId+" mode :"+(typeof this.tableJson !== 'undefined' ? this.tableJson.mode : "unknown")+", wrong response:" + liquid.xhr.status);
                    }
                };

                Liquid.registerOnUnloadPage();
                if(!this.xhr)
                    this.xhr = new XMLHttpRequest();
                if(Liquid.wait_for_xhr_ready(this, "register control")) {
                    try {
                        if(typeof this.tableJson.schema === 'undefined')
                            if(this.tableJson.isSystem !== true) debugger;
                        
                        if(this.tableJson.mode === "auto") { // async
                            this.isAsyncResolve = true;
                            this.xhr.open('POST', glLiquidServlet + "?operation=auto"
                                    + "&controlId=" + this.controlId
                                    + "&table=" + (typeof this.tableJson.table !== 'undefined' ? this.tableJson.table : "")
                                    + "&schema=" + (typeof this.tableJson.schema !== 'undefined' ? this.tableJson.schema : "")
                                    + "&database=" + (typeof this.tableJson.database !== 'undefined' ? this.tableJson.database : "")
                                    + "&parentControlId=" + Liquid.getRootSourceControlId(this)
                                    );
                            this.xhr.send(JSON.stringify(this.tableJson));
                            var liquid = this;
                            this.xhr.onreadystatechange = function() {
                                if(liquid.xhr.readyState === 4) {
                                    Liquid.release_xhr(liquid);
                                    if(liquid.xhr.status === 200) {
                                        this.isAsyncResolveDone = true;
                                        this.promise = new Promise((param) => {
                                            retVal = onProcessServerResult(liquid);
                                        });
                                    }
                                }
                            };
                        } else if(this.tableJson.mode === "autoSync") { // sync
                            this.xhr.open('POST', glLiquidServlet + "?operation=auto"
                                    + "&controlId=" + this.controlId
                                    + "&table=" + this.tableJson.table
                                    + "&schema=" + (typeof this.tableJson.schema !== 'undefined' ? this.tableJson.schema : "")
                                    + "&database=" + (typeof this.tableJson.database !== 'undefined' ? this.tableJson.database : "")
                                    + "&parentControlId=" + Liquid.getRootSourceControlId(this)
                                    , false);
                            this.xhr.send(tableJsonString);
                            Liquid.release_xhr(this);
                            retVal = onProcessServerResult(this);
                        } else if(!this.tableJson.columnsResolved) { // sync
                            this.xhr.open('POST', glLiquidServlet + '?operation=registerControl'
                                    +'&controlId=' + (typeof this.tableJson.registerControlId !== "undefined" ? this.tableJson.registerControlId : this.controlId)
                                    +'&token=' + (typeof this.tableJson.token !== "undefined" ? this.tableJson.token : "")
                                    , false);
                            this.xhr.send(tableJsonString);
                            Liquid.release_xhr(this);
                            retVal = onProcessServerResult(this);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    
                } else {
                    alert("!!! " + this.controlId+" is till waiting for last operaion:"+this.xhrDescription+ " !!!");
                }
                this.bRegisterControl = false;
            }


            if(this.bRegisterControl) {

                glLiquids.push(this);

                // aggiunta link
                if(this.srcLiquid) {
                    if(!this.srcLiquid.linkedLiquids) this.srcLiquid.linkedLiquids = [];
                    if(this.srcLiquid.linkedLiquids.indexOf(this) < 0) {
                        this.srcLiquid.linkedLiquids.push(this);
                    }                        
                } else {
                    if(typeof this.srcLiquidControlId !== 'undefined' && this.srcLiquidControlId) {
                        // if(!this.srcLiquid.linkedLiquids) this.srcLiquid.linkedLiquids = [];
                        // this.srcLiquid.linkedLiquids.push(this.srcLiquidControlId);
                        glLiquidsPendingLoad.push( { controlId:this.srcLiquidControlId, targetLiquid:this } );
                    }
                }

                Liquid.initializeLiquid(this);
                
                this.tableJsonSource = JSON.parse(JSON.stringify(this.tableJson));
                
                this.gridOptions = {
                    liquidLink: this,
                    columnDefs: this.columnDefs,
                    defaultColDef: {
                        editable: true,
                        sortable: true,
                        resizable: true,
                        filter: true,
                        suppressMenu: true,
                        headerComponentParams: { menuIcon: "&#9776;", liquidLink:this, enableMenu:(typeof this.tableJson.headerMenu !== "undefined" ? this.tableJson.headerMenu : true) }
                    },
                    suppressMenuHide: true,
                    singleClickEdit: (typeof this.tableJson.singleClickEdit !== "undefined" ? this.tableJson.singleClickEdit : false),
                    groupSelectsChildren: false,
                    rowSelection: (typeof this.tableJson.rowSelection !== "undefined" ? this.tableJson.rowSelection : "single"),
                    rowMultiSelectWithClick: (typeof this.tableJson.rowMultiSelectWithClick !== "undefined" ? this.tableJson.rowMultiSelectWithClick : (this.tableJson.mode === "lookup"?true:false)),
                    rowDeselection: (typeof this.tableJson.rowDeselection !== "undefined" ? this.tableJson.rowDeselection : false),
                    editType: (typeof this.tableJson.editType !== "undefined" ? this.tableJson.editType : ''),
                    enableRangeSelection: false,
                    skipHeaderOnAutoSize: (typeof this.tableJson.skipHeaderOnAutoSize !== "undefined" ? this.tableJson.skipHeaderOnAutoSize : false),

                    stopEditingWhenGridLosesFocus: true,
                    suppressRowClickSelection: false,
                    suppressAggFuncInHeader: false,
                    paginationPageSize: this.pageSize,
                    pagination: this.pageSize > 0 ? true : false,
                    suppressPaginationPanel: true,
                    suppressScrollOnNewData: true,
                    animateRows: true,
                    overlayLoadingTemplate: (typeof this.tableJson.loadingMessage !== "undefined" ? this.tableJson.loadingMessage : Liquid.loadingMessage),
                    overlayNoRowsTemplate: (typeof this.tableJson.noRowsMessage !== "undefined" ? this.tableJson.noRowsMessage : Liquid.noRowsMessage),
        
                    components: {
                        agColumnHeader: LiquidGridHeader,
                        SystemEditor: SystemEditor,
                        SelectEditor: SelectEditor,
                        IntegerEditor: IntegerEditor,
                        FloatEditor: FloatEditor,
                        DateEditor: DateEditor
                    },

                    onRowSelected:function(event) {
                        if(event.type === "rowSelected") {
                            var isPhantomNode = false;
                            if(event.node.isSelected()) {
                                if(event.node.id !== this.liquidLink.lastSelectedId) {
                                    try {
                                        if(this.liquidLink.addingNode) {
                                            if(this.liquidLink.addingNode.id === event.node.id)
                                                isPhantomNode = true;
                                        }
                                        if(this.liquidLink.mode === "lookup") {
                                            if(this.liquidLink.status === "open")
                                                Liquid.onSetLookup(this.liquidLink, event);
                                            if(this.liquidLink.gridOptions.rowSelection !== "multiple")
                                                if(event.node.selected)
                                                    Liquid.onCloseLookup(this.liquidLink, event);
                                        }
                                        if(this.liquidLink.cRow !== event.node.rowIndex) {
                                            if(!isPhantomNode) {
                                                if(this.liquidLink.modifications) {
                                                    if(this.liquidLink.modifications.length>0) {
                                                        if(!this.liquidLink.tableJson.multilineEdit === true) {
                                                            Liquid.onCommand(this.liquidLink, "update");
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if(!isPhantomNode) {
                                            // Disable all tabs, ovoiding to see invalidated data
                                            Liquid.onForeignTablesDisableCascade(this.liquidLink);
                                            Liquid.refreshLinkedLiquids(this.liquidLink);
                                        }
                                        this.liquidLink.cRow = event.node.rowIndex;
                                        Liquid.updateStatusBar(this.liquidLink);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            } else {
                                // Unselect item on lookup
                                if(this.liquidLink.mode === "lookup") {
                                    if(this.liquidLink.status === "open") {
                                        Liquid.onSetLookup(this.liquidLink, event);
                                    }
                                }
                            }
                            if(event.node.id !== this.liquidLink.lastSelectedId) {
                                if(!isPhantomNode) {
                                    Liquid.processNodeSelected(this.liquidLink, event.node, event.node.isSelected());
                                }
                                Liquid.updateSelectionData(this.liquidLink);
                                Liquid.onForeignTablesMode(this.liquidLink);
                                Liquid.refreshGrids(this.liquidLink, event.data);
                                Liquid.refreshLayouts(this.liquidLink, false);
                                Liquid.refreshDocuments(this.liquidLink, false);
                                Liquid.refreshCharts(this.liquidLink, false);
                            }
                            if(event.node.isSelected()) {
                                if(event.node.id !== this.liquidLink.lastSelectedId) {
                                    Liquid.onEvent(this.liquidLink, "onRowSelected", event.data);
                                }
                                this.liquidLink.lastSelectedId = event.node.id;
                            } else {
                                Liquid.onEvent(this.liquidLink, "onRowUnSelected", event.data);
                                this.liquidLink.lastSelectedId = null;
                            }
                        }
                    },                    
                    onCellContextMenu:function(event) {
                        Liquid.onEvent(this.liquidLink, "onCellContextMenu", event.data);
                    },
                    onCellDoubleClicked:function(event) {
                        Liquid.onEvent(this.liquidLink, "onRowDoubleClicked", event.data);
                    },
                    onRowClicked:function(event) {
                        this.liquidLink.lastRowClickedNode = event.node;
                        Liquid.onEvent(this.liquidLink, "onRowClicked", event.data);
                    },
                    onCellClicked:function(event) {
                        this.liquidLink.lastCellCickedEvent = event;
                        Liquid.onEvent(this.liquidLink, "onCellClicked", event.data);
                    },
                    onSelectionChanged:function(event) {
                        if(event) {
                            var liquid = this.liquidLink;
                            var nodes = event.api.getSelectedNodes();
                            var rowsData = [];
                            for(var i=0; i<nodes.length; i++) {
                                rowsData.push( Liquid.getFullRecordData(liquid, nodes[i]) );
                            }
                            Liquid.onEvent(this.liquidLink, "onSelectionChanged", rowsData);
                        }
                    },
                    onGetSelection:function(event) { Liquid.onEvent(this.liquidLink, "onGetSelection", event); },
                    // getRowNodeId :function( data ) { return data.id; },
                    onDeselectAll:function(event) {
                        Liquid.onSelectAll(this.liquidLink, event);
                    },                    
                    onSelectAll:function(event) {
                        Liquid.onSelectAll(this.liquidLink, event);
                    },                    
                    isRowSelectable:function(event) {
                        if(this)
                            return Liquid.onEvent(this.liquidLink, "isRowSelectable", event.data).result;
                        return true;
                    },
                    rowClassRules: {
                        'odd_rows':function(params) {
                            return params.rowIndex % 2 ? 1 : 0;
                        },
                        'even_rows':function(params) {
                            return !(params.rowIndex % 2 ? 1 : 0);
                        }
                    },
                    onCellValueChanged:function(event) {
                        if(event.oldValue !== event.newValue) {
                            Liquid.onEvent(this.liquidLink, "onCellValueChanged", event.node);
                            var iCol = Number(event.column.colId) - 1;
                            if(iCol >= 0) {
                                if(this.liquidLink.tableJson.columns[iCol].isReflected === true)
                                    return;
                                var validateResult = Liquid.validateField(this.liquidLink, this.liquidLink.tableJson.columns[event.column.colId], event.newValue);
                                if(validateResult !== null) {
                                    if(validateResult[0] >= 0) {
                                        event.newValue = validateResult[1];
                                        Liquid.registerFieldChange(this.liquidLink, null, event.node.data[ this.liquidLink.tableJson.primaryKeyField ? this.liquidLink.tableJson.primaryKeyField : "1" ], event.column.colId, event.oldValue, event.newValue);
                                        Liquid.updateDependencies(this.liquidLink, this.liquidLink.tableJson.columns[iCol], null, event);
                                    }
                                }
                            }
                        }
                        if(typeof this.liquidLink.pendingCommand !== 'undefined' && this.liquidLink.pendingCommand) {
                            Liquid.onCommandBarClick.call(this.liquidLink.pendingCommand.obj);
                            this.liquidLink.pendingCommand = null;
                        }
                        if(event.node.isSelected()) {
                            Liquid.updateSelectionData(this.liquidLink);
                        }
                    },
                    onRowValueChanged:function(event) {
                        var data = event.data;
                        // console.log('onRowVa    lueChanged: (' + data.make + ', ' + data.model + ', ' + data.price + ', ' + data.field5 + ')');
                    },onFirstDataRendered:function(event) {
                        Liquid.setAutoresizeColumn(this.liquidLink, false);
                    },onGridReady:function(event) {
                    }
                    ,postSort:function(rowNodes) {
                        try { return Liquid.onEvent(this.gridOptionsWrapper.gridOptions.api.context.contextParams.seed.eGridDiv, "onSorted", rowNodes, null, null, true).result; } catch(e) { console.error(e); }
                    },
                    onGridSizeChanged:function(params) {
                        Liquid.onGridContainerSizeChanged(params.api.gridOptionsWrapper.gridOptions.liquidLink, params);
                    },
                    onBodyScroll:function(event) {
                        if(this.liquidLink) {
                            if(event.direction === "vertical") {
                                var gridScroller = this.liquidLink.aggridContainerObj.querySelector(".ag-body-viewport");
                                if(gridScroller) {
                                    var scrollSize = gridScroller.scrollHeight - gridScroller.offsetHeight;
                                    if(event.top === scrollSize) {
                                        if(this.liquidLink.enableOverscroll !== false) {
                                            if(this.liquidLink.nPages > this.liquidLink.cPage+1)
                                                Liquid.onBtNext(this.liquidLink.controlId);
                                                this.liquidLink.enableOverscroll = null;
                                        } else {
                                            this.liquidLink.enableOverscroll = true;
                                        }
                                    }
                                    if(event.top === 0) {
                                        if(this.liquidLink.enableOverscroll !== false) {
                                            if(this.liquidLink.cPage > 0)
                                                Liquid.onBtPrevious(this.liquidLink.controlId);
                                        } else {
                                            this.liquidLink.enableOverscroll = true;
                                        }
                                    }
                                } else console.error("ERROR : unable to get scrolller");
                            }
                        }
                    }
                };

                var isFormX = Liquid.isFormX(this);
                var isWinX = Liquid.isWinX(this);

                var setSize = false;
                if(this.mode === "popup") {
                    if(!this.outDivObj) {
                        this.outDivObj = document.createElement("div");
                        this.outDivObj.style.visibility = 'hidden';
                        this.outDivObj.id = this.outDivId;
                        this.outDivObj.style.position = 'absolute';
                        document.body.insertBefore(this.outDivObj, document.body.firstChild);
                        setSize = true;
                    }
                } else {
                    if(isWinX || isFormX) {
                        // Create div container
                        if(!this.outDivObj) {
                            this.outDivObj = document.createElement("div");
                            this.outDivObj.style.visibility = 'hidden';
                            this.outDivObj.id = this.outDivId;
                        	this.outDivObj.style.display = 'block';
                            if(isWinX) {
                            	this.outDivObj.style.position = 'relative';
                                this.outDivObj.style.left = '10px';
                                this.outDivObj.style.top = '10px';
                            } else if(isFormX) {
                            	this.outDivObj.style.position = 'absolute';
                                this.outDivObj.className += " liquidFormX";
                            }
                            this.outDivObjCreated = true;
                            document.body.insertBefore(this.outDivObj, document.body.firstChild);
                            setSize = true;
                        }
                    }
                }

                // set size/zindex
                if(setSize) {
                    if(!this.absoluteLoadCounter) {
                    	// var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
                    	// var scrollLeft = (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft;
                        var scrollTop = 0; // this.outDivObj.parentNode.scrollTop;
                        var scrollLeft = 0; // this.outDivObj.parentNode.scrollLeft;
                        Liquid.calScreePos(this);
                        if(typeof this.tableJson.width !== 'undefined') this.outDivObj.style.width = Liquid.getCSSDim(this.tableJson.width);
                        if(typeof this.tableJson.height !== 'undefined') this.outDivObj.style.height = Liquid.getCSSDim(this.tableJson.height);
                        var winHeight = window.innerHeight;
                        var winWidth = window.innerWidth;
                        if(this.tableJson.top === "center") {
                            this.outDivObj.style.top = (scrollTop + winHeight/2.0 - (this.outDivObj.clientHeight > 0 ? this.outDivObj.clientHeight:this.tableJson.height.replace("px",""))/2)+'px';
                        } else {
                            this.outDivObj.style.top = ((this.tableJson.top ? this.tableJson.top : Liquid.defaultWinXTop) + scrollTop) + 'px';
                        }                        
                        if(this.tableJson.left === "center") {
                            this.outDivObj.style.left = (scrollLeft + winWidth/2.0 - (this.outDivObj.clientWidth > 0 ? this.outDivObj.clientWidth:this.tableJson.width.replace("px",""))/2)+'px';
                        } else {
                            this.outDivObj.style.left = (this.tableJson.left ? this.tableJson.left : Liquid.defaultWinXLeft)+'px';
                        }
                    }
                    if(this.tableJson.zIndex)
                        this.outDivObj.style.zIndex = this.tableJson.zIndex;
                }
                

                if(typeof parentObjId !== 'undefined' && parentObjId) {
                    Liquid.setParent(this, parentObjId);
                }

                if(this.outDivObj) {
                    this.outDivObj.style.visibility = '';

                    var classStyle = getComputedStyle(this.outDivObj);
                    if(!classStyle.position || classStyle.position === 'static') {
                        this.outDivObj.style.position = 'relative';
                    }
                    
                    if(this.mode !== "lookup") {
                        this.outDivObj.style.minWidth = Liquid.iconincSize.wx+"px";
                        if(this.tableJson.overflow === 'hidden')
                            this.outDivObj.style.overflow = 'hidden';
                        else if(this.tableJson.overflow === 'auto' || this.tableJson.overflow === 'overlay')
                            this.outDivObj.style.overflow = 'auto';
                    }
                    this.rootObj = this.outDivObj;
                    this.outDivObj.className += " liquidTheme";

                    // link for lookup and others
                    try {
                        this.outDivObj.setAttribute('liquid', controlId);
                    } catch (e) {
                        console.error('ERROR : Control ' + this.outDivId + " not found.." + e);
                    }

                    // popup
                    if(this.mode === "popup" || isWinX) {
                        var title = (typeof this.tableJson.title !== 'undefined' ? this.tableJson.title : (typeof this.tableJson.caption  !== 'undefined' ? this.tableJson.caption : ''));
                        this.popupCaptionObj = document.createElement("div");
                        var captionButtonsHTML = "<table><tr><td style=\"height:100%\"><div id=\"" + controlId + ".caption\" style=\"width:100%\"><br/></td>";
                        if(isWinX) {
                            if(this.tableJson.captionButtons === 'undefined' || !this.tableJson.captionButtons) {
                                this.tableJson.captionButtons = [ 
                                     { width:12, height:12, background:"", image:"minimized.png", client:"Liquid.setWinXStatus(this, 'iconic/restore')", filter:"opacity(0.5)", padding:"3px" }
                                    ,{ width:12, height:12, background:"", image:"restored.png", client:"Liquid.setWinXStatus(this, 'maximized/minimized')", filter:"opacity(0.5)", padding:"3px" }
                                    ,{ width:12, height:12, background:"", image:"multiply.png", client:"Liquid.close(this)", padding:"3px" }
                                ];
                            }                            
                        }
                        var captionTitleHTML = "<div class=\"liquidPopupTitle\" style=\"pointer-events:none;\" title=\""+title+"\">" + title + "</div>";
                        if(this.tableJson.captionButtons) {
                            for(var ibt = 0; ibt < this.tableJson.captionButtons.length; ibt++) {
                                var captionButton = this.tableJson.captionButtons[ibt];
                                if(captionButton) {
                                    captionButtonsHTML += "<td style=\"width:1%\">"
                                            + "<img id=\"" + controlId + ".caption_button." + (ibt + 1) + "\" " 
                                            + (typeof captionButton.src !== 'undefined' ? " src=\"" + captionButton.src + "\"" : "") + " class=\"liquidCaptionBt\""
                                            + " title=\"" + (captionButton.title ? captionButton.title : "") + "\""
                                            + (typeof captionButton.src === 'undefined' ? (" src=\""+ (typeof captionButton.image !=='undefined' ? "" + Liquid.getImagePath(captionButton.image) + "" : "")+"\"") : "")
                                            + " style=\""
                                            + (captionButton.width ? "width:" + Liquid.getCSSDim(captionButton.width) + "; " : "")
                                            + (captionButton.height ? "height:" + Liquid.getCSSDim(captionButton.height) + "; " : "")
                                            + (captionButton.backgroundPosition ? "background-position:" + captionButton.backgroundPosition + "; " : "")
                                            + (captionButton.background ? "background:" + captionButton.background + "; " : "")
                                            + (captionButton.backgroundImage ? "background-image:" + captionButton.backgroundImage + "; " : "")
                                            + (captionButton.filter ? "filter:" + captionButton.filter + "; " : "")
                                            + (captionButton.padding ? "padding:" + captionButton.padding + "; " : "")
                                            + "\""
                                            + " onClick=\"" + (captionButton.client ? captionButton.client + (captionButton.client.indexOf("(") > 0 ? "" : "(this)") : "") + "\" /></td>";
                                }
                            }
                            captionButtonsHTML += "</tr></table>";
                        } else {
                            captionButtonsHTML = "<img id=\"" + controlId + ".popup.close\" src=\""+Liquid.getImagePath("exit.png")+"\" class=\"liquidPopupBt\" style=\"cursor:pointer\" onClick=\"Liquid.onClosing(this)\" />";
                        }
                        var searchHTML = (Liquid.projectMode || this.tableJson.search === true ? "<td style=\"width:1%; vertical-align:top;\"><input id=\""+controlId+".popup.search\" class=\"liquidCaptionSearch\" style=\"\" onkeypress=\"Liquid.onKeyPress(event, this)\"></td>" : "");
                        this.popupCaptionObj.innerHTML = "<table style=\"display:block;\"><tr>"
                                                        +"<td class=\"liquidPopupCaptionDragger\" id=\""+controlId+".caption_dragger\" style=\"overflow:hidden; word-break: break-all; text-overflow:ellipsis; height:inherit; display:block; \">"+captionTitleHTML+"</td>"
                                                        +searchHTML
                                                        +"<td style=\"width:1%; vertical-align:top;\">"+captionButtonsHTML+"</td></tr></table>";
                        this.popupCaptionObj.id = controlId + ".caption_container";                        
                        this.popupCaptionObj.className = "liquidPopupCaption";
                        this.popupCaptionObj.ondblclick = function(e) { Liquid.setWinXStatus(e.target, 'maximized/minimized'); };
                        // Liquid.setDraggable(this.popupCaptionObj);
                        this.rootObj.insertBefore(this.popupCaptionObj, this.outDivObj.firstChild);
                    }

                    // lookup
                    if(this.mode === "lookup") {
                        this.lookupObj = document.createElement("div");
                        this.lookupObj.id = controlId + ".lookup";
                        this.lookupObj.innerText = "";
                        this.linkedInputId = controlId + ".lookup.input";
                        var className = "";
                        if(this.tableJson.gridLink) className = "liquidGridControl";
                        if(this.tableJson.layoutLink) className = "liquidGridControl";
                        if(this.tableJson.filtertLink) className = "liquidFilterControl";
                        this.lookupObj.innerHTML = "<input id=\"" + this.linkedInputId + "\""
                                + " class=\"liquidLookup "+(className)+(this.tableJson.zoomable===true ? "liquidGridControlZoomable":"")+"\""
                                + " readony=\"readony\" autocomplete=\"off\" type=\"text\""
                                + " data-gridlink=\"" + (this.tableJson.gridLink ? this.tableJson.gridLink : "") + "\""
                                + " data-layoutlink=\"" + (this.tableJson.layoutLink ? this.tableJson.layoutLink : "") + "\""
                                + " data-filterlink=\"" + (this.tableJson.filtertLink ? this.tableJson.filtertLink : "") + "\""                        
                                + " PlaceHolder=\""+(typeof this.tableJson.placeHolder !== 'undefined' ? this.tableJson.placeHolder : "")+"\" onClick=\"Liquid.onOpenLookup(this)\"/>"
                                + "<div style=\"display:inline-block; float:right; position:relative; z-index:100; margin-left:-20px; top:1px; right:3;\">"
                                + "<img id=\"" + controlId + ".lookup.input.reset\" src=\""+Liquid.getImagePath("delete.png")+"\" onclick=\"Liquid.onResetLookup('"+controlId+".lookup.input')\" style=\"padding-top:3px; right:7px;\" width=\"16\" height=\"16\">"
                                + "</div>";
                        this.rootObj.insertBefore(this.lookupObj, this.rootObj.firstChild);

                        this.lookupHeight = (typeof this.tableJson.height !== 'undefined' ? this.tableJson.height : (this.outDivObj.clientHeight > Liquid.minLookupHeight ? this.outDivObj.clientHeight : this.outDivObj.clientWidth * 2/3));
                        this.lookupContainerObj2 = document.createElement("div");
                        this.lookupContainerObj2.id = controlId + ".lookup.combo";
                        this.lookupContainerObj2.style.width = "100%";
                        this.lookupContainerObj2.style.height = "0px";
                        this.lookupContainerObj2.style.display = "inline-block";
                        this.rootObj.appendChild(this.lookupContainerObj2);
                        // this.rootObj = this.lookupContainerObj;

                        this.lookupContainerObj = document.createElement("div");
                        this.lookupContainerObj.id = controlId + ".lookup.combo.shadow";
                        this.lookupContainerObj.style.width = "100%";
                        this.lookupContainerObj.style.height = "";
                        this.lookupContainerObj.style.position = "relative";
                        this.lookupContainerObj.style.display = "inline-block";
                        this.lookupContainerObj.style.zIndex = "150";                 
                        this.lookupContainerObj.style.boxShadow = "rgb(167, 167, 167) 5px 5px 7px 1px";
                        this.lookupContainerObj2.appendChild(this.lookupContainerObj);
                        this.rootObj = this.lookupContainerObj;
                        
                        try {
                            this.outDivObj.dataset.linkedInputId = this.linkedInputId;
                        } catch (e) {
                        }
                    }

                    if(this.tableJson.resize === true || this.tableJson.resize === 'both' || this.tableJson.resize === 'linked') {
                        if(this.tableJson.resize === true || this.tableJson.resize === 'both') {
                            if(this.outDivObj) {
                                this.outDivObj.style.resize = this.tableJson.resize;
                                this.outDivObj.style.overflow = 'hidden';
                            }
                        }
                        if(this.outDivObj) {
                            this.resizeObserver = new ResizeObserver(entries => {
                                if(this.outDivObj) {
                                    Liquid.onResize(this);
                                }
                            });
                            this.resizeObserver.observe(this.outDivObj);
                        }
                    }

                    if(this.tableJson.modeless || this.tableJson.modless) {
                        this.obscuringObj = document.createElement("div");
                        this.obscuringObj.style.position = 'fixed';
                        this.obscuringObj.style.height = this.obscuringObj.style.width = '100%';
                        this.obscuringObj.style.top = this.obscuringObj.style.left = '0';
                        this.obscuringObj.style.backgroundColor = 'rgba(127,127,127,0.7)';
                        this.obscuringObj.style.zIndex = 99000;
                        this.outDivObj.style.zIndex = this.zIndex = 132;
                        this.obscuringLastFilter = document.body.webkitFilter;
                        document.body.webkitFilter = 'blur(5px)';
                        document.body.insertBefore(this.obscuringObj, document.body.firstChild);
                        this.focusedZIndex = 100000;
                        this.zIndex = this.focusedZIndex;
                    } else {
                        this.focusedZIndex = 30000;
                    }

                    // Foreign table
                    this.lastForeignTabSelected = null;
                    this.lastForeignTabObjSelected = null;
                    this.foreignTables = null;
                    // Solving
                    if(typeof this.tableJson.foreignTables !== 'undefined' && this.tableJson.foreignTables) {
                        for(var i=0; i<this.tableJson.foreignTables.length; i++) {
                            Liquid.addForeignTable(this, this.tableJson.foreignTables[i], null, null);
                        }
                    }
                    // Creating
                    if(typeof this.foreignTables !== 'undefined' && this.foreignTables) {
                        this.foreignTablesVisible = typeof this.tableJson.foreignTablesVisible !== "undefined" ? this.tableJson.foreignTablesVisible : true;
                        if(this.foreignTablesVisible) {
                            this.foreignTablesObj = document.createElement("div");
                            this.foreignTablesObj.id = controlId + ".foreignTable.tabs";
                            this.foreignTablesObj.className = "liquidForeignTables";
                            Liquid.setDraggable(this.foreignTablesObj);
                            var ftHTML = "";
                            for(var ic=0; ic<this.foreignTables.length; ic++) {
                                if(this.foreignTables[ic].foreignTable) {
                                    if(this.foreignTables[ic].foreignColumn) {
                                        if(this.foreignTables[ic].column) {
                                            var foreignWrk = this.foreignTables[ic].foreignWrk ? this.foreignTables[ic].foreignWrk : null;
                                            var ftName = this.foreignTables[ic].name ? this.foreignTables[ic].name : this.foreignTables[ic].foreignTable;
                                            // tab
                                            var ftId = this.foreignTables[ic].foreignTable;
                                            var tabId = controlId + ".foreignTable." + ftId;
                                            var addingCode = "";
                                            if(Liquid.projectMode) addingCode = "<img src=\""+Liquid.getImagePath("add.png")+"\" id=\""+tabId+".adder"+"\" onClick=\"Liquid.onNewForeignTable(event)\" style=\"width:12px; height:12px; padding-left:10px; filter:grayscale(0.7); cursor:pointer\" />";
                                            var waitingCode = "<div class=\"lds-ring\" id=\""+tabId+".waiter"+"\"><div></div><div></div><div></div><div></div></div>";
                                            ftHTML += "<li><a href=\"javascript:void(0)\" id=\"" + tabId + "\" class=\"liquidTab\" onClick=\"Liquid.onForeignTable(this)\">" 
                                                    + ftName 
                                                    + addingCode 
                                                    + waitingCode 
                                                    + "</a>" 
                                                    + "</li>";
                                            // tab content and data
                                            this.foreignTables[ic].tabId = tabId;
                                            this.foreignTables[ic].contentObj = document.createElement("div");
                                            this.foreignTables[ic].contentObj.id = this.controlId + ".foreignTable." + ftId + ".content";
                                            this.foreignTables[ic].contentObj.className = "liquidForeignTablesContent";
                                            this.foreignTables[ic].controlObjectId = this.controlId + ".foreignTable." + ftId + ".content";
                                            this.foreignTables[ic].controlNameJson = { table: this.foreignTables[ic].foreignTable, mode:"auto"};
                                        }
                                    }
                                }
                            }
                            if(Liquid.projectMode) {
                                // New tab
                                ftHTML += "<li><a href=\"javascript:void(0)\" style=\"\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onNewForeignTable(event)\">" + "<img id=\"" + controlId + ".newForeignTable" + "\" src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; filter:grayscale(0.7); cursor:pointer\" />" + "</a></li>";
                            }
                            // tabs
                            this.homeTabId = controlId + ".homeTable." + this.tableJson.table;
                            var homeHTML = "<li><a href=\"javascript:void(0)\" id=\"" + this.homeTabId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onForeignTable(this)\">" + this.tableJson.table + "</a></li>";
                            this.foreignTablesObj.innerHTML = ""
                                    + "<div style=\"float:left; width:100%; text-align:center;\" id=\""+controlId+".foreignTable.container\" class=\"liquidForeignTablesContainer\"><ul>"
                                    + homeHTML
                                    + ftHTML
                                    + "</ul></div>";
                            this.rootObj.appendChild(this.foreignTablesObj);                          
                            Liquid.setTooltip(this.homeTabId, "Liquid.onHomeTooltip('"+this.homeTabId+"')");
                        }                        

                        // contenitori foreign tables
                        if(this.foreignTables.length > 0) {
                            for(var ic=0; ic<this.foreignTables.length; ic++) {
                                if(this.foreignTables[ic].contentObj) {
                                    this.rootObj.appendChild(this.foreignTables[ic].contentObj);
                                    this.foreignTables[ic].contentObj.style.height = (
                                            (this.mode !== "lookup" ? this.outDivObj.offsetHeight : 1)
                                            - (this.popupCaptionObj ? this.popupCaptionObj.offsetHeight : 0)
                                            - (this.lookupObj ? this.lookupObj.offsetHeight : 0)
                                            - (this.foreignTablesObj ? this.foreignTablesObj.offsetHeight : 0)
                                            ) + "px";
                                    this.foreignTables[ic].contentObj.style.visibility = "";
                                    this.foreignTables[ic].contentObj.style.display = 'none';
                                }
                            }
                            // contenitore home table
                            var ftId = this.tableJson.table;
                            this.homeTablesObj = document.createElement("div");
                            this.homeTablesObj.className = "liquidForeignTablesContent";
                            this.homeTablesObj.id = controlId + ".homeTable." + ftId + ".content";
                            this.rootObj.appendChild(this.homeTablesObj);
                            this.homeTablesGridContainerObj = document.createElement("div");
                            this.homeTablesGridContainerObj.id = controlId + ".homeTable." + ftId + ".grid_content";
                            this.homeTablesObj.appendChild(this.homeTablesGridContainerObj);
                            this.rootObj = this.homeTablesGridContainerObj;
                        }
                        for(var ic=0; ic<this.foreignTables.length; ic++) {
                            if(this.foreignTables[ic].foreignTable) {
                                if(this.foreignTables[ic].foreignColumn) {
                                    if(this.foreignTables[ic].column) {
                                        Liquid.transferFeatures(this.foreignTables[ic], this.foreignTables[ic].controlNameJson);
                                        var srcLiquidOrId = this;
                                        var srcControlId = this.controlId;
                                        if(this.foreignTables[ic].sourceLiquidControlId !== 'undefined' && this.foreignTables[ic].sourceLiquidControlId)
                                            srcLiquidOrId = this.foreignTables[ic].sourceLiquidControlId;

                                        if(typeof this.foreignTables[ic].controlNameJson['database'] === 'undefined' || !this.foreignTables[ic].controlNameJson['database']) {
                                            this.foreignTables[ic].controlNameJson['database'] = this.tableJson.database;
                                        }                                            
                                        if(typeof this.foreignTables[ic].controlNameJson['schema'] === 'undefined' || !this.foreignTables[ic].controlNameJson['schema']) {
                                            this.foreignTables[ic].controlNameJson['schema'] = this.tableJson.schema;
                                        }                                            
                                        if(typeof this.tableJson.resize !== 'undefined')
                                            this.foreignTables[ic].controlNameJson['resize'] = 'linked';
                                        
                                        this.foreignTables[ic].controlNameJson['token'] = this.tableJson.token;

                                        var waiterId = this.foreignTables[ic].tabId+".waiter";
                                        this.foreignTables[ic].controlNameJson.waitersId = [ waiterId ];

                                        // this.foreignTables[ic].liquid = ... Need sync exec
                                        new LiquidCtrl( this.foreignTables[ic].controlId, this.foreignTables[ic].controlObjectId, JSON.stringify(this.foreignTables[ic].controlNameJson)
                                                        ,{ liquidOrId:srcLiquidOrId, foreignWrk:this.foreignTables[ic].foreignWrk, foreignTable:this.foreignTables[ic].foreignTable, foreignColumn:this.foreignTables[ic].foreignColumn, column:this.foreignTables[ic].column, rootControlId:(this.rootControlId ? this.rootControlId : this.controlId) }
                                                        ,this.foreignTables[ic].controlNameJson.mode, null);                                                        
                                    }
                                }
                            }
                        }
                    }
                    
                    // Command bar
                    if(this.tableJson.commands) {
                        if(this.tableJson.commands.length > 0) {
                            this.commandsObj = document.createElement("div");
                            this.commandsObj.className = "liquidCommandBar";
                            this.commandsObj.style.display = "inline-flex";
                            this.commandsObj.id = controlId + ".commands";
                            Liquid.setDraggable(this.commandsObj);
                            this.rootObj.appendChild(this.commandsObj);
                            for(var i=0; i<this.tableJson.commands.length; i++) {
                                if(this.tableJson.commands[i]) {
                                    Liquid.buildCommandButton(this, this.tableJson.commands[i], this.commandsObj);
                                }
                            }
                            if(this.tableJson.commandBarVisible === false) {
                                this.commandsObj.style.display = "none";
                            }
                        }
                    };

                    // Creating filters
                    if(this.tableJson.filters) {
                        if(Array.isArray(this.tableJson.filters)) {
                            this.filtersJson = this.tableJson.filters;
                        } else {
                            this.filtersJson = [ this.tableJson.filters ];
                        }
                        this.curFilter = (typeof this.tableJson.curFilter !== 'undefined' ? this.tableJson.curFilter : 0);
                        if(this.curFilter > this.tableJson.filters.length) this.curFilter = 0;
                    }
                    if(this.filtersJson) {
                        if(this.filtersJson.length) {
                            Liquid.createFiltersTab(this, this.filtersJson);
                            Liquid.createFiltersLookups(this, this.filtersJson);
                            Liquid.createFiltersPickups(this, this.filtersJson);
                        }
                    }

                    // Creating grids/documents/layouts
                    var listTabHTML = "";
                    var gridTabHTML = "";
                    var layoutTabHTML = "";
                    var documentTabHTML = "";
                    var chartTabHTML = "";
                    var newTabHTML = "";
                    var listTabStyle = "";
                    var gridsTabStyle = "";
                    var layoutsTabStyle = "";
                    var documentsTabStyle = "";
                    var chartsTabStyle = "";
                    if( (this.tableJson.grids && this.tableJson.grids.length > 0)
                     || (this.tableJson.layouts && this.tableJson.layouts.length > 0)
                     || (this.tableJson.documents && this.tableJson.documents.length > 0)
                     || (this.tableJson.charts && this.tableJson.charts.length > 0)
                     ) {                     
                        this.gridTabsObj = document.createElement("div");
                        this.gridTabsObj.style.display="";
                        this.gridTabsObj.className = "liquidGridTables";
                        this.gridTabsObj.id = controlId + ".grid_tabs";
                        this.rootObj.appendChild(this.gridTabsObj);
                        if(this.tableJson.listTabVisible === false) listTabStyle = "style=\"display:none\"";
                        var gIdLast = controlId + ".grid_tab.0";
                        var gtName = this.tableJson.listTabTitle ? this.tableJson.listTabTitle : "List";
                        listTabHTML = "<li class=\"liquidTabSel\" "+listTabStyle+"><a href=\"javascript:void(0)\" id=\"" + gIdLast + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onGridTab(this)\">" + gtName + "</a></li>";
                        this.gridsFirstId = null;
                    }
                            
                    if(this.tableJson.grids) {
                        if(this.tableJson.grids.length > 0) {
                            for(var ig = 0; ig < this.tableJson.grids.length; ig++) {
                                var grid = this.tableJson.grids[ig];
                                for(var ic=0; ic<grid.columns.length; ic++) {
                                    if(typeof grid.columns[ic].field === "undefined") {
                                        var iField1B = Liquid.solveGridField(this, grid.columns[ic]);
                                        if(iField1B > 0) {
                                            grid.columns[ic].field = this.tableJson.columns[iField1B-1].field;
                                            grid.columns[ic].colLink1B = iField1B;
                                        } else {
                                            console.error("[LIQUID] Unlinked grid at:" + this.controlId + " field:" + grid.columns[ic].name);
                                        }
                                    } else {
                                        var iCol1B = number(grid.columns[ic].field);
                                        if(iCol1B > 0) {
                                            grid.columns[ic].colLink1B = iCol1B + 1;
                                        } else {
                                            console.error("[LIQUID] Unlinked grid at:" + this.controlId + " field:" + grid.columns[ic].name);
                                        }
                                    }
                                }
                                var gridObj = Liquid.createGrid(this, grid, ig + 1);
                                grid.gridObj = gridObj;
                                
                                grid.containerObj = document.createElement("div");
                                grid.containerObj.className = "liquidGridContainer";
                                grid.containerObj.id = controlId + ".grid_tab." + (ig+1) + ".content";
                                grid.containerObj.style.display = "none";                               
                                grid.containerObj.appendChild(grid.gridObj);                                
                                if(this.tableJson.gridsTabVisible === false || grid.tabVisible === false) gridsTabStyle = "style=\"display:none\"";                        
                                
                                var gId = controlId + ".grid_tab." + (ig + 1);
                                gtName = grid.title ? grid.title : grid.name;
                                gridTabHTML += "<li "+gridsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + gId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onGridTab(this)\">" + gtName + "</a></li>";
                            }

                            if(Liquid.projectMode) {
                                // New tab
                                newTabHTML += "<li><a href=\"javascript:void(0)\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onNewGrid(event)\">" + "<img id=\"" + controlId + ".newGrid" + "\" src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:12px; height:12px; filter:grayscale(0.7); cursor:pointer\" />" + "</a></li>";
                            }
                            // Append grid object and link to fields
                            for(var ig = 0; ig < this.tableJson.grids.length; ig++) {
                                var grid = this.tableJson.grids[ig];
                                this.rootObj.appendChild(grid.containerObj);
                                for(var ic=0; ic<grid.columns.length; ic++) {
                                    try {
                                        grid.columns[ic].linkedObj = document.getElementById(grid.columns[ic].linkedContainerId);
                                    } catch (e) {
                                    }
                                    if(typeof grid.columns[ic].colLink1B !== "undefined") {
                                        var col = grid.columns[ic].colLink1B > 0 ? this.tableJson.columns[grid.columns[ic].colLink1B - 1] : null;
                                        if(col && (Liquid.isNumeric(col.type))) {
                                            if(grid.columns[ic].linkedObj)
                                                grid.columns[ic].linkedObj.classList.add('liquidGridControlNumber');
                                        }
                                    }
                                }
                                for(var ic=0; ic<grid.columns.length; ic++) { if(typeof grid.columns[ic].colLink1B === "undefined") { console.error("ERROR : control:" + this.controlId + " grid:" + grid.name + " columns:" + grid.columns[ic].name + " NOT Resolved"); } }
                            }
                            Liquid.createGridsLookups(this, this.tableJson.grids);
                            Liquid.createGridsPickups(this, this.tableJson.grids);
                        }
                    }
                    if(this.tableJson.layouts) {
                        if(this.tableJson.layouts.length > 0) {
                            for(var il = 0; il < this.tableJson.layouts.length; il++) {
                                var layout = this.tableJson.layouts[il];
                                if(layout) {
                                    layout.pageLoaded = false;
                                    layout.pendingLink = true;
                                    layout.containerObj = document.createElement("div");
                                    layout.containerObj.className = "liquidLayoutContainer";
                                    layout.containerObj.id = controlId + ".layout_tab." + (il+1) + ".content";
                                    layout.containerObj.style.display = "none";
                                    this.rootObj.appendChild(layout.containerObj);
                                    if(this.tableJson.layoutsTabVisible === false || layout.tabVisible === false) layoutsTabStyle = "style=\"display:none\"";
                                    var layoutId = controlId + ".layout_tab." + (il + 1);
                                    var layoutName = layout.title ? layout.title : layout.name ? layout.name : "Layout";
                                    if(this.tableJson.listTabVisible === false) listTabStyle = "style=\"display:none\"";
                                    layoutTabHTML += "<li "+layoutsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + layoutId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onLayoutTab(this)\">" + layoutName + "</a></li>";
                                }
                            }
                        }
                    }
                    if(this.tableJson.documents) {
                        if(this.tableJson.documents.length > 0) {
                            for(var id = 0; id < this.tableJson.documents.length; id++) {
                                var doc = this.tableJson.documents[id];
                                if(doc) {
                                    doc.pageLoaded = false;
                                    doc.useIframe = true;
                                    if(doc.useIframe) doc.containerObj = document.createElement("iframe");
                                    else doc.containerObj = document.createElement("div");
                                    doc.containerObj.className = "liquidDocumentContainer";
                                    doc.containerObj.id = controlId + ".document_tab." + (id+1) + ".content";
                                    doc.containerObj.style.display = "none";
                                    this.rootObj.appendChild(doc.containerObj);
                                    if(this.tableJson.documentsTabVisible === false || doc.tabVisible === false) documentsTabStyle = "style=\"display:none\"";
                                    var docId = controlId + ".document_tab." + (id + 1);
                                    var docName = doc.title ? doc.title : doc.name ? doc.name : "Documents";
                                    documentTabHTML += "<li"+documentsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + docId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onDocumentTab(this)\">" + docName + "</a></li>";
                                }
                            }
                        }
                    }                       
                    if(this.tableJson.charts) {
                        if(this.tableJson.charts.length > 0) {
                            for(var ic=0; ic<this.tableJson.charts.length; ic++) {
                                var chart = this.tableJson.charts[ic];
                                if(chart) {
                                    chart.pageLoaded = false;
                                    chart.useIframe = true;
                                    if(chart.useIframe) chart.containerObj = document.createElement("iframe");
                                    else chart.containerObj = document.createElement("div");
                                    chart.containerObj.className = "liquidChartContainer";
                                    chart.containerObj.id = controlId + ".chart_tab." + (ic+1) + ".content";
                                    chart.containerObj.style.display = "none";
                                    this.rootObj.appendChild(chart.containerObj);
                                    if(this.tableJson.chartsTabVisible === false || chart.tabVisible === false) chartsTabStyle = "style=\"display:none\"";
                                    var chartId = controlId + ".chart_tab." + (ic + 1);
                                    var chartName = chart.title ? chart.title : chart.name ? chart.name : "Layout";
                                    chartTabHTML += "<li "+chartsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + chartId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onChartTab(this)\">" + chartName + "</a></li>";
                                }
                            }
                        }
                    }
                    // list/grids/layout/document tabs   
                    if(this.gridTabsObj) {
                        this.gridTabsObj.innerHTML = ""
                                + "<div style=\"display:block\" id=\""+controlId + ".gridTableTabs."+"\" class=\"liquidGridTablesTabs\" ><ul>"
                                + listTabHTML
                                + gridTabHTML
                                + layoutTabHTML
                                + documentTabHTML
                                + chartTabHTML
                                + newTabHTML
                                + "</ul></div>";
                        this.listGridTabObj = this.lastGridTabObj = document.getElementById(gIdLast);
                        Liquid.setDraggable(this.gridTabsObj);
                    }
                    // grid links
                    if(this.tableJson.grids) {
                        for(var ig = 0; ig < this.tableJson.grids.length; ig++) {
                            this.tableJson.grids[ig].gridTabObj = document.getElementById(controlId + ".grid_tab." + (ig + 1));
                        }
                    }
                    // layout links
                    if(this.tableJson.layouts) {
                        for(var il = 0; il < this.tableJson.layouts.length; il++) {
                            this.tableJson.layouts[il].layoutTabObj = document.getElementById(controlId + ".layout_tab." + (il + 1));
                        }
                    }

                    // Table object
                    this.listObj = document.createElement("div");
                    this.listObj.id = controlId + ".grid_tab.0.content";
                    this.listObj.className = "liquidGridContainer";
                    this.listObj.style.overflow = "auto";
                    // this.listObj.draggable = true;
                    this.rootObj.appendChild(this.listObj);
                    this.listObj.className += " ag-theme-balham liquidContainer";
                    var oldWarn = console.warn; console.warn = function() {}; 
                    try { this.grid = new window.agGrid.Grid(this.listObj, this.gridOptions); } catch(e) { console.error(e); }
                    console.warn = oldWarn;
                    if(this.grid) {
                        this.aggridContainerObj = this.listObj.lastChild;
                        if(this.aggridContainerObj) {
                            this.aggridContainerObj.className += " liquidGridTheme";
                            if(this.tableJson.listTabVisible === false) {
                                this.aggridContainerObj.style.visibility = 'hidden';
                                this.aggridContainerObj.style.display = 'none';
                            }                    
                            if(this.mode !== "lookup") {
                                this.aggridContainerObj.style.position = "initial";
                            } else {
                                if(typeof this.tableJson.width !== 'undefined') this.lookupContainerObj.style.width = Liquid.getCSSDim(this.tableJson.width);
                                if(typeof this.tableJson.height !== 'undefined') this.aggridContainerObj.style.height = Liquid.getCSSDim(this.tableJson.height);
                                else
                                    if(this.outDivObj) this.aggridContainerObj.style.height = this.outDivObj.offsetWidth / 2.0;
                            }
                        }
                        this.selectAll = Liquid.findSelectAll(this.aggridContainerObj);
                        if(this.selectAll) {
                            this.selectAll.id = controlId + ".selectAll";
                            this.selectAll.onclick = function(event) { Liquid.onSelectAll(this, event); };
                        }
                    }

                    // Barra navigazione
                    this.navVisible = typeof this.tableJson.navVisible !== "undefined" ? this.tableJson.navVisible : true;
                    if(this.navVisible) {
                        this.navObj = document.createElement("div");
                        this.navObj.className = "liquidNav";
                        this.navObj.id = controlId + ".navBar";
                        var navHTML = ""
                                + "<table style=\"width:100%; display: block;\" class=\"liquidNav\"><tr><td class=\"liquidErrorMessage\" style=\"width: 100%;\">"
                                + "<div id=\"" + this.controlId + ".error\" style=\"float:left; user-select:text;\" class=\"liquidError\"></div>"
                                + "</td><td style=\"width:1%;white-space:nowrap;\">"
                                + "<div id=\"" + controlId + ".Found\" style=\"\" class=\"liquidNavFound\"></div>"
                                + "</td><td class=\"liquidErrorCoords\" style=\"width:1%;white-space:nowrap;\">"
                                + "<div style=\"\" class=\"liquidNavInfo\">"
                                + "<span class=\"liquidNavLabel\">"
                                + ( Liquid.lang === 'eng' ? "Row" : "Riga" )
                                +":</span><span class=\"liquidValue\" id=\"" + controlId + ".cRow\"></span>"
                                + "<span class=\"liquidNavLabel\">/</span><span class=\"liquidValue\" id=\"" + controlId + ".nRows\"></span>"
                                + "<span class=\"liquidNavLabel\"> </span>";
                        if(this.pageSize>0) {
                                navHTML += "<span id=\"" + controlId + ".cPageContainer\" style=\"cursor:pointer\" onclick=\"Liquid.onGotoPage(this)\" class=\"liquidNavLabel\">Pag.:</span><input id=\"" + controlId + ".cPage\" type=\"mumber\" step=\"1\" min=\"1\" max=\"1\" class=\"liquidNavCurPage\" value=\"1\" onkeypress=\"return Liquid.onPageKeyPress(event, this)\" title=\""+Liquid.paginationTitleGoTo+"\" />"
                                        + "<span id=\"" + controlId + ".nPagesContainer\" style=\"cursor:pointer\" onclick=\"Liquid.onGotoPage(this)\" class=\"liquidNavLabel\">/</span><span id=\"" + controlId + ".nPages\" class=\"liquidValue\"></span>";
                        }
                        navHTML += "</div>"
                                + "</td><td style=\"width:1%;white-space:nowrap;\">"
                                + "<div class=\"liquidNavPages\">";
                        if(this.pageSize>0) {
                            navHTML += "<a class=\"liquidNavPage\" href=\"javascript:void(0)\" id=\"" + controlId + ".first\" title=\""+Liquid.paginationTitleFirst+"\" onclick=\"Liquid.onBtFirst(this)\"> &#x21f1; </a>"
                                    + "<a class=\"liquidNavPage\" href=\"javascript:void(0)\" id=\"" + controlId + ".prev\" title=\""+Liquid.paginationTitleNext+"\" onclick=\"Liquid.onBtPrevious(this)\"> &#x2191 </a>"
                                    + "<a class=\"liquidNavPage\" href=\"javascript:void(0)\" id=\"" + controlId + ".next\" title=\""+Liquid.paginationTitlePrevious+"\" onclick=\"Liquid.onBtNext(this)\"> &#x2193; </a>"
                                    + "<a class=\"liquidNavPage\" href=\"javascript:void(0)\" id=\"" + controlId + ".last\" title=\""+Liquid.paginationTitleLast+"\" onclick=\"Liquid.onBtLast(this)\"> &#x21f2; </a>";
                        }
                        navHTML += "</div>"
                                + "</td></tr></table>";
                        this.navObj.innerHTML = navHTML;
                        this.navObj.style.zIndex = this.mode === "lookup" ? "111" : "";
                        this.rootObj.appendChild(this.navObj);
                        Liquid.setDraggable(this.navObj);
                    }

                    // contenitori multipanels
                    if(this.tableJson.multipanels) {
                        if(this.tableJson.multipanels.length > 0) {
                            for(var ic=0; ic<this.tableJson.multipanels.length; ic++) {
                                if(typeof this.tableJson.multipanels[ic].height === 'undefined') 
                                    this.tableJson.multipanels[ic].height = 100;

                                var foreignWrk = this.tableJson.multipanels[ic].foreignWrk ? this.tableJson.multipanels[ic].foreignWrk : null;
                                var ftName = this.tableJson.multipanels[ic].name ? this.tableJson.multipanels[ic].name : this.tableJson.multipanels[ic].foreignTable;
                                var ftId = this.tableJson.multipanels[ic].foreignTable+"$"+this.tableJson.multipanels[ic].foreignColumn+"$"+this.tableJson.multipanels[ic].column;

                                this.tableJson.multipanels[ic].controlId = ftId + "@" + this.controlId;
                                this.tableJson.multipanels[ic].controlObjectId = this.controlId + ".multiPanels." + ftId + ".content";
                                this.tableJson.multipanels[ic].controlNameJson = { table: this.tableJson.multipanels[ic].foreignTable, mode:"auto" };

                                this.tableJson.multipanels[ic].contentObj = document.createElement("div");
                                this.tableJson.multipanels[ic].contentObj.id = this.tableJson.multipanels[ic].controlObjectId;
                                this.tableJson.multipanels[ic].contentObj.className = "liquidMultiPanelsContent";
                                this.tableJson.multipanels[ic].contentObj.style.height = this.tableJson.multipanels[ic].height+"px";
                                this.tableJson.multipanels[ic].contentObj.style.visibility = "";
                                this.tableJson.multipanels[ic].contentObj.style.display = '';
                                this.rootObj.appendChild(this.tableJson.multipanels[ic].contentObj);
                                if(typeof this.tableJson.multipanels[ic].title !== 'undefined') {
                                    this.tableJson.multipanels[ic].titleObj = document.createElement("div");
                                    this.tableJson.multipanels[ic].titleObj.id = this.tableJson.multipanels[ic].controlObjectId;
                                    this.tableJson.multipanels[ic].titleObj.className = "liquidMultiPanelsTitle";
                                    this.tableJson.multipanels[ic].titleObj.innerHTML = this.tableJson.multipanels[ic].titleObj.title;
                                    this.tableJson.multipanels[ic].contentObj.appendChild(this.tableJson.multipanels[ic].titleObj);
                                }
                            }
                            for(var ic=0; ic<this.tableJson.multipanels.length; ic++) {
                                if(this.tableJson.multipanels[ic].foreignTable) {
                                    if(this.tableJson.multipanels[ic].foreignColumn) {
                                        if(this.tableJson.multipanels[ic].column) {
                                            // options transfer
                                            Liquid.transferFeatures(this.tableJson.multipanels[ic], this.tableJson.multipanels[ic].controlNameJson);
                                            
                                            if(typeof this.tableJson.multipanels[ic].controlNameJson['driver'] === 'undefined' || !this.tableJson.multipanels[ic].controlNameJson['driver']) {
                                                this.tableJson.multipanels[ic].controlNameJson['driver'] = this.tableJson.driver;
                                            }                                            
                                            if(typeof this.tableJson.multipanels[ic].controlNameJson['database'] === 'undefined' || !this.tableJson.multipanels[ic].controlNameJson['database']) {
                                                this.tableJson.multipanels[ic].controlNameJson['database'] = this.tableJson.database;
                                            }                                            
                                            if(typeof this.tableJson.multipanels[ic].controlNameJson['schema'] === 'undefined' || !this.tableJson.multipanels[ic].controlNameJson['schema']) {
                                                this.tableJson.multipanels[ic].controlNameJson['schema'] = this.tableJson.schema;
                                            }
                                            this.tableJson.multipanels[ic].controlNameJson['token'] = this.tableJson.token;
                                            
                                            new LiquidCtrl( this.tableJson.multipanels[ic].controlId, this.tableJson.multipanels[ic].controlObjectId, JSON.stringify(this.tableJson.multipanels[ic].controlNameJson)
                                                            ,{ liquidOrId:this, foreignWrk:this.tableJson.multipanels[ic].foreignWrk, foreignTable:this.tableJson.multipanels[ic].foreignTable, foreignColumn:this.tableJson.multipanels[ic].foreignColumn, column:this.tableJson.multipanels[ic].column, rootControlId:(this.rootControlId ? this.rootControlId : this.controlId) }
                                                            , null);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Barra azioni
                    if(this.tableJson.actions) {
                        this.actionsObj = document.createElement("div");
                        this.actionsObj.className = "liquidActionBar";
                        this.actionsObj.id = controlId + ".actions";
                        this.rootObj.appendChild(this.actionsObj);
                        var tbl = document.createElement("table");
                        
                        tbl.id = controlId + ".action_content";
                        tbl.className = "liquidActionBarContent";
                        var tbody = document.createElement("tbody");
                        var tr = document.createElement("tr");
                        for(var i=0; i<this.tableJson.actions.length; i++) {
                            var td = document.createElement("td");
                            var bt = document.createElement("button");
                            bt.className = "liquidActionBt";
                            bt.style.borderWidth = "1px";
                            bt.style.borderStyle = "solid";
                            // div.onmouseover = Liquid.toolbarButtonMouseOver
                            // div.onmouseout = Liquid.toolbarButtonMouseOut
                            bt.onclick = Liquid.onCommandBarClick;
                            bt.style.pointerEvents = 'all';
                            bt.style.cursor = 'pointer';
                            bt.id = controlId + ".action." + this.tableJson.actions[i].name;
                            var size = this.tableJson.actions[i].size ? this.tableJson.actions[i].size : "32";
                            bt.innerHTML = "" + (this.tableJson.actions[i].img ? "<img class=\"liquidActionImg\" src=\"" + Liquid.getImagePath(this.tableJson.actions[i].img) + "\"" + " width=" + size + " height=" + size + " style=\"cursor:pointer\" />" : "")
                                    + (this.tableJson.actions[i].text ? "<div class=\"liquidActionText\" style=\"cursor:pointer\">" + this.tableJson.actions[i].text + "</div>" : "")
                                    + "";
                            td.appendChild(bt);
                            tr.appendChild(td);
                        }
                        tbody.appendChild(tr);
                        tbl.appendChild(tbody);
                        this.actionsObj.appendChild(tbl);
                        Liquid.setDraggable(this.actionsObj);
                    }

                    
                    this.waitingObj = document.createElement("div");
                    this.waitingObj.style.position = 'absolute';
                    this.waitingObj.style.display = 'none';
                    this.waitingObj.style.height = this.waitingObj.style.width = '100%';
                    this.waitingObj.style.top = this.waitingObj.style.left = '0';
                    this.waitingObj.style.backgroundColor = 'rgba(127,127,127,0.5)';
                    this.waitingObj.style.zIndex = 90000;
                    this.waitingObjAnim = document.createElement("div");
                    this.waitingObjAnim.className = "liquidloader";
                    this.waitingObj.appendChild(this.waitingObjAnim);
                    this.outDivObj.appendChild(this.waitingObj);
                    
                                        
                    // resize control
                    Liquid.onResize(this);

                    this.setVisible = function(bVisible) {
                        if(bVisible) {
                            this.outDivObj.style.visible = '';
                            this.outDivObj.style.display = '';
                        } else {
                            this.outDivObj.style.visible = '';
                            this.outDivObj.style.display = 'none';
                        }
                    };

                    
                    
                    
                    if(this.homeTablesObj)
                        Liquid.onForeignTable(document.getElementById(this.homeTabId));

                    if(this.mode === "lookup") {
                        if(this.status !== "open") {
                            Liquid.onCloseLookup(this);
                        } else {
                            Liquid.setFocus(this);
                        }
                    }

                    // popup / winX / formX
                    if(this.mode === "popup" || isWinX || isFormX) {
                        if(this.mode === "popup" || isWinX) {
                            dragElement(this.controlId, this.outDivObj);
                        } else if(isFormX) { 
                        }
                        Liquid.setFocus(this);
                        Liquid.onStart(this);
                        Liquid.onGridContainerSizeChanged(this, this.gridOptions);
                    }

                    var isRebuilding = typeof sourceData !== 'undefined' && sourceData ? sourceData.isRebuilding : false;
                    
                    if(this.tableJson) {
                        if(this.tableJson.autoLoad !== false || isRebuilding === true) {
                            if(isFormX) { 
                                // no data to load
                            } else {
                                Liquid.loadData(this, null);
                            }
                        } else if(Liquid.cleanData) { this.gridOptions.api.setRowData(null); this.gridOptions.api.clearFocusedCell(); this.lastSelectedId = null; }
                    }
                    
                    if(this.tableJson.listTabVisible === false) {
                        if(this.tableJson.grids && this.tableJson.grids.length > 0) {
                            Liquid.onGridTab(this.tableJson.grids[0].gridTabObj);
                        } else if(this.tableJson.layouts && this.tableJson.layouts.length > 0) {
                            Liquid.onLayoutTab(this.tableJson.layouts[0].layoutTabObj);
                        } else if(this.tableJson.documents && this.tableJson.documents.length > 0) {
                            Liquid.onDocumentTab(this.tableJson.documents[0].containerObj.id);
                        } else if(this.tableJson.charts && this.tableJson.charts.length > 0) {
                            Liquid.onChartTab(this.tableJson.charts[0].containerObj.id);
                        }
                    }

                    // Grids readonly
                    if(this.tableJson.grids && this.tableJson.grids.length > 0) {
                        for(var ig=0; ig<this.tableJson.grids.length; ig++) {
                            Liquid.onGridMode(this.tableJson.grids[ig].gridObj, "readonly");
                        }
                    }
                    // Layout loaded async...

                    // start inserting a row
                    if(this.tableJson.autoLoad !== false || isRebuilding === true) { // action onload disabled
                        var isAutoInsert = Liquid.isAutoInsert(this);
                        if(isFormX || isAutoInsert === true) {
                            var insertCommand = { name:"insert", server:"", client:"", isNative:true };
                            Liquid.onButton(this, insertCommand);
                        }
                    }

                    // Loading contents async
                    Liquid.loadLayoutsContent(this);
                    Liquid.loadDocumentsContent(this);
                    Liquid.loadChartsContent(this);
                    
                    // Align mode
                    if(typeof this.mode !== 'undefined' && this.mode !== null) 
                        this.tableJson.mode = this.mode;
                    
                    // Turn Off waiters
                    Liquid.showHideWaiters(this, false);
                    
                    
                } else {
                    console.warn("WARNING : HTML element " + this.outDivId+" not found on control:"+this.controlId+"\nIn order to display control you shoud define a valid HTML Element");
                }
            }
        } else {
            if(tableJsonString)
                console.error("No configuration defined at " + controlId);
        }
        
        this.pendingLoad = false;
        
        Liquid.processPendingLoad(this);
        
        if(typeof this.onLoaded !== 'undefined' && this.onLoaded) {
            for (var ie=0; ie<this.onLoaded.length; ie++) {
                var eventFunc = this.onLoaded[ie];
                if(eventFunc) {
                    try {
                        var result = eventFunc();
                    } catch(e) { console.error("ERROR: on event onLoaded:"+e); }
                }
            }
        }
        
        Liquid.dumpDependencies(this);
        
        return retVal;
        // } catch(e) { console.error(e) }
    }
}


class LiquidMenuXCtrl {
    constructor(outDivObjOrId, menuJsonString, options) {
        if(menuJsonString) {
            // Container
            this.options = options;
            // Container
            this.outDivObjOrId = outDivObjOrId;
            if(outDivObjOrId && typeof outDivObjOrId === "object" && outDivObjOrId.nodeType === 1) {
                this.outDivObj = outDivObjOrId;
                this.outDivId = outDivObjOrId.id;
            } else {
                this.outDivId = outDivObjOrId;
                this.outDivObj = document.getElementById(this.outDivId);
            }
            if(!this.outDivObj) {
                this.outDivObj = document.createElement("div");
                this.outDivObj.style.position = 'absolute';
                document.body.appendChild(this.outDivObj);
            }
            this.outDivObj.classList.add("liquidMenuX");
            
            this.selection = { all:false, include:[], exclude:[] };
            
            try {
                if(menuJsonString.startsWith("url(")) {
                    var jsonURL = menuJsonString.substring(4);
                    if(jsonURL.endsWith(")"))
                        jsonURL = jsonURL.substring(0, jsonURL.length - 1);
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', glLiquidServlet + '?operation=getJson&fileURL=' + jsonURL, false);
                    xhr.send();
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                // TODO: TEST
                                return LiquidMenuXCtrl(outDivObjOrId, xhr.responseText, options);
                            } else
                                console.error(xhr.responseText);
                        } catch (e) {
                            console.error(xhr.responseText);
                        }
                    }
                } else {
                    this.menuJson = menuJsonString ? JSON.parse(menuJsonString) : null;
                    this.menuJsonSource = JSON.parse(JSON.stringify(this.menuJson));
                }
            } catch (e) {
                console.error(menuJsonString);
                console.error("LiquidMenuXCtrl() : parse error:" + e);
            }

            var menuX = Liquid.getLiquid(this.menuJson.name);
            if(menuX) return menuX;
            
            this.controlId = this.menuJson.name;

            this.outDivObj.id = this.controlId + ".menuX";
            this.outDivObj.style.position="relative";
            this.outDivObj.style.display="table";
            this.lastMenuPopup = [];

            this.menuContainerId = this.controlId+".menuXContainer";
            this.menuContainerObj = document.getElementById(this.menuContainerId);
            if(!this.menuContainerObj) {
                this.menuContainerObj = document.createElement("div");
                this.menuContainerObj.id = this.menuContainerId;
                this.menuContainerObj.className = "liquidMenuXContainer";
                this.menuContainerObj.style.position = "relative";
                this.menuContainerObj.style.width = "100%";
                this.menuContainerObj.style.height = "100%";
                this.outDivObj.appendChild( this.menuContainerObj );
            }
                
            this.menuIconId = this.controlId+".menuXIconContainer";
            this.menuIconObj = document.getElementById(this.menuIconId);
            if(!this.menuIconObj) {
                this.menuIconObj = document.createElement("div");
                this.menuIconObj.id = this.menuIconId;
                this.menuIconObj.className = "liquidMenuXIcon liquidMenuXchange";
                this.menuIconObj.onclick = function() { Liquid.toggleMenu(this); };
                this.menuIconObj.style.position = "absolute";
                var menuIconHTML = "<div id=\""+this.controlId+".menuXIcon\" class=\"\" ><div class=\"liquidMenuXbar1\"></div><div class=\"liquidMenuXbar2\"></div><div class=\"liquidMenuXbar3\"></div></div>";
                this.menuIconObj.innerHTML = menuIconHTML;
                this.menuIconObj.style.zIndex = 92000;
                this.outDivObj.appendChild( this.menuIconObj );
            }
            
            if(this.menuJson.type === 'left') {
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    $( this.menuContainerObj ).resizable({handles:'e, w'});
                }
                this.outDivObj.style.left = '0px';
                this.outDivObj.style.top = '0px';
                this.menuContainerObj.style.width = this.menuJson.width !== 'undefined' ? Liquid.getCSSDim(this.menuJson.width) : '';
                this.menuContainerObj.style.height = this.menuJson.height !== 'undefined' ? Liquid.getCSSDim(this.menuJson.height) : 'calc(100% - 2px)';
                this.menuIconObj.style.top = "0px";
                this.menuIconObj.style.right = "0px";
                this.outDivObj.classList.add( 'liquidMenuXLeft');
                this.display = 'block';
            } else if(this.menuJson.type === 'right') {
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    $( this.menuContainerObj ).resizable({handles:'e, w'});
                }
                this.outDivObj.style.right = '0px';
                this.outDivObj.style.top = '0px';
                this.menuContainerObj.style.width = this.menuJson.width !== 'undefined' ? Liquid.getCSSDim(this.menuJson.width) : '';
                this.menuContainerObj.style.height = this.menuJson.height !== 'undefined' ? Liquid.getCSSDim(this.menuJson.height) : 'calc(100% - 2px)';
                this.menuIconObj.style.top = "0px";
                this.menuIconObj.style.left = "0px";
                this.outDivObj.classList.add( 'liquidMenuXRight');
                this.display = 'block';
            } else if(this.menuJson.type === 'top') {
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    $( this.menuContainerObj ).resizable({handles:'n, s'});
                }
                this.outDivObj.style.left = '0px';
                this.outDivObj.style.top = '0px';
                this.menuContainerObj.style.width = this.menuJson.width !== 'undefined' ? Liquid.getCSSDim(this.menuJson.width) : '100%';
                this.menuContainerObj.style.height = this.menuJson.height !== 'undefined' ? Liquid.getCSSDim(this.menuJson.height) : '';
                this.menuContainerObj.style.display = 'inline-flex';
                this.menuIconObj.style.display = "inline";
                this.menuIconObj.style.right = "0px";
                this.outDivObj.classList.add( 'liquidMenuXTop');
                // this.style.display = 'inline-flex';
                this.display = 'inline-flex';
            } else if(this.menuJson.type === 'bottom') {
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    $( this.menuContainerObj ).resizable({handles:'n, s'});
                }
                this.outDivObj.style.left = '0px';
                this.outDivObj.style.bottom = '0px';
                this.menuContainerObj.style.width = this.menuJson.width !== 'undefined' ? Liquid.getCSSDim(this.menuJson.width) : '100%';
                this.menuContainerObj.style.height = this.menuJson.height !== 'undefined' ? Liquid.getCSSDim(this.menuJson.height) : '';
                this.menuContainerObj.style.display = 'inline-flex';
                // this.menuIconObj.style.top = "";
                this.menuIconObj.style.right = "5px";
                this.outDivObj.classList.add( 'liquidMenuXBottom');
                // this.style.display = 'inline-flex';
                this.display = 'inline-flex';
            } else {
                console.warn("WARNING: menu type '"+this.menuJson.type+"' not recognezed");
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    $( this.menuContainerObj ).resizable({handles:'e, w'});
                }
                this.outDivObj.style.left = '0px';
                this.outDivObj.style.top = '0px';
                this.menuContainerObj.style.width = this.menuJson.width !== 'undefined' ? Liquid.getCSSDim(this.menuJson.width) : '';
                this.menuContainerObj.style.height = this.menuJson.height !== 'undefined' ? Liquid.getCSSDim(this.menuJson.height) : 'calc(100% - 2px)';
                this.menuIconObj.style.top = "0px";
                this.menuIconObj.style.right = "0px";
                this.classList.add( 'liquidMenuXLeft');
                this.display = 'block';
                this.menuJson.type = 'left';
            }
            
            this.menuContainerObj.style.display = this.display;
            this.outDivObj.style.zIndex = 90000;
            
            if(this.menuJson.resize === true || this.menuJson.resize === 'both') {
                if(this.outDivObj) {
                    // this.outDivObj.style.overflow = 'hidden';
                    this.resizeObserver = new ResizeObserver(entries => {
                        Liquid.onResize(this);
                    });
                    this.resizeObserver.observe(this.outDivObj);
                }
            }
            
            
            this.menuCommands = [];
            if(typeof this.menuJson.accordions !== 'undefined') {
                for(var i=0; i<this.menuJson.accordions.length; i++) {
                    Liquid.buildMenuXAccordion(this, this.menuJson.accordions[i], this.menuContainerObj, 0);
                }
            }
            if(typeof this.menuJson.commands !== 'undefined') {
                for(var i=0; i<this.menuJson.commands.length; i++) {
                    Liquid.buildMenuXCommand(this, this.menuJson.commands[i], this.menuContainerObj, null, 0);
                }
            }

            glLiquids.push(this);

            this.position = Liquid.getHTMLElementOffset(this.outDivObj);
            if(this.outDivObj.offsetWidth > 0 && this.outDivObj.offsetHeight) {
                console.warn("WARNING: menu "+outDivObjOrId+" not visible");
            }
            this.stateMoving = false;
            
            if(this.menuJson.status === 'closed') {
                Liquid.toggleMenu(this.menuIconObj);
            }
            
            return this;
        }
        return null;
    }
}
    

var Liquid = {

    version: 1.099,
    controlid:"Liquid framework",
    debug:false,
    debugWorker:false,
    curDriver:"",
    curConnectionURL:"",
    curDatabase:"",
    curSchema:"",    
    cleanData:true,
    lang:"it",
    dateSep:'/',
    timeSep:':',
    CMD_WAIT_FOR_ENABLE: 10,
    CMD_ENABLED: 15,
    CMD_VALIDATE: 20,
    CMD_EXECUTE: 30,
    minLookupHeight : 50,
    richText: {Size: 2000, maxLength: 4000, rows: 10, cols: 50},
    defaultFilterName:'default',
    pageSize:100,
    projectMode:false,
    undetectedColumnMessage:"[N/D]",
    undetectedColumnColor:"red",
    loadingMessage:"<span class=\"ag-overlay-loading-center\">Caricamentio dati...</span>",
    noRowsMessage:"<span class=\"ag-overlay-loading-center\">Nessuna dato trovato...</span>",
    iconincSize: { wx:175, wy:26 },
    paginationTitleGoTo:"type page to go to ... then press enter",
    paginationTitleFirst:"go to first page",
    paginationTitlePrevious:"go to previous page",
    paginationTitleNext:"go to next page",
    paginationTitleLast:"go to last page",
    askForSaveTitle:"QUESTION",
    askForSaveMessage:"Save control's configuration ?",
    foundText:"Found at R:${rec} - C:${col}",
    defaultWinXLeft:10,
    defaultWinXTop:10,
    defaultMultipanelHeight:50,
    NoSelectedFileMessage:"File not selected",
    FileTooBigMessage:"File too big",
    Save:"Save",
    Discharge:"Discharge",
    minIntervalReadWorkers:250,
    defaultIntervalReadWorkers:15000,
    reloadDataOnFocus:false,
    statusBarHeight:30,
    statusMessagePersistMsec:5000,
    curMessageBusy:false,
    curMessageDealyTimeSec:10,
    registeredOnUnloadPage:false,
    onClosePageReturn:null,
    dynamicFilterMinTime:200,
    userConnectionList:[],
    loadDBInitialSize: (2 * 1024 * 1024),
    loadDBversion:2,
    
    setLanguage:function(lang) {
        if(lang === 'en' || lang === 'eng') {
            Liquid.lang = 'eng';
            Liquid.loadingMessage = "<span class=\"ag-overlay-loading-center\">Loading data...</span>";
            Liquid.noRowsMessage = "<span class=\"ag-overlay-loading-center\">No data to show...</span>";
            Liquid.paginationTitleGoTo = "digita la pagina a cui andare ... poi premi enter";
            Liquid.paginationTitleFirst = "vai alla prima pagina";
            Liquid.paginationTitlePrevious = "vai alla pagina precedente";
            Liquid.paginationTitleNext = "vai alla pagina seguente";
            Liquid.paginationTitleLast = "vai all'ultima";
            Liquid.askForSaveMessage = "Salvare la configurazione del controllo ?";
            Liquid.foundText = "Trovato a R:${rec} - C:${col}";
        }
    },
    getLiquid:function(searchingNameOrObject) {
        try {
            if(searchingNameOrObject) {
                var searchingNames = null;
                if(searchingNameOrObject instanceof LiquidCtrl) {
                    return searchingNameOrObject;
                } else if(searchingNameOrObject instanceof LiquidMenuXCtrl) {
                    return searchingNameOrObject;
                } else if(typeof searchingNameOrObject === "object") {
                    searchingNames = searchingNameOrObject.id.split(".");
                } else if(typeof searchingNameOrObject === "string") {
                    searchingNames = searchingNameOrObject.split(".");
                    if(typeof searchingNames === "undefined")
                        searchingNames = [searchingNameOrObject];
                } else {
                    console.error("getLiquid:undetected type of search:" + (typeof searchingNameOrObject));
                }
                for(var i=0; i<glLiquids.length; i++) {
                    if(glLiquids[i].controlId === searchingNames[0])
                        return glLiquids[i];
                }
            }
        } catch (e) { console.error(e); }
        return null;
    },    
    getLiquidByFullScan:function(obj) {
        while(obj) {
            liquid = Liquid.getLiquid(obj);
            if(liquid) return liquid;
            obj = obj.parentNode;
        }
    },
    buildCommandParams:function(liquid, command) {
        if(liquid || command) {
            // command.name, command.params, command.server, command.client, command.isNative
            var controlIdList = command.params;
            var liquidProcessed = false;
            var liquidCommandParams = {
                liquid: ( liquid ? liquid : { xhr: null, controlId: "", command: {} } ),
                obj: null, 
                command: command,
                params: []
            };
            if(controlIdList) {
                for(var io = 0; io < controlIdList.length; io++) {
                    var paramObj = document.getElementById(controlIdList[io]);
                    var pLiquid = Liquid.getLiquid(paramObj);
                    if(pLiquid) {
                        if(pLiquid === liquid) liquidProcessed = true;
                        var selectionData = Liquid.getSelectedPrimaryKeys(pLiquid);
                        var idsSelected = selectionData[0];
                        var idsUnselected = selectionData[1];
                        try {
                            liquidCommandParams.params.push(
                                    JSON.parse(
                                        "{\"name\":\"" + pLiquid.controlId + "\"" 
                                        + (idsSelected ? ",\"sel\":[" + idsSelected + "]" : "" )
                                        + (idsUnselected ? ",\"unsel\":[" + idsUnselected + "]"  : "" )
                                        + "}"
                                    )
                                );
                        } catch (e) {
                            console.error(e);
                        }
                        if(!liquidCommandParams.liquid.controlId)
                            liquidCommandParams.liquid.controlId = liquid.controlId;
                    } else {
                        // No liquid object : is form ?
                        if(paramObj) {
                            if(paramObj.nodeName) {
                                if(paramObj.nodeName.toUpperCase() === 'FORM') {
                                    var frm_elements = paramObj.elements;
                                    var dataList = "";
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
                                                dataList += (dataList.length?",":"") + "\""+field_name+"\":\""+field_value+"\"";
                                            }
                                        }
                                    }
                                    $(document).on('submit', '#'+paramObj.id, function() { // avoid page reload
                                        return false;
                                    });                            
                                    liquidCommandParams.params.push(JSON.parse("{\"form\":\"" + (paramObj.id ? paramObj.id : paramObj.name) + "\"" +",\"data\":{" + dataList + "}" + "}"));
                                }
                            }
                        }
                    }
                }
            }
            if(liquid) {
                var isFormX = Liquid.isFormX(liquid);
                if(isFormX) {
                    var formX = isFormX ? Liquid.getAddingRowAsString(liquid, liquid.addingRow) : "";
                    liquidCommandParams.params.push(JSON.parse("{\"formX\":[" + formX + "] }"));
                    }            
                if(liquid.modifications) {
                    liquidCommandParams.params.push({modifications: liquid.modifications});
                }
                if(!liquidProcessed) {
                    // add selection of this liquid
                    if(liquid instanceof LiquidCtrl) {
                        var selectionData = Liquid.getSelectedPrimaryKeys(liquid);
                        var idsSelected = selectionData[0];
                        var idsUnselected = selectionData[1];
                        try {
                            liquidCommandParams.params.push(
                                    JSON.parse(
                                        "{\"name\":\"" + liquid.controlId + "\"" 
                                        + (idsSelected ? ",\"sel\":[" + idsSelected + "]" : "" )
                                        + (idsUnselected ? ",\"unsel\":[" + idsUnselected + "]"  : "" )
                                        + "}"
                                    )
                                );
                        } catch (e) { console.error(e); }
                        // Add selection of all parents control
                        if(liquid.srcLiquidControlId) {
                            var curLiquid = liquid;
                            while(curLiquid) {
                                if(typeof curLiquid.srcLiquidControlId !== 'undefined' && curLiquid.srcLiquidControlId) {
                                    try {
                                        curLiquid = Liquid.getLiquid(curLiquid.srcLiquidControlId);
                                        if(curLiquid instanceof LiquidCtrl) {
                                            var selectionData = Liquid.getSelectedPrimaryKeys(curLiquid);
                                            var idsSelected = selectionData[0];
                                            var idsUnselected = selectionData[1];
                                            liquidCommandParams.params.push(
                                                    JSON.parse(
                                                        "{\"name\":\"" + curLiquid.controlId + "\"" 
                                                        + (idsSelected ? ",\"sel\":[" + idsSelected + "]" : "" )
                                                        + (idsUnselected ? ",\"unsel\":[" + idsUnselected + "]"  : "" )
                                                        + "}"
                                                )
                                            );
                                        }
                                    } catch (e) { console.error(e); }
                                } else {
                                    curLiquid = null;
                                }
                            }
                        }
                    }
                }
            }
            return liquidCommandParams;
        };
    },
    solveExpressionField:function(obj, propName, liquid) {
        return Liquid.solveExpressionFieldOnRow(obj, propName, liquid, null);
    },
    solveExpressionFieldOnRow: function (obj, propName, liquid, iRow) {
        var retVal = null;
        if(obj) {
            if(typeof obj === 'object') {
                // solve and backup object property
                var sourcePropName = "source" + propName;
                if(typeof obj[sourcePropName] !== 'undefined') {
                    obj[propName] = obj[sourcePropName];
                }
                if(typeof obj[propName] !== 'undefined') {
                    if(obj[propName].startsWith("@")) {
                        var targetObj = Liquid.getObjectByName(liquid, obj[propName].substring(1));
                        if(targetObj) {
                            var nameItems = obj[propName].substring(1).split(".");
                            obj[sourcePropName] = obj[propName];
                            retVal = obj[propName] = Liquid.getObjectProperty(targetObj, obj[propName].substring(1 + nameItems[0].length + 1));
                        }
                    }
                }
            } else if(typeof obj === 'string') {
                // replace values by search in dataset or in globar var
                retVal = "";
                for (var ic = 0; ic < obj.length; ic++) {
                    var s = ic;
                    var e = ic;
                    if(obj[ic] === '@') {
                        ic++;
                        if(obj[ic] === '{') {
                            // in dataset
                            s = ic + 1;
                            while (obj[ic] !== '}' && ic < obj.length)
                                ic++;
                            e = ic;
                            var searchingProp = obj.substring(s, e);
                            if(searchingProp) {
                                var col = Liquid.getColumn(liquid, searchingProp);
                                if(col) {
                                    var isFormX = Liquid.isFormX(liquid);
                                    var nodes = null;
                                    if(typeof liquid.gridOptions !== 'undefined') {
                                        if(typeof liquid.gridOptions.api !== 'undefined') {
                                            nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                        }
                                    }
                                    var value = "";
                                    if(nodes && iRow !== null && typeof iRow !== 'undefined') {
                                        value = nodes[iRow].data[col.field];
                                    } else {
                                        if(isFormX) {
                                            if(liquid.addingRow) {
                                                value = liquid.addingRow[col.field];
                                            }
                                        }
                                    }
                                    retVal += value ? value : "''";
                                }
                            }
                        } else {
                            // in global var
                            var targetObj = Liquid.getObjectByName(liquid, obj.substring(ic));
                            if(targetObj) {
                                retVal = Liquid.getObjectProperty(targetObj, obj.substring(ic));
                            }
                        }
                    } else {
                        retVal += obj[ic];
                    }
                }
            } else {
                console.warn("WARNING: solveExpressionField(): unknown operation to do on type:" + (typeof obj));
                retVal = obj;
            }
        }
        return retVal;
    },
    getObjectByName: function (liquid, propertyName) {
        var targetObj = null;
        var nameItems = propertyName.split(".");
        var targetJson = null;
        var targetObj = nameItems[0] === 'this' ? liquid : Liquid.getLiquid(nameItems[0]);
        if(targetObj) {
            if(targetObj instanceof LiquidCtrl)
                targetObj = targetObj.tableJson;
        } else {
            targetObj = Liquid.getProperty(nameItems[0]);
            if(targetObj) {
                if(typeof targetObj === 'string') {
                    try {
                        targetObj = JSON.parse(targetObj);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
        return targetObj;
    },
    setField: function (liquid, name, value) {
        if(liquid) {
            for (var ic = 0; ic < liquid.tableJson.columns.length; ic++) {
                if(liquid.tableJson.columns[ic].name === name) {
                    var col = liquid.tableJson.columns[ic];
                    if(liquid.addingNode) {
                        liquid.addingNode.data[col.field] = value;
                    }
                    if(liquid.addingRow) {
                        liquid.addingRow[col.field] = value;
                    }
                    Liquid.updateDependencies(liquid, col, null, null);
                }
            }
        }
    },
    registerFieldChange:function(liquid, nodeId, rowId, field, oldValue, newValue) {
        if(liquid) {
            if(typeof rowId !== 'undefined' && typeof newValue !== 'undefined') {
                if(!liquid.modifications)
                    liquid.modifications = new Array();
                var recFound = null;
                var fieldFound = null;
                for(var im = 0; im < liquid.modifications.length; im++) {
                    var modification = liquid.modifications[im];
                    if(modification) {
                        if(modification.rowId === rowId && modification.nodeId === nodeId) {
                            recFound = modification;
                            if(modification.fields) {
                                for(var iF = 0; iF < modification.fields.length; iF++) {
                                    var mField = modification.fields[iF];
                                    if(field === mField.field) {
                                        fieldFound = mField;
                                        break;
                                    }
                                }
                                if(fieldFound) break;
                            }
                        }
                    }
                }
                if(!recFound) {
                    var primaryKeyFound = true;
                    if(rowId !== null && rowId !== '') { // Verify primary key exist
                        if(!Liquid.getNodeIndexByPrimaryKey(liquid, rowId)) {
                            primaryKeyFound = false;
                        }
                    }
                    if(primaryKeyFound) {
                        liquid.modifications.push({ nodeId:nodeId, rowId:rowId, fields:[{field: field, value: newValue}]});
                    } else {
                        console.error("ERROR: unable to modify node by primary key:"+rowId);
                    }
                } else {
                    if(!fieldFound)
                        recFound.fields.push({field: field, value: newValue});
                    else
                        fieldFound.value = newValue;
                }
                
                if(Liquid.debug) {
                    console.warn(liquid.tableJson.table + " n.modifications:" + liquid.modifications.length);
                    for(var r = 0; r < liquid.modifications.length; r++) {
                        for(var c = 0; c < liquid.modifications[r].fields.length; c++) {
                            console.warn(liquid.tableJson.table + " rowId:" + liquid.modifications[r].rowId + " field:" + liquid.modifications[r].fields[c].field + " value:" + liquid.modifications[r].fields[c].value);
                        }
                    }
                }
                if(rowId === '' || rowId === null) {
                    try {
                        if(liquid.addingNode) {
                            liquid.addingNode.data[field] = newValue;
                        }
                        if(liquid.addingRow) {
                            liquid.addingRow[field] = newValue;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    },   
    createStatusDiv:function(parentObj, parentObjId) {
        var div = null;
        if(parentObj) {
            div = document.getElementById(parentObjId+"Status");
            if(!div) {
                div = document.createElement("div");
                div.id = parentObjId+"Status";
                div.className = "liquidWinXContainerStatus";
                div.style.color="gray";
                div.style.width = "calc( 100% - 20px )";
                div.style.borderBottom = "1px solid lightgrey";
                div.style.height = Liquid.statusBarHeight+"px";
                div.style.textAlign="left";
                div.style.verticalAlign="middle";
                div.style.position="absolute";
                div.style.top = "0px";
                div.style.left = "10px";
                parentObj.appendChild(div);
            }
        }
        return div;
    },    
    getStatusDiv:function(liquid) {
        var outDiv = null;
        if(liquid) {
            if(liquid.parentObjStatus) outDiv = liquid.parentObjStatus;
        } else {
            outDiv = document.getElementById("WinXContainer"+"Status");
        }
        return outDiv;
    },
    resetStatusDiv:function(liquid) {
        var outDiv = Liquid.getStatusDiv(liquid);
        if(outDiv) outDiv.innerHTML = "";
    },
    setErrorDiv:function(liquid, b64error) {
        if(liquid) {
            if(liquid.controlId) {
                var errorDiv = document.getElementById("" + liquid.controlId + ".error");
                if(errorDiv) {
                    try { 
                        errorDiv.innerHTML = b64error ? atob(b64error) : "";
                    } catch (e) { 
                        console.error("ERROR:"+e);
                    }                                            
                }
            }
        }
    },
    onTransferDownloadingProgress:function(e, liquid, lastResponseLen, outDiv, commandOrEvent, userCallback, userCallbackParam) {
        try {
            var bShowMessageToStatusBar = false;
            var this_response, response = e.currentTarget.response;
            if(lastResponseLen === false || typeof lastResponseLen === 'undefined'){
                this_response = response;
                lastResponseLen = response.length;
            } else {
                this_response = response.substring(lastResponseLen);
                lastResponseLen = response.length;
            }
            while(this_response) {
                var next_response = null;
                var keyString = '<Liquid>';
                var si = this_response.indexOf(keyString);
                if(si !== -1) {
                    this_response = this_response.substring(si+keyString.length);
                }
                keyString = '</Liquid>';
                var ei = this_response.indexOf(keyString);
                if(ei !== -1) {
                    bShowMessageToStatusBar = true;
                    next_response = this_response.substring(ei+keyString.length);
                    this_response = this_response.substring(0, ei);
                    if(Liquid.debug) {
                        console.debug(" ------------------------------------------------------------");
                        console.debug(" PROCESSSING Liquid TAG : this_response : "+this_response);
                        console.debug(" controlId : "+liquid.controlId);
                    }
                    try {
                        var keyMessageIndex = this_response.indexOf("serverMessage:");
                        var keyScriptIndex = this_response.indexOf("serverScript:");
                        var keyCallbackIndex = this_response.indexOf("serverCallback:");
                        if(keyMessageIndex >=0) {
                            bShowMessageToStatusBar = false;
                            var sMessageJson = this_response.substring(keyMessageIndex+14);
                            try {
                                var messageJson = JSON.parse(sMessageJson);
                                if(messageJson) {
                                    Liquid.showServerMessage(atob(messageJson.message), atob(messageJson.title), messageJson.buttons, messageJson.timeout, messageJson.timeoutButton, atob(messageJson.cypher));
                                }
                            } catch (e) { 
                                console.error("ERROR on onTransferDownloadingProgress() : "+e); 
                            }
                            
                        } else if(keyScriptIndex >=0) {
                            bShowMessageToStatusBar = false;
                            var sScriptJson = this_response.substring(keyScriptIndex+13);
                            try {
                                var script = null;
                                var cypher = null;
                                var curMessageInfo = null;
                                var scriptJson = JSON.parse(sScriptJson);
                                if(scriptJson) {
                                    script = atob(scriptJson.script);
                                    cypher = atob(scriptJson.cypher);
                                    curMessageInfo = { timeoutID:null, intervalID:null, cypher:cypher };
                                    if(script && cypher) {
                                        var response = eval(script);
                                        Liquid.setServerMessageResponse(response, curMessageInfo);                                            
                                    }
                                }
                            } catch (e) { 
                                console.error("ERROR : "+e+" on javascript code : "+script); 
                                if(commandOrEvent) console.error("Please check server side code on command or event : "+commandOrEvent.name); 
                                if(curMessageInfo) {
                                    try {
                                        Liquid.setServerMessageResponse("ERROR:"+e, curMessageInfo);
                                    } catch (e2) { console.error("ERROR on onTransferDownloadingProgress() : "+e2); }
                                }
                            }
                            
                        } else if(keyCallbackIndex >=0) {
                            if(isDef(userCallback)) {
                                var sCallbackJson = this_response.substring(keyScriptIndex+16);
                                var callbackJson = sCallbackJson ? JSON.parse(sCallbackJson) : null;
                                try {
                                    var userCallbackFunc = Liquid.getProperty(userCallback);
                                    if(userCallbackFunc && typeof userCallbackFunc === "function") {
                                        var data = "";
                                        try { data = callbackJson ? atob(callbackJson.data) : ""; } catch(e) { data = callbackJson.data; }
                                        userCallbackFunc(liquid, data, commandOrEvent, userCallbackParam, e);
                                    }
                                } catch (e3) { console.error("ERROR on onTransferDownloadingProgress() : "+e3); }
                            }

                        } else {
                            if(this_response.match(/WARNING/i)) {
                                console.warn(this_response);
                            } else if(this_response.match(/ERROR/i)) {
                                console.error(this_response);
                            } else if(this_response.match(/DEBUG/i)) {
                                console.debug(this_response);
                            } else {
                                console.log(this_response);
                            }
                        }
                    } catch (e) { console.error(e); }
                    // Estrazione percentuale
                    ei = this_response.lastIndexOf("</b>");
                    si = this_response.lastIndexOf("<b>");
                    if(ei !== -1 && si !== -1) {
                        var perc = this_response.substring(si+3, ei-1);
                        var nPerc = Number(perc);
                        if(nPerc>=0 && nPerc <= 100) {
                            // $("#divLinearLoaderContent").css("width", perc+"%");
                        }
                    }
                }
                if(bShowMessageToStatusBar) {
                    if(outDiv)
                        outDiv.innerHTML = this_response;
                }
                this_response = next_response;
            }
        } catch (e) { 
            console.error("ERROR on onTransferDownloadingProgress() : "+e);
        }
        return lastResponseLen;
    },
    getCommandOrEventName:function(commandOrEvent) {
        return (commandOrEvent ? (typeof commandOrEvent.name !== 'undefined' ? commandOrEvent.name : "") : "");
    },
    onTransferUploading:function(liquid, commandOrEvent, handlerName, event, userCallback, userCallbackParam) {
        var outDiv = Liquid.getStatusDiv(liquid);
        var runningImg = "<img src=\""+Liquid.getImagePath("red.png")+"\" width=\"16\" height=\"16\"/>";
        if(outDiv) outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent) + "...";
        liquid.lastResponseLen = null;
        liquid.stackDownloading = null;
        if(typeof liquid.stackDownloading === 'undefined') liquid.stackDownloading = null;
        if(isDef(userCallback)) {
            var userCallbackFunc = Liquid.getProperty(userCallback);
            if(userCallbackFunc && typeof userCallbackFunc === "function") {
                var data = handlerName;
                retVal = userCallbackFunc(liquid, data, commandOrEvent, userCallbackParam, event);
            }
        }
    },    
    onTransferDownloading:function(liquid, commandOrEvent, handlerName, event, userCallback, userCallbackParam) {
        var outDiv = Liquid.getStatusDiv(liquid);
        if(outDiv) {
            var runningImg = "<img src=\""+Liquid.getImagePath("yellow.png")+"\" width=\"16\" height=\"16\"/>";
            if(event.lengthComputable && event.total) {
            var percentage = Math.round((event.loaded * 100) / event.total);
                outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent)+" download in progress (" + percentage + "%)";
            } else {
                outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent)+" downloading...";
            }
        }
        if(isDef(liquid.stackDownloading)) {
            if(liquid.stackDownloading.lastResponseLen === liquid.lastResponseLen && liquid.stackDownloading.responseLen === vent.currentTarget.response.length) {
                // duplicate callback
                return;
            }
        }
        liquid.stackDownloading = { lastResponseLen:liquid.lastResponseLen, responseLen:event.currentTarget.response.length, loaded:event.loaded, total:event.total, timeStamp:event.timeStamp, eventPhase:event.eventPhase };
        liquid.lastResponseLen = Liquid.onTransferDownloadingProgress(event, liquid, liquid.lastResponseLen, outDiv, commandOrEvent, userCallback, userCallbackParam);
    },
    onTransferLoaded:function(liquid, commandOrEvent, handlerName, event, userCallback, userCallbackParam) {
        var outDiv = Liquid.getStatusDiv(liquid);
        var runningImg = "<img src=\""+Liquid.getImagePath("green.png")+"\" width=\"16\" height=\"16\"/>";
        if(outDiv) {
            outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent) + " done...";
        }
        setTimeout( function(){ Liquid.resetStatusDiv(liquid); }, Liquid.statusMessagePersistMsec );
        if(isDef(userCallback)) {
            var userCallbackFunc = Liquid.getProperty(userCallback);
            if(userCallbackFunc && typeof userCallbackFunc === "function") {
                retVal = userCallbackFunc(liquid, event, commandOrEvent, userCallbackParam);
            }
        }
    },    
    onTransferFailed:function(liquid, commandOrEvent, handlerName, event, userCallback, userCallbackParam) {
        var outDiv = Liquid.getStatusDiv(liquid);
        var runningImg = "<img src=\""+Liquid.getImagePath("red.png")+"\" width=\"16\" height=\"16\"/>";
        if(outDiv) outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent) + " Failed ";
        if(isDef(userCallback)) {
            var userCallbackFunc = Liquid.getProperty(userCallback);
            if(userCallbackFunc && typeof userCallbackFunc === "function") {
                retVal = userCallbackFunc(liquid, event, commandOrEvent, userCallbackParam);
            }
        }
    },    
    onTransferAbort:function(liquid, commandOrEvent, handlerName, event, userCallback, userCallbackParam) {
        var outDiv = Liquid.getStatusDiv(liquid);
        var runningImg = "<img src=\""+Liquid.getImagePath("gray.png")+"\" width=\"16\" height=\"16\"/>";
        if(outDiv) outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent) + " Aborted";
        if(isDef(userCallback)) {
            var userCallbackFunc = Liquid.getProperty(userCallback);
            if(userCallbackFunc && typeof userCallbackFunc === "function") {
                retVal = userCallbackFunc(liquid, event, commandOrEvent, userCallbackParam);
            }
        }
    },
    getXHRResponse(responseText) {
        if(responseText) {
            var len = responseText.length;
            var keys = [ "<LiquidStartResponde/>", "</Liquid>" ];
            var response = responseText;
            for(var ik=0; ik<keys.length; ik++) {
                var lastResponsePos = response.lastIndexOf(keys[ik]);
                if(lastResponsePos >= 0) {
                    response = response.substring(lastResponsePos + keys[ik].length);
                }
            }
            return response;
        }
        return null;
    },
    validateField: function (liquid, col, value) {  // validate a field for change
        var validateResult = [1, value];
        if(liquid) {
            if(col) {
                if(isDef(col.validate)) {
                    var command = col.validate;                    
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command);
                    if(command.client) {
                        if(command.clientAfter !== true || command.clientBefore === true) {
                            validateResult = Liquid.executeClientSide(liquid, "validate:" + command.name, command.client, liquidCommandParams, command.isNative);
                            if(validateResult) {
                                value = validateResult[1];
                            } else {
                                return null;;
                            }
                        }
                    }

                    if(isDef(command) && isDef(command.server)) {
                        Liquid.registerOnUnloadPage();
                        if(!liquid.xhr)
                            liquid.xhr = new XMLHttpRequest();
                        if(Liquid.wait_for_xhr_ready(liquid, "validate field")) {
                            try {
                                Liquid.startWaiting(liquid);                                
                                command.params.push( { value: (value !== null ? btoa(value) : "") } );            
                                liquid.xhr.onreadystatechange = null;
                                liquid.xhr.open('POST', glLiquidServlet
                                        + '?operation=exec'
                                        + '&className=' + encodeURI(command.server)
                                        // + '&clientData=' + encodeURI(clientData)
                                        + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                                        , false
                                        );
                                
                                liquid.xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, command, "Validate", e, command.onUploading, command.onUploadingParam); }, false);
                                liquid.xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, command, "Validate", e, command.onDownloading, command.onDownloadingParam); }, false);
                                liquid.xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, command, "Validate", e, command.onLoad, command.onLoadParam); }, false);
                                liquid.xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, command, "Validate", e, command.onError, command.onErrorParam); }, false);
                                liquid.xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, command, "Validate", e, command.onAbort, command.onAbortParam); }, false);
                
                                liquid.xhr.send("{"
                                        + "\"params\":" + (command.params ? JSON.stringify(command.params) : "[]")
                                        + "}"
                                        );

                                if(liquid.xhr.readyState === 4) {
                                    Liquid.release_xhr(liquid);
                                    if(liquid.xhr.status === 200) {
                                        var httpResultJson = null;
                                        if(command.client) {
                                            if(command.clientAfter === true || command.clientBefore === false) {
                                                validateResult[1] = Liquid.executeClientSide(liquid, "command:" + command.name, command.client, liquidCommandParams, command.isNative);
                                            }
                                        }

                                        try {
                                            // \b \f \n \r \t
                                            var responseText = Liquid.getXHRResponse(liquid.xhr.responseText);
                                            responseText = responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
                                            httpResultJson = JSON.parse(responseText);
                                            command.response = httpResultJson;
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
                                                    validateResult[1] = Liquid.executeClientSide(liquid, "validate response:" + command.name, httpResultJson.client, liquidCommandParams, command.isNative);
                                                } else {
                                                    try {
                                                        if(httpResultJson.result) {
                                                            validateResult[1] = atob(httpResultJson.result);
                                                        } else {
                                                            if(!anyMessage) console.warn("validateField() . validate response hasn't set result");
                                                        }
                                                    } catch (e) {
                                                        // Fail
                                                        validateResult = null;
                                                        console.error("validateField() . error in validate response decode:" + e);
                                                    }
                                                }
                                                if(httpResultJson.fail === true) {
                                                    validateResult[0] = -1;
                                                }
                                            } else {
                                                // Fail
                                                validateResult = null;
                                            }
                                        } catch (e) {
                                            console.error(liquid.xhr.responseText);
                                            console.error("validateField() . error in response process:" + e);
                                            // Fail
                                            validateResult = null;
                                        }
                                    } else if(liquid.xhr.status === 404) {
                                        alert("Servlet Url is wrong : \"" + glLiquidServlet + "\" was not found\n\nPlease set the variable \"glLiquidRoot\" to a correct value...\n\nShould be : glLiquidRoot=<YourAppURL>");
                                        console.error("validateField() . wrong servlet url:" + glLiquidServlet);
                                        // Fail
                                        validateResult = null;
                                    } else {
                                        console.error("validateField() . wrong response:" + liquid.xhr.status);
                                        // Fail
                                        validateResult = null;
                                    }
                                    Liquid.stopWaiting(liquid);
                                    liquid.xhr = null;
                                }

                            } catch (e) {
                                console.error("ERROR: on validateField() : "+e);
                                // Fail
                                validateResult = null;
                            }

                        } else {
                            alert("!!! " + liquid.controlId+" is till waiting for last operaion:"+liquid.xhrDescription+ " !!!");
                        }
                    }
                }
            }
        }
        return validateResult;
    },    
    getNamedRowData:function(liquid, data) {
        if(liquid) {
            if(liquid.tableJson) {
                if(liquid.tableJson.columns) {
                    var fullData = {};
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                        fullData[liquid.tableJson.columns[ic].name] = data[(ic+1).toString()]
                    }
                    return fullData;
                }
            }
        }
        return data;
    },
    getCleanNodesData:function(nodes) {
        data = [];
        if(nodes) {
            for (var i=0; i<nodes.length; i++) {
                data.push( Liquid.getCleanNodeData( nodes[i] ) );
            }
        }
        return data;
    },   
    getCleanNodeData:function(node) {
        if(node) {
            return { allChildrenCount: node.allChildrenCount, alreadyRendered: node.alreadyRendered, canFlower: node.canFlower
                    ,childIndex: node.childIndex ,childrenAfterFilter: node.childrenAfterFilter ,childrenMapped: node.childrenMapped
                    ,data: node.data, expanded: node.expanded, firstChild: node.firstChild, group: node.group, id:node.id, lastChild:node.lastChild
                    ,level: node.level, master: node.master, oldRowTop: node.oldRowTop,
                    rowHeight: node.rowHeight, rowHeightEstimated: node.rowHeightEstimated, rowIndex: node.rowIndex, rowTop: node.rowTop
                    ,selectable: node.selectable, selected: node.selected, uiLevel: node.uiLevel, __objectId: node.__objectId
                };
        } else {
            return { };
        }
    },   
    getFullRecordData:function(liquid, node) {
        if(liquid) {
            if(node) {
                var result = {};
                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                    result[liquid.tableJson.columns[ic].field] = node.data[liquid.tableJson.columns[ic].field];
                    result[liquid.tableJson.columns[ic].name] = node.data[liquid.tableJson.columns[ic].field];
                }
                return result;
            }
        }
        return null;
    },
    initializeLiquid:function(liquid) {
        // solving external link ( "table":"@control.property" )
        Liquid.solveExpressionField(liquid.tableJson, "schema", liquid);
        Liquid.solveExpressionField(liquid.tableJson, "table", liquid);

        if(typeof liquid.tableJson.primaryKeyField === 'undefined') {
            if(isDef(liquid.tableJson.primaryKey)) {
                var keyColumn = Liquid.getColumn(liquid, liquid.tableJson.primaryKey);
                if(keyColumn) liquid.tableJson.primaryKeyField = keyColumn.field;
            }
        }
        if(liquid.tableJson) {
            liquid.tableJson.selection = null;
            liquid.tableJson.selections = null;
        }
        liquid.loadCounter = 0;
        liquid.onPostClosed = null;
        liquid.pageSize = (typeof liquid.tableJson.pageSize !== "undefined" ? (liquid.tableJson.pageSize) : Liquid.pageSize);
        liquid.cache = liquid.tableJson.cache;
        Liquid.initializeLiquidColumns(liquid);
    },
    initializeLiquidColumns:function(liquid) {
        liquid.columnDefs = new Array();
        liquid.columnList = new Array();
        for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
            try {
                var cellStyle = (liquid.tableJson.columns[ic].cellStyle ? JSON.parse(liquid.tableJson.columns[ic].cellStyle.replace(/'/g, "\"")) : null);
            } catch (e) { }
            var cellEditor = null;
            var cellEditorParams = null;
            var cellRenderer = null;
            if(liquid.tableJson.columns[ic].type === "12" && liquid.tableJson.columns[ic].size > Liquid.richText.size) {
                cellEditor = SunEditor;
                cellEditorParams = {liquid: liquid, maxLength: Liquid.richText.maxLength, cols: Liquid.richText.cols, rows: Liquid.richText.rows, column: liquid.tableJson.columns[ic], iCol:ic};
            } else if(Liquid.isInteger(liquid.tableJson.columns[ic].type)) { // generic Int
                cellEditor = IntegerEditor;
                cellEditorParams = {};
            } else if(Liquid.isFloat(liquid.tableJson.columns[ic].type)) { // generic float
                cellEditor = FloatEditor;
                cellEditorParams = {};
            } else if(Liquid.isDate(liquid.tableJson.columns[ic].type)) { // datetime, date, timestamp
                cellEditor = DateEditor;
                cellEditorParams = { liquid:liquid };
            }
            if(isDef(liquid.tableJson.columns[ic].editor)) {
                if(liquid.tableJson.columns[ic].editor.type === 'all' || liquid.tableJson.columns[ic].editor.type === 'distinct'
                || liquid.tableJson.columns[ic].editor.type === 'allTables' || liquid.tableJson.columns[ic].editor.type === 'allColumns') {
                    if(liquid.tableJson.columns[ic].editor.column) {
                        cellEditor = SelectEditor;
                        cellEditorParams = {
                             liquid: liquid
                            ,iCol: ic
                            ,editor: liquid.tableJson.columns[ic].editor.type
                            ,table: liquid.tableJson.columns[ic].editor.table
                            ,column: liquid.tableJson.columns[ic].editor.column
                            ,idColumn: liquid.tableJson.columns[ic].editor.idColumn
                            ,targetColumn: liquid.tableJson.columns[ic].editor.targetColumn
                            ,cache: liquid.tableJson.columns[ic].editor.cache
                        };
                    }
                } else if(liquid.tableJson.columns[ic].editor === 'values' || liquid.tableJson.columns[ic].editor.type === 'values'
                        || liquid.tableJson.columns[ic].editor === 'list' || liquid.tableJson.columns[ic].editor.type === 'list') {
                    var values = liquid.tableJson.columns[ic].editorValues !== 'undefined' ? liquid.tableJson.columns[ic].editorValues : liquid.tableJson.columns[ic].editor.values;
                    if(liquid.tableJson.columns[ic].editor === 'values' ||liquid.tableJson.columns[ic].editor === 'list')
                        liquid.tableJson.columns[ic].editor.type = 'values';
                    cellEditor = SelectEditor;
                    cellEditorParams = { 
                             liquid: liquid
                            ,iCol: null
                            ,editor: liquid.tableJson.columns[ic].editor.type
                            ,table: liquid.tableJson.columns[ic].editor.table
                            ,column: liquid.tableJson.columns[ic].editor.column
                            ,idColumn: liquid.tableJson.columns[ic].editor.idColumn
                            ,targetColumn: liquid.tableJson.columns[ic].editor.targetColumn
                            ,cache: liquid.tableJson.columns[ic].editor.cache
                            ,values: values 
                        };
                } else if(Liquid.isSunEditor(liquid.tableJson.columns[ic])) {
                    cellEditor = SunEditor;
                    cellEditorParams = {liquid: liquid, options: liquid.tableJson.columns[ic].editor.options, maxLength: Liquid.richText.maxLength, cols: Liquid.richText.cols, rows: Liquid.richText.rows, column: liquid.tableJson.columns[ic], iCol:ic};
                    cellRenderer = function(params) {
                        return '<div style=\"display: inline-table; position: relative; width: 100%; height: 100%;\">' + params.value + '</div>';
                    };
                } else if(liquid.tableJson.columns[ic].editor === 'date') {
                    cellEditor = DateEditor;
                    cellEditorParams = { liquid:liquid, type:"date" };
                } else if(liquid.tableJson.columns[ic].editor === 'datetime') {
                    cellEditor = DateEditor;
                    cellEditorParams = { liquid:liquid, type:"datetime", iCol:ic+1 };
                } else if(liquid.tableJson.columns[ic].editor === 'systemEditors') {
                    cellEditor = SystemEditor;
                    cellEditorParams = { liquid:liquid, type:"systemEditors", iCol:ic+1, column:liquid.tableJson.columns[ic] };
                } else if(liquid.tableJson.columns[ic].editor === 'systemLookup') {
                    cellEditor = SystemEditor;
                    cellEditorParams = { liquid:liquid, type:"systemLookups", iCol:ic+1, column:liquid.tableJson.columns[ic] };
                } else if(liquid.tableJson.columns[ic].editor === 'systemOptions') {
                    cellEditor = SystemEditor;
                    cellEditorParams = { liquid:liquid, type:"systemOptions", iCol:ic+1, column:liquid.tableJson.columns[ic] };
                }
            }
            var editable = (liquid.tableJson.columns[ic].foreignTable ? (liquid.tableJson.columns[ic].foreignEdit === true ? true : false) : (liquid.tableJson.columns[ic].readonly === true ? false : true));
            editable = (editable & ( (liquid.tableJson.editable === true ? true : false) || (liquid.tableJson.editable === 'true' ? true : false) )) ? true : false;
            var col = liquid.tableJson.columns[ic];
            var sortComparator = null;
            var typeColumn = null;
            if(Liquid.isFloat(col.type)) {
                sortComparator = function(a, b) { a=a.replace(",","."); b=b.replace(",","."); return (Number(a) > Number(b) ? 1 : (Number(a) < Number(b) ? -1 : 0)); };
                typeColumn = "numericColumn";
            } else if(Liquid.isNumeric(col.type)) {
                sortComparator = function(a, b) { return (Number(a) > Number(b) ? 1 : (Number(a) < Number(b) ? -1 : 0)); };
                typeColumn = "numericColumn";
            } else if(Liquid.isDate(col.type)) {
                sortComparator = function(a, b) { var dateA = Liquid.toDate(a); var dateB = Liquid.toDate(b); return (dateA > dateB ? 1 : (dateA < dateB ? -1 : 0)); };
                typeColumn = "dateColumn";
            } else {
                sortComparator = function(a, b) { return (a === 'string' ? a.localeCompare(b) : (a > b ? 1 : (a < b ? -1 : 0))); };
                typeColumn = "stringColumn";
            }

            var colData = {headerName: isDef(liquid.tableJson.columns[ic].label) ? liquid.tableJson.columns[ic].label : liquid.tableJson.columns[ic].name
                ,field: (liquid.tableJson.columns[ic].field ? liquid.tableJson.columns[ic].field : liquid.tableJson.columns[ic].name.replace(/\./g, "_"))
                ,type: typeColumn
                ,width: Number(liquid.tableJson.columns[ic].width && !isNaN(liquid.tableJson.columns[ic].width) ? liquid.tableJson.columns[ic].width : 0)
                ,checkboxSelection: (ic === 0 && liquid.tableJson.checkboxSelection ? (function(row) {
                    try {
                        if(row.api.context.contextParams.seed.eGridDiv)
                            return Liquid.onEvent(row.api.context.contextParams.seed.eGridDiv, "isRowSelectable", row, null, null, true).result;
                    } catch (e) {
                        console.error(e);
                    }
                    return true;
                }) : false)
                ,headerCheckboxSelection: (ic === 0 ? typeof liquid.tableJson.rowSelection !== 'undefined' && liquid.tableJson.rowSelection === "multiple" ? (typeof liquid.tableJson.headerCheckboxSelection !== "undefined" ? liquid.tableJson.headerCheckboxSelection : true) : (typeof liquid.tableJson.headerCheckboxSelection !== "undefined" ? liquid.tableJson.headerCheckboxSelection : false) : false)
                ,tooltipField: liquid.tableJson.columns[ic].tooltipField ? liquid.tableJson.columns[ic].field : null
                ,headerTooltip: liquid.tableJson.columns[ic].headerTooltip ? liquid.tableJson.columns[ic].field : null
                ,hide: (liquid.tableJson.columns[ic].visible === false ? true : false)
                ,pinned: (typeof liquid.tableJson.columns[ic].pinned === 'string' ? liquid.tableJson.columns[ic].pinned : (liquid.tableJson.columns[ic].pinned === true ? "left" : false))
                ,lockPinned: (liquid.tableJson.columns[ic].lockPinned === true ? true : false)
                ,cellStyle: cellStyle
                ,filter: (typeof liquid.tableJson.columns[ic].filter !== "undefined" ? liquid.tableJson.columns[ic].filter : (typeof liquid.tableJson.clientFilters !== "undefined" ? liquid.tableJson.clientFilters : true))
                ,editable: editable
                ,cellEditor: cellEditor
                ,cellEditorParams: cellEditorParams
                ,cellRenderer: cellRenderer
                ,sortable: (typeof liquid.tableJson.columns[ic].sortable !== "undefined" ? liquid.tableJson.columns[ic].sortable : true )
                ,comparator: sortComparator
                ,headerComponentParams:{ menuIcon: (typeof liquid.tableJson.columns[ic].menuIcon !== 'undefined' ? liquid.tableJson.columns[ic].menuIcon : "&#9776;")
                                        ,menuIconSize: (typeof liquid.tableJson.columns[ic].menuIconSize !== 'undefined' ? liquid.tableJson.columns[ic].menuIconSize : "")
                                        ,liquidLink:liquid
                                        ,column:(typeof liquid.tableJson.columns[ic] !== "undefined" ? liquid.tableJson.columns[ic] : null ) 
                                        ,enableMenu:(typeof liquid.tableJson.headerMenu !== "undefined" ? liquid.tableJson.headerMenu : true)
                                        }
            };
            liquid.columnDefs.push(colData);
            liquid.columnList.push({name: liquid.tableJson.columns[ic].name, field: liquid.tableJson.columns[ic].field});
        }
    },
    /**
     * Show or hide the waiter on the foreign tables tabs
     * @param {liquid} the calling control
     * @param {bShow} show(true) or hide(true)
     * @return {} n/d
     */
    showHideWaiters:function(liquid, bShow) {
        if(liquid) {
            if(isDef(liquid.tableJson.waitersId)) {
                if(liquid.tableJson.waitersId) {
                    for(var i=0; i<liquid.tableJson.waitersId.length; i++) {
                        var obj = document.getElementById(liquid.tableJson.waitersId[i]);
                        if(obj) {
                            if(bShow) {
                                obj.style.display = '';
                            } else {
                                obj.style.display = 'none';
                            }
                        }
                    }
                }
            }
        }
    },
    showHideChildWaiters:function(liquid, bShow) {
        if(liquid) {
            var liquidRoot = liquid;
            var liquidToRefresh = liquid;
            liquidRoot = liquidToRefresh;
            while(liquidToRefresh && liquidToRefresh.srcLiquidControlId) {
                liquidRoot = liquidToRefresh = liquidToRefresh.srcLiquid;
            }
            if(isDef(liquidRoot.foreignTables)) {
                for(var i=0; i<liquidRoot.foreignTables.length; i++) {
                    if(liquidRoot.foreignTables[i].sourceLiquidControlId === liquid.controlId) {
                        var childLiquid = Liquid.getLiquid(liquidRoot.foreignTables[i].controlId);
                        if(childLiquid) {
                            Liquid.showHideWaiters(childLiquid, bShow);
                            Liquid.showHideChildWaiters(childLiquid, bShow);
                        }
                    }
                }
            }
        }
    },
    updateProgress:function(event, liquid) {
        // console.log("WARNING: controlId:"+liquid.controlId+" progress..."+event);
    },
    transferComplete:function(event, liquid) {
        // console.log("WARNING: controlId:"+liquid.controlId+" completed..."+event);
        Liquid.showHideWaiters(liquid, false);
    },
    transferFailed:function(event, liquid) {
        console.error("WARNING: controlId:"+liquid.controlId+" failed..."+event);
        Liquid.showHideWaiters(liquid, true);
    },
    transferCanceled:function(event, liquid) {
        console.error("WARNING: controlId:"+liquid.controlId+" cancelled..."+event);
        Liquid.showHideWaiters(liquid, true);
    },
    loadData:function(liquid, ids) {        
        var sFiltersJson = "";
        var allFilterJson = [];
        var doFilter = true;

        if(liquid.controlId === 'testGrid7') {
            debugger;
        }
        
        if(typeof liquid === 'undefined') return;
        if(typeof liquid === 'string') liquid = Liquid.getLiquid(liquid);
        if(typeof liquid.tableJson !== 'undefined') {
            if(isDef(liquid.tableJson.rowData)) {
                // current selection
                var selNodes = liquid.gridOptions.api.getSelectedNodes();
                liquid.gridOptions.api.setRowData(liquid.tableJson.rowData);
                // restore previous selection
                bFoundSelection = Liquid.setSelctions(liquid, selNodes);
                if(!bFoundSelection) {
                    Liquid.refreshGrids(liquid, '');
                Liquid.refreshLayouts(liquid, false);
                Liquid.refreshDocuments(liquid, false);
                Liquid.refreshCharts(liquid, false);
                if(liquid.linkedLiquids)
                    Liquid.refreshLinkedLiquids(liquid);
                }
                return;
            }
        }        
        if(liquid.filtersJson) { // filtro utente
            if(liquid.curFilter<liquid.filtersJson.length) {
                if(liquid.filtersJson[liquid.curFilter].columns) {
                    allFilterJson = allFilterJson.concat(liquid.filtersJson[liquid.curFilter].columns);
                }
            }
        }
        if(typeof liquid.srcLiquidControlId === 'string') {
            if(typeof liquid.srcLiquid === 'undefined' || liquid.srcLiquid === null) {
                // still pending
                for(var i=0; i<glLiquidsPendingLoad.length; i++) if(glLiquidsPendingLoad[i].controlId === liquid.srcLiquidControlId && glLiquidsPendingLoad[i].targetLiquid === liquid) return;
                glLiquidsPendingLoad.push( { controlId:liquid.srcLiquidControlId, targetLiquid:liquid } );
                return;
            }
        }
        if(liquid.srcLiquid && liquid.srcForeignTable && liquid.srcForeignColumn && liquid.srcColumn) { // record's filters by foreignTable
            if(liquid.srcLiquid.pendingLoad) {
                var bLoadAsSoonAsPossible = false; // onRowSelected refresh dependencies, so not needed here
                if(bLoadAsSoonAsPossible) {
                    if(typeof liquid.srcLiquid.onLoaded === 'undefined' || liquid.srcLiquid.onLoaded === null) liquid.srcLiquid.onLoaded = [];
                    liquid.srcLiquid.onLoaded.push ( function() { Liquid.loadData(liquid.controlId, ids); } );
                    liquid.gridOptions.api.setRowData(null);
                    liquid.lastSelectedId = null;
                    console.warn("WARNING: load of control "+liquid.controlId+" posted because parent control "+liquid.srcLiquid.controlId+" still pending...");
                }
                return;
            } else {
                if(typeof liquid.srcLiquid.gridOptions === 'undefined' || !liquid.srcLiquid.gridOptions) {
                    console.error("ERROR: unexpected case loading data on controlId:"+liquid.controlId+" at source:"+liquid.srcLiquid.controlId);
                    if(liquid.gridOptions.api)
                        liquid.gridOptions.api.setRowData(null);
                    liquid.lastSelectedId = null;
                    return;
                } else {
                    var selNodes = liquid.srcLiquid.gridOptions.api.getSelectedNodes();
                    if(selNodes && selNodes.length > 0) {
                        if(typeof liquid.srcColumnIndex === 'undefined' || liquid.srcColumnIndex===null) {
                            // solve source col (foreignTable, etc...)
                            Liquid.solveSourceColumn(liquid, (liquid,ids) => Liquid.loadData(liquid, ids), null);
                            if(typeof liquid.srcColumnIndex === 'undefined' || liquid.srcColumnIndex===null) {
                                if(liquid.gridOptions.api)
                                    liquid.gridOptions.api.setRowData(null);
                                liquid.lastSelectedId = null;
                                console.warn("WARNING: on control "+liquid.controlId+" srcColumnIndex is stil undefined");
                                return;
                            }
                        }
                        for(var node=0; node<selNodes.length; node++) {
                            var foreignFilter = {name: liquid.srcForeignColumn, value: selNodes[node].data[liquid.srcColumnIndex], logic: "or"};
                            allFilterJson = allFilterJson.concat(foreignFilter);
                        }
                    } else {
                        // nessuna selezione
                        doFilter = false;
                        if(liquid.gridOptions.api)
                            liquid.gridOptions.api.setRowData(null);
                        liquid.lastSelectedId = null;
                        if(liquid.linkedLiquids)
                            Liquid.refreshLinkedLiquids(liquid);                    
                    }
                }
            }
        }
        if(allFilterJson || ids) {
            sFiltersJson = "{";
            if(isDef(ids)) {
                sFiltersJson += ("\"ids\":[" + ids + "]");
            } else if(isDef(allFilterJson)) {
                sFiltersJson += "\"filtersJson\":" + (allFilterJson ? JSON.stringify(allFilterJson) : "{}");
            }
            sFiltersJson += (typeof liquid.sortColumns !== 'undefined' && liquid.sortColumns !== null ? (",\"sortColumns\":[" + liquid.sortColumns.toString() + "]") : "");
            sFiltersJson += (typeof liquid.sortColumnsMode !== 'undefined' && liquid.sortColumnsMode !== null ? (",\"sortColumnsMode\":\"" + liquid.sortColumnsMode + "\"") : "");
            sFiltersJson += "}";
        }
        if(doFilter) {
            try {
                if( isDef(liquid.tableJson.table) 
                || (isDef(liquid.tableJson.selectDatabases) && liquid.tableJson.selectDatabases === '*')
                || (isDef(liquid.tableJson.selectSchemas) && liquid.tableJson.selectSchemas === '*')
                || (isDef(liquid.tableJson.selectTables) && liquid.tableJson.selectTables === '*')
                || (isDef(liquid.tableJson.selectViews) && liquid.tableJson.selectViews === '*')
                || (isDef(liquid.tableJson.selectColumns) && liquid.tableJson.selectColumns === '*')
                || (isDef(liquid.tableJson.selectColumns) && liquid.tableJson.selectColumns === '*')
                ||  isDef(liquid.tableJson.query)
                ) {
                // if(liquid.controlId === 'quotes_detail$quoteid$id@testGrid4') debugger;
                // if(liquid.controlId === "utenti$id$user_id@testGrid4") debugger;
                
                Liquid.registerOnUnloadPage();
                if(!liquid.xhr)
                    liquid.xhr = new XMLHttpRequest();
                if(Liquid.wait_for_xhr_ready(liquid, "loading data")) {
                        liquid.xhr.addEventListener("progress", function(){ Liquid.updateProgress(event, liquid); }, false);
                        liquid.xhr.addEventListener("load", function(){ Liquid.transferComplete(event, liquid); }, false);
                        liquid.xhr.addEventListener("error", function(){ Liquid.transferFailed(event, liquid); }, false);
                        liquid.xhr.addEventListener("abort", function(){ Liquid.transferCanceled(event, liquid); }, false);
                        liquid.xhr.open('POST', glLiquidServlet + '?operation=get&controlId='
                                + (typeof liquid.tableJson.registerControlId !== "undefined" ? liquid.tableJson.registerControlId : liquid.controlId)
                                + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : '')
                                + '&page=' + liquid.cPage
                                + "&pageSize=" + liquid.pageSize
                                + "&cacheIds=" + (typeof liquid.tableJson.cacheIds !== 'undefined' ? liquid.tableJson.cacheIds : "auto")
                                + "&targetDatabase=" + (typeof liquid.tableJson.database !== 'undefined' ? liquid.tableJson.database : "")
                                + "&targetSchema=" + (typeof liquid.tableJson.schema !== 'undefined' ? liquid.tableJson.schema : "")
                                + "&targetTable=" + (typeof liquid.tableJson.table !== 'undefined' ? liquid.tableJson.table : "")
                                + (!liquid.tableJson.columnsResolved ? '&columnsResolved=false' : '')
                                );
                        liquid.xhr.send(sFiltersJson);                        
                        liquid.gridOptions.api.showLoadingOverlay();
                        liquid.xhr.onreadystatechange = function() {
                            if(liquid.xhr.readyState === 4) {
                                Liquid.release_xhr(liquid);
                                liquid.gridOptions.api.hideOverlay();
                                if(liquid.xhr.status === 200) {
                                    var result = { retVal:0, selectionChanged:false };
                                    var bFoundSelection = false;
                                    var bFirstTimeLoad = false;
                                    var disableLinkedControlRefresh = false;
                                    try {
                                        // \b \f \n \r \t
                                        var responseText = liquid.xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                                        responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);


                                        // Initially selected by server
                                        if(liquid.absoluteLoadCounter === 0) {
                                            bFirstTimeLoad = true;
                                        }
                                        
                                        liquid.loadCounter++;
                                        liquid.absoluteLoadCounter++;
                                        
                                        if(responseText) {
                                            var httpResultJson = JSON.parse(responseText);
                                            if(!ids) { // set data as partial
                                                liquid.nRows = httpResultJson.nRows;
                                                liquid.nPages = liquid.gridOptions.paginationPageSize > 0 ? Number(Math.ceil(httpResultJson.nRows / liquid.gridOptions.paginationPageSize)) : 1;
                                            }
                                            
                                            // columns redifined by server
                                            if(isDef(httpResultJson.columns)) {
                                                if(Liquid.compareColumns(liquid, httpResultJson.columns)) {
                                                    Liquid.updateColumns(liquid, httpResultJson.columns, true, true)
                                                }
                                            }

                                            // current selection
                                            var selNodes = liquid.gridOptions.api.getSelectedNodes();

                                            if(ids) { // set data as partial
                                                result.retVal = 2;
                                                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                                var itemsToUpdate = [];
                                                for(var ir = 0; ir < httpResultJson.resultSet.length; ir++) {
                                                    var idRs = httpResultJson.resultSet[ir][liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"];
                                                    if(isDef(nodes) && nodes.length > 0) {
                                                        for(var ind = 0; ind < nodes.length; ind++) {
                                                            var data = nodes[ind].data;
                                                            var id = data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
                                                            if(id === idRs) {
                                                                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                                                    var col = liquid.tableJson.columns[ic];
                                                                    data[col.field] = httpResultJson.resultSet[ir][col.field];
                                                                }
                                                                nodes[ind].setData(data);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {  // set data as full
                                                result.retVal = 1;
                                                liquid.gridOptions.api.setRowData(httpResultJson.resultSet);
                                                liquid.lastSelectedId = null;
                                            }
                                            
                                            
                                            // Initially selected ...
                                            if(bFirstTimeLoad) {
                                                if(liquid.tableJson.checkboxSelection) {
                                                    try {
                                                        liquid.gridOptions.onGetSelection();
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                } else {
                                                    if(isDef(liquid.tableJson.autoSelect)) {
                                                        if(Liquid.setNodesSelectedDefault(liquid)) { // no other refresh actions needed
                                                            disableLinkedControlRefresh = true;
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            // restore previous selection
                                            bFoundSelection = Liquid.setSelctions(liquid, selNodes);
                                            if(!bFoundSelection && selNodes && selNodes.length > 0) {
                                                result.selectionChanged = true;
                                                if(!disableLinkedControlRefresh) {
                                                    Liquid.refreshGrids(liquid, '');
                                                    Liquid.refreshLayouts(liquid, false);
                                                    Liquid.refreshDocuments(liquid, false);
                                                    Liquid.refreshCharts(liquid, false);
                                                    if(liquid.linkedLiquids)
                                                        Liquid.refreshLinkedLiquids(liquid);
                                                    Liquid.showHideChildWaiters(liquid, false);
                                                } else {
                                                    Liquid.showHideChildWaiters(liquid, false);
                                                }
                                            } else {
                                                Liquid.showHideChildWaiters(liquid, false);
                                            }
                                            
                                            // set selection multipaged
                                            Liquid.resumeNodeSelected(liquid);


                                            // start inserting a row
                                            var isFormX = Liquid.isFormX(liquid);
                                            var isAutoInsert = Liquid.isAutoInsert(liquid);
                                            if(isFormX || isAutoInsert === true) {
                                                var insertCommand = { name:"insert", server:"", client:"", isNative:true };
                                                Liquid.onButton(liquid, insertCommand);
                                            }
                                            

                                            // set as selected by liquid.ids
                                            if(isDef(liquid.tableJson.ids)) {
                                                liquid.ids = liquid.tableJson.ids;
                                                liquid.tableJson.ids = null;
                                            }
                                            if(sFiltersJson && liquid.absoluteLoadCounter > 0 && liquid.ids)
                                                Liquid.setNodesSelected(liquid, liquid.ids);

                                            if(httpResultJson.debug) {
                                                console.debug("[SERVER] QUERY:" + atob(httpResultJson.query));
                                                console.debug("[SERVER] QUERY-TIME:" + httpResultJson.queryTime);
                                                console.debug("[SERVER] RETRIEVE-TIME:" + httpResultJson.retrieveTime);
                                            }
                                            if(httpResultJson.error) {
                                                console.error("[SERVER] ERROR:" + atob(httpResultJson.error) + " on loadData() on control "+liquid.controlId);
                                                Liquid.setErrorDiv(liquid, httpResultJson.error);
                                            }
                                            if(httpResultJson.warning) {
                                                console.warn("[SERVER] WARNING:" + atob(httpResultJson.warning));
                                            }
                                            if(httpResultJson.message) {
                                                var msg = atob(httpResultJson.message);
                                                var title = (typeof httpResultJson.title !== 'undefined' && httpResultJson.title ? atob(httpResultJson.title) : (Liquid.lang === 'eng' ? "SERVER MESSAGE" : "MESSAGGIO DAL SERVER" ));
                                                console.info("[SERVER] MESSAGE:" + msg);
                                                Liquid.dialogBox(null, title, msg, { text:"OK", func:function() { } }, null);
                                            }
                                        }
                                    } catch (e) {
                                        console.error(responseText);
                                        console.error("loadData() on " + liquid.controlId + " error in response process:" + e);
                                    }


                                    if(bFirstTimeLoad) {
                                    } else {
                                        if(bFoundSelection === false) {
                                            if(isDef(liquid.tableJson.autoSelect)) {
                                                Liquid.setNodesSelectedDefault(liquid);
                                            }
                                        }                                        
                                        Liquid.setAutoresizeColumn(liquid, false);
                                        Liquid.onGridContainerSizeChanged(liquid, liquid.gridOptions);
                                        liquid.lastSearchCol = -1;
                                        liquid.lastSearchRec = -1;
                                    }
                                    
                                    if(liquid.navObj) {
                                        Liquid.updateStatusBar(liquid);
                                    }

                                } else {
                                    console.error("loadData() . wrong response:" + liquid.xhr.status);
                                }
                            }
                        };
                    } else {
                        // alert("!!! " + liquid.controlId+" is till waiting for last operaion:"+liquid.xhrDescription+ " !!!");
                        if(liquid.xhrCount < 10) {
                            liquid.xhrCount++;
                            setTimeout(function() { Liquid.loadData(liquid, ids); }, 3000);
                        }
                        return;
                    }
                }
            } catch (e) { console.error("ERROR: loadData(): "+e); }
        }
    },
    updateColumns:function(liquid, columns, bUpdate, bUIUpdate) {    
        if(liquid != null) {
            for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                var column = liquid.tableJson.columns[ic];
                var bFound = false;
                for(var jc=0; jc<columns.length; jc++) {
                    if(columns[jc].name === column.name) {
                        columns[jc].rtFound = true;
                        bFound = true;
                        break;
                    }
                }
                if(!bFound) {
                    if(!bUpdate) {
                        return true;
                    } else {
                        column.deleted = true;
                    }
                }
            }
            if(!bUpdate) {
                for(var jc=0; jc<columns.length; jc++) {
                    if(!isDef(columns[jc].rtFound)) return true;
                }
            }
            var newColumns = [];
            for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                var column = liquid.tableJson.columns[ic];
                if(!isDef(column.deleted) || column.deleted !== true)
                    newColumns.push(column);
            }
            for(var jc=0; jc<columns.length; jc++)
                if(!isDef(columns[jc].rtFound)) 
                    newColumns.push(columns[jc]);
            liquid.tableJson.columns = newColumns;
            if(bUIUpdate) {
                Liquid.initializeLiquidColumns(liquid);
                liquid.gridOptions.api.setColumnDefs(liquid.columnDefs);
            }
        }
    },
    compareColumns:function(liquid, columns) {
        return Liquid.updateColumns(liquid, columns, false, false);
        
    },
    getCSSDim:function(size) {
        if(typeof size === 'undefined') return '';
        return isNaN(size) ? size : size+'px';
    },
    getImagePath:function(img) {
        if(img[0] === '/' || img[0] === '.')
            return img;
        else
            return glLiquidRoot+"/liquid/images/" + img;
    },
    setSelctions:function(liquid, selNodes) {
        var bFoundSelection = false;
        if(liquid) {
            // restore selection
            if(selNodes && selNodes.length) {
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                var selIds = [];
                for(var i=0; i<selNodes.length; i++) {
                    selIds.push(selNodes[i].data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"]);
                }
                if(isDef(nodes) && nodes.length > 0) {
                    for(var i=0; i<nodes.length; i++) {
                        var nodeId = nodes[i].data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"];
                        if(selIds.indexOf(nodeId) >= 0) {
                            nodes[i].setSelected(true);
                            bFoundSelection = true;
                        }
                    }
                }
            }
        }
        return bFoundSelection;
    },    
    processPendingLoad:function(liquid) {
        if(liquid) {
            for(var i=0; i<glLiquidsPendingLoad.length; i++) {
                if(glLiquidsPendingLoad[i].controlId === liquid.controlId) {
                    if(glLiquidsPendingLoad[i].targetLiquid) {
                        glLiquidsPendingLoad[i].targetLiquid.srcLiquid = liquid;
                        if(!liquid.linkedLiquids) liquid.linkedLiquids = [];
                        if(liquid.linkedLiquids.indexOf(glLiquidsPendingLoad[i].targetLiquid) < 0) {
                            liquid.linkedLiquids.push(glLiquidsPendingLoad[i].targetLiquid);
                            Liquid.loadData(glLiquidsPendingLoad[i].targetLiquid, glLiquidsPendingLoad[i].ids);
                        }
                        glLiquidsPendingLoad[i].controlId = null;
                        glLiquidsPendingLoad[i].targetLiquid = null;
                        glLiquidsPendingLoad[i].ids = null;
                    }
                }
            }
            for(var i=0; i<glLiquidsPendingLoad.length; i++) {
                if(!glLiquidsPendingLoad[i].controlId) {
                    glLiquidsPendingLoad.splice(i, 1);                    
                }
            }
        }
    },
    updateSelectionData:function(liquid) {
        if(liquid) {
            var curNodes = Liquid.getCurNodes(liquid);
            if(curNodes) {
                liquid.tableJson.selection = curNodes.length > 0 ? Liquid.getFullRecordData(liquid, curNodes[0]) : null;
                liquid.tableJson.selections = [];
                for(var i=0; i<curNodes.length; i++) {
                    liquid.tableJson.selections.push(Liquid.getFullRecordData(liquid, curNodes[i]));
                }
            } else {
                liquid.tableJson.selection = null;
                liquid.tableJson.selections = null;
            }
        }
    },
    wait_for_xhr_ready:function(liquid, description) {
        if(liquid.xhrBusy) {
            console.warn("WARNING : on control "+liquid.controlId+" waiting for request \""+liquid.xhrDescription+"\"..");
            var timeout_msec = 3000;
            const date = Date.now();
            var currentDate = null;
            do {
                currentDate = Date.now();
            } while (liquid.xhrBusy && currentDate - date < timeout_msec)
        }
        if(!liquid.xhrBusy) {
            liquid.xhrBusy = true;
            liquid.xhrDescription = description;
            Liquid.append_xhr(liquid);
            return true;
        } else {
            console.error("ERROR : on control "+liquid.controlId+" request still busy .. try with autoLoad=false in your json:"+atob(liquid.tableJson.sourceFileName));
            return false;
        }
    },
    release_xhr:function(liquid) {
        if(liquid) {
            liquid.xhrCount = 0;
            liquid.xhrBusy = false;
            // liquid.xhrDescription = "";
            for(var i=0; i<glPendingXHRs.length; i++) {
                if(glPendingXHRs[i].controlId === liquid.controlId) {
                    glPendingXHRs[i].controlId = null;
                    break;
                }
            }
        }
    },
    append_xhr:function(liquid) {
        if(liquid) {
            for(var i=0; i<glPendingXHRs.length; i++) {
                if(glPendingXHRs[i].controlId === liquid.controlId) {
                    console.error("ERROR : appending existing xhr on control : "+liquid.controlId);
                    return;
                }
                if(glPendingXHRs[i].controlId === null) {
                    glPendingXHRs[i].controlId = liquid.controlId;
                    return;
                }
            }
            glPendingXHRs.push( { controlId:liquid.controlId, xhrDescription:liquid.xhrDescription } );
            return;
        }
    },
    onWindowKeyDown:function(e, obj) {
        if(e.keyCode === 13) {
        } else if(e.keyCode === 27) {
            Liquid.onContextMenuClose();
        }
    },
    onKeyPress:function(e, obj) {
        if(e.keyCode === 13) {
            if(e.target)
                if(e.target.className.indexOf("liquidCaptionSearch") >= 0)
                    return Liquid.onSearch(e.target);
            if(obj)
                Liquid.onExecuteFilter(obj);
        } else if(e.keyCode === 27) {
            if(obj) {
                var liquid = Liquid.getLiquid(obj.id);
                if(liquid) {
                    liquid.onCloseLookup(obj);
                }
            }
        }
    },
    onFilterChange:function(e, obj) {
        if(e) {
            if(obj) {
                var liquid = Liquid.getLiquid(obj);
                if(liquid !== null) {
                    if(liquid.lastFilterTimetick) 
                        if(getCurrentTimetick() - liquid.lastFilterTimetick < Liquid.dynamicFilterMinTime) return;
                    liquid.lastFilterTimetick = getCurrentTimetick();
                    Liquid.onExecuteFilter(obj);
                }
            }
        }
    },
    getCurrentTimetick:function() {
        return ((new Date().getTime() * 10000) + 621355968000000000);        
    },
    registerOnUnloadPage:function() {
        if(!Liquid.registeredOnUnloadPage) {
            Liquid.registeredOnUnloadPage = true;
            // NO if(window.addEventListener) { window.addEventListener('beforeunload ', (event) => { return Liquid.onUnloadPage(event); } ); } else { window.attachEvent('onbeforeunload', (event) => { return Liquid.onUnloadPage(event); } ); };
            // NO if(window.addEventListener) { window.addEventListener('unload ', (event) => { return Liquid.onUnloadPage(event); } ); } else { window.attachEvent('onunload', (event) => { return Liquid.onUnloadPage(event); } ); };
            // 
            // OK : BUG on CHROME : ask only after press F5, then when close or reload
            window.onbeforeunload = function(e) { e.returnValue = Liquid.onUnloadPage(e); return e.returnValue; }; 
            window.onunload = function(e) { e.returnValue = Liquid.onUnloadPage(e); return e.returnValue; }; 
        }
    },    
    onUnloadPage:function(event) {
        // cancel pending requests
        if(glLiquids) {
            for(var il=0; il<glLiquids.length; il++) {
                var liquid = glLiquids[il];
                if(liquid.xhr) {
                    console.warn("WARNING : aborting request on "+liquid.controlId);
                    liquid.xhr.abort();
                }
            }
        }
        if(Liquid.onClosePageReturn) {
            if(event) event.returnValue = Liquid.onClosePageReturn;
            return Liquid.onClosePageReturn; 
        } else {
            if(event) event.returnValue = undefined;
        }
    },
    disableUnloadPagePrompt:function() {
        window.onbeforeunload = undefined;
        window.onunload = undefined;
        onClosePageReturn = null;
    },
    onSearch:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var search = obj.value.toUpperCase();
            if(search) {
                var ftIndex1B = Liquid.getForeignTableIndex(liquid);
                if(ftIndex1B) { // work on liquid.foreignTables[].options
                    liquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                }                
                var focusedCell = liquid.gridOptions.api.getFocusedCell();
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                if(liquid.lastSearchRec < 0) liquid.lastSearchRec = 0;
                if(liquid.lastSearchCol < 0) liquid.lastSearchCol = 0;
                for(var is=0; is<2; is++) {
                    var sr = 0;
                    if(is===0) sr = liquid.lastSearchRec;
                    for(var ir=sr; ir<nodes.length; ir++) {
                       var data = nodes[ir].data;
                       var cols = liquid.tableJson.columns;
                       var sc = 0;
                       if(is===0 && ir===sr) sc=liquid.lastSearchCol+1;
                       if(data) {
                            for(var ic=sc; ic<cols.length; ic++) {
                                var col = cols[ic];
                                if(col.field) {
                                    if(data[col.field]) {
                                        var result = data[col.field].toUpperCase().search(search);
                                        if(result>=0) {
                                            liquid.gridOptions.api.ensureColumnVisible(col.field);
                                            liquid.gridOptions.api.ensureIndexVisible(nodes[ir].rowIndex, "top");
                                            liquid.gridOptions.api.setFocusedCell(nodes[ir].rowIndex, Number(col.field), "top");
                                            Liquid.onSearchFound(liquid, ir, ic);
                                            console.log("INFO:found data at row:"+nodes[ir].rowIndex+" col:"+col.field+" ["+data[col.field]+"]");
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                var curNode = liquid.gridOptions.api.getFocusedCell();
                for(var is=0; is<2; is++) {
                    var sc = 0;
                    if(is===0) sc = liquid.lastSearchCol;
                    else sc = liquid.lastSearchCol !== 0 ? 0 : cols.length;
                    for(var ic=0; ic<cols.length; ic++) {
                        var col = cols[ic];
                        var label = typeof col.label !== 'undefined' ? col.label : col.name;
                        if(label) {
                            var result = label.toUpperCase().search(search);
                            if(result>=0) {
                                var rowIndex = curNode ? curNode.rowIndex : 1;
                                liquid.gridOptions.api.ensureColumnVisible(Number(col.field));
                                liquid.gridOptions.api.setFocusedCell(rowIndex, Number(col.field), "top");
                                Liquid.onSearchFound(liquid, -1, ic);
                                console.log("INFO:found column col:"+col.field+" ["+col.label+"]");
                                return;
                            }
                        }
                    }
                }
            }
        }
    },
    onSearchFound:function(obj, rec, col) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var itemId = liquid.controlId + ".header_label."+(liquid.lastSearchCol+1);
            var labelObj = document.getElementById(itemId);
            if(labelObj) labelObj.style.color = "";                
            itemId = liquid.controlId + ".header_label."+(col+1);
            labelObj = document.getElementById(itemId);
            if(labelObj) labelObj.style.color = "red";
            liquid.lastSearchCol = col;
            liquid.lastSearchRec = rec;
            itemId = liquid.controlId + ".Found";
            labelObj = document.getElementById(itemId);
            var foundText = Liquid.foundText;
            if(labelObj) labelObj.innerHTML = foundText.replace("${rec}", String(liquid.lastSearchRec+1)).replace("${col}", String(liquid.lastSearchCol+1));
        }
    },
    /**
     * Execute the filter
     * @param {obj} the control where to start the filters
     * @return {} n/d
     */
    onExecuteFilter:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.filtersJson) {
                var filtersJson = liquid.filtersJson[liquid.curFilter];
                if(filtersJson) {
                    if(filtersJson.columns.length > 0) {
                        var bDoFilter = false;
                        for(var i=0; i<filtersJson.columns.length; i++) {
                            var element = document.getElementById(liquid.controlId + ".filters." +(liquid.curFilter+1) + "." + filtersJson.columns[i].name + ".filter");
                            if(isDef(element.dataset.linkedInputId))
                                element = document.getElementById(element.dataset.linkedInputId);
                            if(filtersJson.columns[i].value !== element.value) {
                                filtersJson.columns[i].value = (element.value === '' ? null : (element.value === '""' ? "" : element.value));
                                if(filtersJson.columns[i].value) {
                                    var ic = 0;
                                    while (filtersJson.columns[i].value.charAt(ic) === ' ')
                                        ic++;
                                    if(filtersJson.columns[i].value.charAt(ic) === '<'
                                        || filtersJson.columns[i].value.charAt(ic) === '>'
                                        || filtersJson.columns[i].value.charAt(ic) === '!'
                                        || filtersJson.columns[i].value.charAt(ic) === '%'
                                        ) {
                                        filtersJson.columns[i].op = filtersJson.columns[i].value.charAt(ic);
                                        filtersJson.columns[i].value = filtersJson.columns[i].value.substr(ic + 1);
                                    } else if(filtersJson.columns[i].value.substring(0, 5) === 'like ') {
                                        filtersJson.columns[i].op = "like";
                                        filtersJson.columns[i].value = filtersJson.columns[i].value.substr(5);
                                    } else if(filtersJson.columns[i].value.substring(0, 3) === 'in ') {
                                        filtersJson.columns[i].op = "in";
                                        filtersJson.columns[i].value = filtersJson.columns[i].value.substr(3);
                                    } else {
                                        filtersJson.columns[i].op = ""; // let server decide
                                    }
                                }
                                if(filtersJson.columns[i].table === undefined)
                                    filtersJson.columns[i].table = "";
                                bDoFilter = true;
                                liquid.cPage = 0;
                            }
                        }
                    }
                }
                if(bDoFilter) {
                    if(liquid.tableJson) if(liquid.tableJson.isSystem === true) if(liquid.loadCounter === 0) Liquid.loadData(liquid, null);
                    if( liquid.tableJson.filterMode === "client" || filtersJson.mode === "client" ) {
                        if(liquid.tableJson.autoLoad === false) 
                            if(liquid.loadCounter === 0) 
                                Liquid.loadData(liquid, null);
                        for(var i=0; i<filtersJson.columns.length; i++) {
                            var col = Liquid.getColumn(liquid, filtersJson.columns[i].name);
                            if(col) {
                                var filterComponent = liquid.gridOptions.api.getFilterInstance(col.field);
                                filterComponent.eValue1.value = filtersJson.columns[i].value;
                                filterComponent.onBtApply();
                            } else {
                                console.error("column \""+(filtersJson.columns[i].name)+"\" not found in filter:"+(filtersJson.name ? filtersJson.name : filtersJson.label) );
                            }
                        }
                        liquid.gridOptions.api.onFilterChanged();
                    } else {
                        Liquid.loadData(liquid, null);
                    }
                }
            }
        };
    },    
    onBtFilterExecute:function(obj) {
        Liquid.onExecuteFilter(obj);
    },
    onBtFirst:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.cPage !== 0) {
            liquid.cPage = 0;
            Liquid.loadData(liquid, null);
        }
    },
    onBtLast:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.cPage+1 !== liquid.nPages) {
            liquid.cPage = liquid.nPages > 0 ? liquid.nPages - 1 : 0;
            Liquid.loadData(liquid, null);
        }
    },
    onBtNext:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.cPage + 1 < liquid.nPages) {
            liquid.cPage++;
            Liquid.loadData(liquid, null);            
        }
    },
    onPageKeyPress:function(e, obj) {
        if(e.keyCode === 13) {
            Liquid.onGotoPage(obj);
        } else if(e.keyCode === 27) {
        }
    },
    onBtPrevious:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.cPage > 0) {
            liquid.cPage--;
            Liquid.loadData(liquid, null);
        }
    },
    onGotoPage:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.cPage = Number(document.getElementById(liquid.controlId + ".cPage").value) - 1;
            if(liquid.cPage >= liquid.nPages) liquid.cPage = liquid.nPages - 1;
            if(liquid.cPage < 0) liquid.cPage = 0;
            Liquid.loadData(liquid, null);
        }
    },
    onNextRow:function(event) {        
    },
    onPrevRow:function(event) {        
    },
    onOpenLookup:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var editObj = document.getElementById(liquid.controlId + ".lookup.input");
            if(editObj)
                if(editObj.readOnly || editObj.disabled)
                    return;
            if(liquid.lookupContainerObj)
                liquid.lookupContainerObj.style.display = "inline-block";
            if(liquid.filtersFirstId) {
                var filtersFirstId = document.getElementById(liquid.filtersFirstId);
                if(filtersFirstId) {
                    filtersFirstId.focus();
                    filtersFirstId.select();
                }
            }
            if(obj.nodeType === 1) {
                var parent = obj.parentNode;
                while(parent && parent.classList && !parent.classList.contains('liquidLayoutRowContainer') && !parent.classList.contains('liquidGridContainer'))
                    parent = parent.parentNode;
                if(parent) {
                    if(parent.nodeType === 1) {
                        var classStyle = getComputedStyle(parent);
                        obj.setAttribute('containerId', parent.id);
                        obj.setAttribute('containerOverflow', classStyle.overflow);
                        parent.style.overflow = 'unset';
                    }
                }
                liquid.status = "open";
                if(liquid.needResize === true) {
                    Liquid.onResize(liquid);
                    liquid.needResize = false;
                }
            }
        }
    },
    onCloseLookup:function(obj, event) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.lookupContainerObj)
                liquid.lookupContainerObj.style.display = "none";
            liquid.status = "";
            if(liquid.gridOptions.rowSelection === "multiple") {
                Liquid.onSetLookup(obj, event);
            }
            if(obj.nodeType === 1) {
                var parentId = obj.getAttribute('containerId');
                if(parentId) {
                    document.getElementById(parentId).style.overflow = obj.getAttribute('containerOverflow');
                }
            }
        }
    },
    onResetLookup:function(obj_id, reason) {
        var obj = document.getElementById(obj_id);
        if(obj) {
            if(!obj.readOnly && !obj.disabled) {
                if(obj.value !== '') {
                    obj.value = '';
                } else {
                    if(obj.dataset) {
                        var gridLink = obj.dataset.gridlink;
                        var layoutLink = obj.dataset.layoutlink;
                        var filterLink = obj.dataset.filterlink;
                        if(filterLink)
                            Liquid.onBtFilterExecute(filterLink);
                    }
                }
            }
        }
    },
    onFilterTab:function(event) {
        var obj = event.target;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.filtersJson) {
                var filterSelector = document.getElementById(liquid.filtersSelectorId);
                var selectedId = filterSelector.options[filterSelector.selectedIndex].id;
                var nameItems = selectedId.split(".");
                if(nameItems && nameItems.length > 2) {
                    var filterIndex1B = Number(nameItems[2]);
                    if(filterIndex1B > 0) {
                        if(liquid.curFilter !== filterIndex1B-1) {
                            liquid.filtersJson[liquid.curFilter].filterDiv.style.display = 'none';
                            liquid.curFilter = filterIndex1B-1;
                            liquid.filtersJson[liquid.curFilter].filterDiv.style.display = '';
                            Liquid.onResize(liquid);
                        }
                    }                    
                }
            }
        }
    },
    createFiltersTab:function(liquid) {
        if(liquid.filtersJson) {
            var tbl = document.createElement("table");
            tbl.id = liquid.controlId + ".filters";
            tbl.className = "liquidFiltersTable";
            var tbody = document.createElement("tbody");
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            
            td = document.createElement("td");
            td.className = "liquidFiltersLabel";
            var div = document.createElement("div");
            div.innerHTML = Liquid.lang === 'eng' ? "Filter" : "Tipo ricerca";
            td.appendChild(div);
            tr.appendChild(td);

            td = document.createElement("td");
            td.id = liquid.controlId+".FiltersSelector";
            td.className = "liquidFiltersSelector";
            var filterList = document.createElement("div");
            liquid.filtersSelectorId = liquid.controlId+".filtersSelector";
            var filterHTML = "<select id=\""+liquid.filtersSelectorId+"\" style=\"width: 100%;\" class=\"liquidFiltersSelect\" onchange=\"Liquid.onFilterTab(event)\" >";
            for(var i=0; i<liquid.filtersJson.length; i++) {
                var name = typeof liquid.filtersJson[i].name !== 'undefined' ? liquid.filtersJson[i].name : Liquid.defaultFilterName;
                filterHTML += "<option id=\""+liquid.controlId+".filter."+(i+1)+".selector\" value=\"x\">"+(name)+"</option>";
            }
            filterHTML += "</select>";
            filterList.innerHTML = filterHTML;
            td.appendChild(filterList);
            tr.appendChild(td);

            td = document.createElement("td");
            td.id = liquid.controlId+".FiltersSpacer";
            td.className = "liquidFiltersSpacer";
            tr.appendChild(td);
            
            td = document.createElement("td");
            td.id = liquid.controlId+".FilterButtonTd";
            td.className = "liquidFilterButtonTd";
            td.innerHTML = "<center><button id=\"" + liquid.controlId 
                    + ".filter.execute\" type=\"button\" class=\"liquidFilterButton\" onClick=\"Liquid.onBtFilterExecute(this)\">" 
                    + (Liquid.lang === 'eng' ? "Serach" : "Cerca")
                    + "</button></center>";
            tr.appendChild(td);            
            tbody.appendChild(tr);

            tr = document.createElement("tr");
            td = document.createElement("td");
            td.colSpan = 4;
            for(var i=0; i<liquid.filtersJson.length; i++) {
                liquid.filtersJson[i].filterDiv = document.createElement("div");
                liquid.filtersJson[i].filterDiv.style.display = (liquid.curFilter === i ? '' : 'none');
                liquid.filtersJson[i].filterDiv.id = liquid.controlId+".filters."+(i+1)+".container";
                liquid.filtersJson[i].filterTable = Liquid.createFilterTab(liquid, (i+1), liquid.filtersJson[i]);
                if(liquid.filtersJson[i].filterTable) {
                    liquid.filtersJson[i].filterTable.id = liquid.controlId+".filters."+(i+1)+".content";
                    liquid.filtersJson[i].filterDiv.appendChild(liquid.filtersJson[i].filterTable);
                }
                td.appendChild(liquid.filtersJson[i].filterDiv);
                if(liquid.mode !== "lookup")
                    liquid.filtersJson[i].filterTable.style.position = "initial";
            }
            tr.appendChild(td);
            tbody.appendChild(tr);
            tbl.appendChild(tbody);
            liquid.rootObj.appendChild(tbl);
            liquid.filtersObj = tbl;
            Liquid.setDraggable(liquid.filtersObj);
        }
    },
    createFilterTab:function(liquid, filterGroupIndex, filterJson) {
        if(filterJson) {
            if(filterJson.columns) {
                var i = 0;
                var tbl = document.createElement("table");
                tbl.id = liquid.controlId+".FilterTbl";
                tbl.className = "liquidFilterTbl";
                var tbody = document.createElement("tbody");
                liquid.filtersFirstId = null;
                for(var r = 0; r < filterJson.nRows; r++) {
                    var tr = document.createElement("tr");
                    for(var c = 0; c < filterJson.nCols; c++) {
                        if(i < filterJson.columns.length) {
                            var td = document.createElement("td");
                            filterJson.columns[i].linkedContainerId = liquid.controlId + ".filters." +filterGroupIndex + "." + filterJson.columns[i].name + ".filter";
                            Liquid.createFilterObject(liquid, td, filterGroupIndex, filterJson.columns[i]);
                            tr.appendChild(td);
                            i++;
                        }
                    }
                    tbody.appendChild(tr);
                }
                tbl.appendChild(tbody);
                if(filterJson.columns)
                    liquid.filtersFirstId = liquid.controlId + ".filters." +filterGroupIndex + "." + filterJson.columns[0].name + ".filter";
                return tbl;
            }
        }
    },
    onSetLookup:function(obj, event) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var newValue = null;
            var newValueId = null;
            var lookupFieldName = typeof liquid.tableJson.lookupField !== 'undefined' && liquid.tableJson.lookupField ? liquid.tableJson.lookupField : "1";
            var lookupidColumnName = typeof liquid.tableJson.idColumnField !== 'undefined' && liquid.tableJson.idColumnField ? liquid.tableJson.idColumnField : "1";
            var lookupFieldCol = Liquid.getColumn(liquid, lookupFieldName);
            var lookupidCol = Liquid.getColumn(liquid, lookupidColumnName);
            if(liquid.gridOptions.rowSelection === "multiple") {                
                var selNodes = Liquid.getSelectedNodes(liquid);
                newValue = "";
                newValueId = "";
                for(var node=0; node<selNodes.length; node++) {
                    if(newValue.length > 0)
                        newValue += ",";
                    if(lookupFieldCol) newValue += selNodes[node].data[lookupFieldCol.field];
                    if(lookupidCol) newValueId += selNodes[node].data[lookupidCol.field];
                }
            } else {
                newValue = event && lookupFieldCol ? event.data[lookupFieldCol.field] : null;
                newValueId = event && lookupidCol ? event.data[lookupidCol.field] : null;
            }
            if(newValue !== null) {
                try {
                    var itemObj = document.getElementById(liquid.controlId + ".lookup.input");
                    itemObj.value = newValue;
                    var gridLink = (itemObj.dataset !== 'undefined' ? itemObj.dataset.gridLink : null);
                    var layoutLink = (itemObj.dataset !== 'undefined' ? itemObj.dataset.layoutlink : null);
                    var links = [ gridLink, layoutLink ];
                    for(var il=0; il<links.length; il++) {
                        var link = links[il];
                        if(isDef(link)) {
                            var linkedItemId = typeof link === 'object' ? link.id : link;
                            var nameItems = linkedItemId.split(".");
                            if(nameItems && nameItems.length > 2) {
                                var containerIndex = nameItems[2] - 1;
                                var tartgetLiquid = Liquid.getLiquid(nameItems[0]);
                                if(tartgetLiquid) {
                                    if(nameItems.length > 4) {
                                        var itemIndex = nameItems[4] - 1;
                                        if(il === 0) {
                                            if(tartgetLiquid.tableJson.grids) {
                                                var grid = tartgetLiquid.tableJson.grids[containerIndex];
                                                var gridControl = grid.columns[itemIndex];
                                                if(typeof gridControl.isReflected === 'undefined' || gridControl.isReflected !== true) {
                                                    Liquid.onGridFieldModify(event, itemObj);
                                                }
                                                Liquid.setGridFieldAsChanged(liquid, gridControl, true);
                                            }
                                        } else {
                                            if(tartgetLiquid.tableJson.layouts) {
                                                var lay = tartgetLiquid.tableJson.layouts[containerIndex];
                                                // var layControl = lay.columns[itemIndex];
                                                // if(typeof layControl.isReflected === 'undefined' || layControl.isReflected !== true) {
                                                var linkedItemObj = document.getElementById(linkedItemId);
                                                if(linkedItemObj) {
                                                    // event fitting
                                                    event.target = linkedItemObj;
                                                    Liquid.onLayoutFieldChange(event);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            if(newValueId !== null) {
                if(isDef(liquid.tableJson.idColumnLinkedObjIds)) {
                    for(var i=0; i<liquid.tableJson.idColumnLinkedObjIds.length; i++) {
                        try {
                            var itemObj = document.getElementById(liquid.tableJson.idColumnLinkedObjIds[i]);
                            itemObj.value = newValueId;
                            Liquid.onGridFieldModify(event, itemObj);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
                if(isDef(liquid.tableJson.idColumnLinkedFields)) {
                    for(var i=0; i<liquid.tableJson.idColumnLinkedFields.length; i++) {
                        try {
                            var field = liquid.tableJson.idColumnLinkedFields[i].field;
                            var targetLiquid = Liquid.getLiquid(liquid.tableJson.idColumnLinkedFields[i].controlId);
                            var col = targetLiquid.tableJson.columns[Number(field) - 1];
                            if(typeof col.isReflected === 'undefined' || col.isReflected !== true || col.isReflected === true) { // yes column is reflected, we must write it
                                var selNodes = targetLiquid.gridOptions.api.getSelectedNodes();
                                var isFormX = Liquid.isFormX(targetLiquid);
                                var isAutoInsert = Liquid.isAutoInsert(targetLiquid, null); // TODO : current layout
                                if(isFormX || isAutoInsert) {
                                    if(targetLiquid.addingRow) {
                                        selNodes = [ targetLiquid.addingNode ? targetLiquid.addingNode : { data:targetLiquid.addingRow } ];
                                    }
                                }
                                for(var node=0; node<selNodes.length; node++) {
                                    var data = selNodes[node].data;
                                    var validateResult = Liquid.validateField(targetLiquid, col, newValueId);
                                    if(validateResult !== null) {
                                        if(validateResult[0] >= 0) {
                                            newValueId = validateResult[1];
                                            Liquid.registerFieldChange(targetLiquid, null, data[ targetLiquid.tableJson.primaryKeyField ? targetLiquid.tableJson.primaryKeyField : "1" ], field, null, newValueId);
                                            Liquid.updateDependencies(targetLiquid, col, null, null);
                                            // TODO: multirecord modify
                                            break;
                                        } else {
                                            break;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        }
    },
    /**
     * Start waiting for operation
     * @param {liquid} the control where to start the waiter
     * @return {} n/d
     */
    startWaiting:function(liquid) {
        if(liquid) {
            if(liquid.waitingObj) {
                liquid.waitingObj.style.display = '';
            }
        }
    },
    /**
     * Stop waiting for operation
     * @param {liquid} the control where to top the waiter
     * @return {} n/d
     */
    stopWaiting:function(liquid) {
        if(liquid) {
            if(liquid.waitingObj) {
                liquid.waitingObj.style.display = 'none';
            }
        }
    },
    getRootSourceControlId(liquid) {
        var srcLiquidControlId = "";
        while(liquid && typeof liquid.rootControlId !== 'undefined' && liquid.rootControlId) {
            srcLiquidControlId = liquid.rootControlId;
            liquid = liquid.srcLiquid;
        }
        return srcLiquidControlId;
    },    
    getForeignTableIndex:function(liquid) {
        var ftIndex1B = 0;
        if(liquid.lastForeignTabObjSelected) {
            var nameItems = liquid.lastForeignTabObjSelected.id.substring(1).split(".");
            if(nameItems[1] === 'foreignTable') {
                for(var ift=0; ift<liquid.foreignTables.length; ift++) {
                    if(liquid.foreignTables[ift].tabId === liquid.lastForeignTabObjSelected.id) {
                        table = liquid.foreignTables[ift].foreignTable;
                        ftIndex1B = ift + 1;
                    }
                }
            }
        }
        return ftIndex1B;
    },
    addForeignTable:function(liquid, foreignTableObj, sourceForeignTable, sourceLiquidControlId) {
        if(typeof liquid.foreignTables === 'undefined' || !liquid.foreignTables) liquid.foreignTables = [];
        if(!(liquid.foreignTables instanceof Array)) liquid.foreignTables = [];
        if(isDef(sourceForeignTable)) {
            foreignTableObj.sourceForeignTable = sourceForeignTable;
            foreignTableObj.sourceLiquidControlId = sourceLiquidControlId;
        }
        var ftId = foreignTableObj.foreignTable + "$" + foreignTableObj.foreignColumn + "$" + foreignTableObj.column;
        foreignTableObj.controlId = ftId + "@" + (typeof sourceLiquidControlId !== 'undefined' && sourceLiquidControlId ? sourceLiquidControlId : liquid.controlId);
        liquid.foreignTables.push(foreignTableObj);
        // nested foreignTables
        if(isDef(foreignTableObj.foreignTables)) {
            for(var i=0; i<foreignTableObj.foreignTables.length; i++) {
                if(isDef(foreignTableObj.sourceForeignTable)) {
                    if(typeof foreignTableObj.sourceForeignTable.linkedForeignTable === 'undefined') {
                        foreignTableObj.sourceForeignTable.linkedForeignTable = [];
                    }
                    foreignTableObj.sourceForeignTable.linkedForeignTable.push(foreignTableObj.foreignTables[i]);
                }
                Liquid.addForeignTable(liquid, foreignTableObj.foreignTables[i], foreignTableObj, foreignTableObj.controlId);
            }
        }
    },
    onForeignTablesDisableCascade:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var liquidsToDisable = [];
            var liquidRoot = liquid;
            if(liquid.linkedLiquids) {
                for(var i=0; i<liquid.linkedLiquids.length; i++) {
                    if(liquid.linkedLiquids[i]) {
                        var liquidToRefresh = liquid.linkedLiquids[i];
                        if(liquidToRefresh) {
                            liquidsToDisable.push(liquidToRefresh);
                            liquidRoot = liquidToRefresh;
                            while(liquidToRefresh && liquidToRefresh.srcLiquidControlId) {
                                liquidRoot = liquidToRefresh = liquidToRefresh.srcLiquid;
                            }
                        }
                    }
                }
            }
            if(isDef(liquidRoot.foreignTables)) {
                for(var i=0; i<liquidRoot.foreignTables.length; i++) {
                    var ftLiquid = Liquid.getLiquid(liquidRoot.foreignTables[i].controlId);
                    if(ftLiquid) {                
                        if(liquidsToDisable.indexOf(ftLiquid) >= 0) {
                            var mode = "disabled";
                            Liquid.doForeignTablesDisableCascade(liquidRoot, ftLiquid, liquidRoot.foreignTables[i], mode);
                        }
                    }
                }
            }
        }
    },
    doForeignTablesDisableCascade:function(liquidRoot, liquid, foreignTable, mode) {
        if(liquidRoot) {
            if(foreignTable) {
                Liquid.onForeignTableMode(liquidRoot, foreignTable.tabId, foreignTable, mode);
                if(liquid.gridOptions) {
                    if(liquid.gridOptions.api) {
                        liquid.gridOptions.api.showLoadingOverlay();
                        liquid.gridOptions.api.setRowData(null);
                    }
                }
                // Turn On waiters
                Liquid.showHideWaiters(liquid, true);
                if(isDef(foreignTable.foreignTables)) {
                    for(var i=0; i<foreignTable.foreignTables.length; i++) {
                        var ftLiquid = Liquid.getLiquid(foreignTable.foreignTables[i].controlId);
                        if(ftLiquid) {                
                            Liquid.doForeignTablesDisableCascade(liquidRoot, ftLiquid, foreignTable.foreignTables[i], mode);
                        }
                    }
                }
            }
        }
    },
    onForeignTablesMode:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(liquid.homeTabId))
                Liquid.onForeignTableMode(liquid, liquid.homeTabId, null, "");
            if(isDef(liquid.foreignTables)) {
                for(var i=0; i<liquid.foreignTables.length; i++) {
                    var mode = "";
                    var foreignTable = liquid.foreignTables[i];
                    if(foreignTable.sourceLiquidControlId) {
                        if(typeof foreignTable.sourceLiquid === 'undefined' || !foreignTable.sourceLiquid) {
                            foreignTable.sourceLiquid = Liquid.getLiquid(foreignTable.sourceLiquidControlId);
                            if(!foreignTable.sourceLiquid) {
                                console.error("ERROR: control : "+foreignTable.sourceLiquidControlId+" still pending...");
                            }
                        }
                        if(foreignTable.sourceLiquid /*&& typeof foreignTable.sourceLiquid.srcLiquid !== 'undefined' && foreignTable.sourceLiquid.srcLiquid*/) {
                            var selNodes = foreignTable.sourceLiquid.gridOptions.api.getSelectedNodes();
                            if(typeof selNodes === 'undefined' || !selNodes || !selNodes.length) mode = "disabled";
                        } else {
                            mode = "disabled";
                        }
                    }
                    Liquid.onForeignTableMode(liquid, liquid.foreignTables[i].tabId, liquid.foreignTables[i], mode);
                }
            }
        }
    },
    onForeignTableMode:function(liquid, tabId, foreignTable, mode) {
        if(liquid) {
            if(tabId) {
                var nameItems = tabId.split(".");
                if(nameItems.length > 2) {
                    // Liquid.setForeignTableModeChanged(liquid, grid.columns[ic], false);
                    var obj = document.getElementById(tabId);
                    if(obj) {
                        if(mode === "disabled") {
                            obj.classList.remove('liquidForeignTableEnabled');
                            obj.classList.add('liquidForeignTableDisabled');
                            obj.style.pointerEvents="none";
                        } else {
                            obj.classList.remove('liquidForeignTableDisabled');
                            obj.classList.add('liquidForeignTableEnabled');
                            obj.style.pointerEvents="auto";
                        }
                    }
                }
            }
        }
    },
    onForeignTable:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nameItems = obj.id.split(".");
            if(nameItems.length > 2) {
                var ftId = nameItems[2];
                if(liquid.lastForeignTabSelected)
                    liquid.lastForeignTabSelected.className = "";
                liquid.lastForeignTabSelected = obj.parentNode;
                obj.parentNode.className = "liquidTabSel";
                if(liquid.lastForeignTabObjSelected)
                    document.getElementById(liquid.lastForeignTabObjSelected.id + ".content").style.display = "none";
                liquid.lastForeignTabObjSelected = obj;
                document.getElementById(obj.id + ".content").style.display = "";
                Liquid.processLinkedLiquidForResize(liquid, nameItems[2]);
            }
        }
    },
    processLinkedLiquidForResize:function(liquid, targetControlId) {
        if(liquid) {
            if(liquid.linkedLiquids) {
                for(var i=0; i<liquid.linkedLiquids.length; i++) {
                    if(targetControlId === "" || targetControlId === null || targetControlId === '*') {
                        Liquid.setAutoresizeColumn(liquid.linkedLiquids[i], false);
                    } else {
                        var liquidControlIdParts = liquid.linkedLiquids[i].controlId.split("$");
                        var liquidControlId = liquidControlIdParts[0];
                        if( targetControlId === liquidControlId) {
                            Liquid.setAutoresizeColumn(liquid.linkedLiquids[i], false);                            
                        }
                    }
                    if(liquid.linkedLiquids[i].linkedLiquids) {
                        Liquid.processLinkedLiquidForResize(liquid.linkedLiquids[i], targetControlId);
                    }
                }
            }
        }
    },
    onNewForeignTable:function(event, mode) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {
            var nameItems = obj_id.split(".");
            Liquid.startPopup('liquidSelectForeignKeys', window.liquidSelectForeignKeys);
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            selectorLiquid.tableJson.caption = "New Liquid Foreign Table : <b>create or select foreign key</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            if(nameItems[1] === 'newForeignTable') {
                selectorLiquid.tableJson.table = liquid.tableJson.table;
            } else {
                if(nameItems.length > 2) { selectorLiquid.tableJson.table = nameItems[2]; } else { console.error("ERROR: unrecognize context:"+obj.id); return; }
            }
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onNewForeignTableProcess('"+obj_id+"','"+mode+"')";
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
                                    newForeignTableJson = { name:foreignName, tooltip:"", icon:"", column:sel["COLUMN"], foreignTable:sel["FOREIGN_TABLE"], foreignColumn:sel["FOREIGN_COLUMN"], options:{ autoSelect:true, autoSizeColumns:true } };
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
                    liquid.tableJsonSource.askForSave = true;
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    getForeignTablesContainer:function(foreignTables, searchingName) {
        if(foreignTables) {
            for(var i=0; i<foreignTables.length; i++) {
                if(foreignTables[i].foreignTable === searchingName) {
                    if(typeof foreignTables[i].foreignTables === 'undefined' || !foreignTables[i].foreignTables) foreignTables[i].foreignTables = [];
                    return foreignTables[i].foreignTables;
                }
                if(foreignTables[i].foreignTables) {
                    var targetForeignTables = Liquid.getForeignTablesContainer(foreignTables[i].foreignTables, searchingName);
                    if(targetForeignTables) return targetForeignTables;
                }
            }
        }
        return null;
    },
    onNewGrid:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {
            Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            selectorLiquid.tableJson.caption = "New grid : <b>select columns</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            var table = liquid.tableJson.table;
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                table = tagetLiquid.tableJson.table;
            }            
            selectorLiquid.tableJson.table = table;
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onNewGridProcess('"+obj_id+"',"+ftIndex1B+")";
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
                                    var ftLiquid = null;
                                    var gridColumns = [];
                                    
                                    if(ftIndex1B) ftLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);

                                    for(var i=0; i<sels.length; i++) {
                                        var gridColumn = { name:sels[i]["COLUMN"], tooltip:sels[i]["REMARKS"], label:sels[i]["COLUMN"], row:Math.floor(i/nCols), col:(i%nCols) };
                                        gridColumns.push( gridColumn );                                        
                                        if(ftIndex1B) {
                                            // TODO : add column ?
                                            var iField1B = Liquid.solveGridField(ftLiquid, gridColumn);
                                            if(iField1B <= 0) {
                                                var listColumn = { name:sels[i]["COLUMN"], visible:false };
                                                ftLiquid.tableJsonSource.columns.push(listColumn);
                                                ftLiquid.tableJsonSource.columnsResolved = false;
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
                                    if(ftIndex1B) {
                                        var foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                                        if(typeof foreignTable.options === 'undefined') foreignTable.options = { grids:[] };
                                        var optionsJson = foreignTable.options ? foreignTable.options : { grids:[] };
                                        if(typeof optionsJson.grids === 'undefined' || !optionsJson.grids) optionsJson.grids = [];
                                        optionsJson.grids.push( newGridJson );
                                    } else {
                                        liquid.tableJsonSource.grids.push( newGridJson );
                                        liquid.tableJsonSource.askForSave = true;
                                    }
                                    liquid.tableJsonSource.askForSave = true;
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
    onNewFilters:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {
            Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            selectorLiquid.tableJson.caption = "New Liquid Filters : </b>select columns</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            selectorLiquid.tableJson.table = liquid.tableJson.table;
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onNewFiltersProcess('"+obj_id+"')";
            if(typeof event === 'object') event.stopPropagation();
        }
    },    
    onNewFiltersProcess:function(obj_id) {
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
                                    if(typeof liquid.curFilter === 'undefined' || liquid.curFilter === null) liquid.curFilter = 0;
                                    if(typeof liquid.tableJsonSource.filters === 'undefined' || !liquid.tableJsonSource.filters) liquid.tableJsonSource.filters = [];
                                    if(!Array.isArray(liquid.tableJsonSource.filters)) {
                                        liquid.curFilter = 0;
                                        liquid.tableJsonSource.filters = [ liquid.tableJsonSource.filters ];
                                    }
                                    if(nameItems[1] === 'newFilters') {
                                        var newFiltersJson = { name:filtersName, title:filtersName, tooltip:"", icon:"", nRows:nRows, nCols:nCols, columns:filtersColumns };
                                        try { console.log("INFO: new filters json : \n"+JSON.stringify(newFiltersJson)); } catch(e) { console.error(e); }
                                        liquid.tableJsonSource.filters.push( newFiltersJson );
                                    } else if(nameItems[1] === 'newFilter') {
                                        if(liquid.curFilter >= liquid.tableJsonSource.filters.length)
                                            liquid.curFilter = liquid.tableJsonSource.filters.length-1;
                                        if(typeof liquid.tableJsonSource.filters[liquid.curFilter].columns === 'undefined' || !liquid.tableJsonSource.filters[liquid.curFilter].columns) 
                                            liquid.tableJsonSource.filters[liquid.curFilter].columns = [];
                                        for(var ic=0; ic<filtersColumns.length; ic++) {
                                            var filterColumn = filtersColumns[ic];
                                            try { console.log("INFO: new filter json : \n"+JSON.stringify(filterColumn)); } catch(e) { console.error(e); }
                                            liquid.tableJsonSource.filters[liquid.curFilter].columns.push( filterColumn );
                                        }
                                    }
                                    liquid.tableJsonSource.askForSave = true;
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
    onNewCommand:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {
            if(liquid.tableJsonSource) {
                if(typeof liquid.tableJsonSource.commands === 'undefined' || !liquid.tableJsonSource.commands) 
                    liquid.tableJsonSource.commands = [];
                var command = {};
                var userCmdName = prompt("Enter command name", "new_command"+(liquid.tableJsonSource.commands.length+1));
                if(userCmdName) {
                    var cmdName = userCmdName.replace(/\ /g, "_");
                    var cmdText = userCmdName.replace(/_/g, " ");
                    var cmdImage = "new.png";
                    // system
                    // command = {name:"insert", img:"add.png", size:20, text:"Aggiungi", labels:["Salva"], rollback:"Annulla", rollbackImg:"cancel.png" }
                    var userClientSide = prompt("Enter client side action", "alert(\"Command fired\")");
                    var userServerSide = prompt("Enter server side action", "com.company.application.class");                    
                    // custom command
                    command = { name:cmdName, img:cmdImage, size:20, text:cmdText , server:userServerSide, params:["test1", "test2"], client:userClientSide  };
                    liquid.tableJsonSource.commands.push(command);                    
                    try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource)); } catch(e) { console.error(e); }
                    liquid.tableJsonSource.askForSave = true;
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    onNewActionBar:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
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
                    liquid.tableJsonSource.askForSave = true;
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    onNewCommandBar:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
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
                    liquid.tableJsonSource.askForSave = true;
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    onNewEvent:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {            
            // TODO : dialogo tipo evento  + codice java callback
            Liquid.onContextMenu({target:{classList:["liquidEvent"],id:liquid.controlId}});
        }
    },
    onNewEventOk:function(formId, obj) {
        var liquid = Liquid.getLiquid(obj);
        Liquid.onContextMenuClose();
        if(liquid) {
            var event = {};
            var formObj = document.getElementById(formId);
            Liquid.formToObjectExchange(formObj, event);
            if(liquid.tableJsonSource) {
                if(typeof liquid.tableJsonSource.events === 'undefined' || !liquid.tableJsonSource.events)
                    liquid.tableJsonSource.events = [];
                liquid.tableJsonSource.events.push( event );
                liquid.tableJsonSource.askForSave = true;
                Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
            }
        }
    },
    onNewWindowFromTableName:function(tableName, mode, parentObjId) {
        Liquid.onContextMenuClose();
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
        Liquid.onContextMenuClose();
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by serveer-side");
            return;
        }
        Liquid.startPopup('liquidSelectTables', window.liquidSelectTables);
        var selectorLiquid = Liquid.getLiquid("liquidSelectTables");
        if(selectorLiquid) {
            selectorLiquid.tableJson.caption = "New Liquid Window : <b>select table</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            selectorLiquid.tableJson.schema = Liquid.curSchema;
            selectorLiquid.tableJson.table = "";
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onNewWindowProcess('"+obj_id+"'"+",'"+(mode?mode:'winX')+"','"+(parentObjId?parentObjId:'WinXContainer')+"')";
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
                        var table = sels[0]["TABLE"];
                        Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
                        var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
                        selectorLiquid.tableJson.caption = "New Liquid Window : <b>select columns</b>";
                        selectorLiquid.tableJson.database = Liquid.curDatabase;
                        selectorLiquid.tableJson.schema = Liquid.curSchema;
                        selectorLiquid.tableJson.table = table;
                        Liquid.loadData(selectorLiquid, null);
                        selectorLiquid.onPostClosed = "Liquid.onNewWindowProcess2('"+obj_id+"','"+mode+"','"+parentObjId+"','"+table+"')";
                        if(typeof event === 'object') event.stopPropagation();
                    }
                }
            }
        } else console.error("ERROR: selector module not found");
    },
    onNewWindowProcess2:function(obj_id, mode, parentObjId, table) {
        var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
        if(selectorLiquid) {
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        var cols = [];
                        for(var i=0; i<sels.length; i++) {
                            cols.push( { name:sels[i]["COLUMN"], width:"!auto", label:sels[i]["COLUMN"] } );
                        }
                        var defaultVal = "";
                        if(mode === 'winX')
                            defaultVal = ""+(table)+"";
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
                            liquidJson = { database:Liquid.curDatabase, schema:Liquid.curSchema, table:table, columns:cols, caption:controlId, mode:mode, parentObjId:parentObjId, autoFitColumns:true, width:width, height:height, resize:"both", askForSave:true, editable:true };
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
            }
        } else console.error("ERROR: selector module not found");
    },
    onNewWindowFromFileJson:function(obj_id, mode, parentObjId, file) {
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                Liquid.onNewWindowFromJsonProcess(obj_id, mode, parentObjId, e.target.result);
            };
        })(file);
        reader.readAsText(file);
    },      
    onNewWindowFromJson:function(obj_id, mode, parentObjId) {
        Liquid.onContextMenuClose();
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by serveer-side");
            return;
        }
        var parentObj = document.getElementById(parentObjId);
        var width = Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5;
        var height = Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5;
        var liquidJsonString = prompt("Enter control json", "{}");
        return Liquid.onNewWindowFromJsonProcess(obj_id, mode, parentObjId, liquidJsonString);
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
    onNewColumns:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        Liquid.onContextMenuClose();
        if(liquid) {            
            if(liquid.tableJsonSource) {
                Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
                var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
                selectorLiquid.tableJson.caption = "New Liquid Window : <b>select columns</b>";
                selectorLiquid.tableJson.database = Liquid.curDatabase;
                selectorLiquid.tableJson.schema = Liquid.curSchema;
                selectorLiquid.tableJson.table = liquid.tableJson.table;
                Liquid.loadData(selectorLiquid, null);
                selectorLiquid.onPostClosed = "Liquid.onNewColumnsProcess('"+obj_id+"')";
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
                            // TODO : rimozioe e aggiunta colonne
                            liquid.tableJsonSource.askForSave = true;
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
        Liquid.onContextMenuClose();
        if(liquid) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', glLiquidServlet + '?operation=getColumnsManager&controlId=' + liquid.controlId);
            xhr.send(JSON.stringify(liquid.tableJsonSource));
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                Liquid.startPopup('liquidColumnsManager', xhr.responseText);
                                var selectorLiquid = Liquid.getLiquid("liquidColumnsManager");
                                selectorLiquid.tableJson.caption = "Columns Manager : <b>"+liquid.controlId+"</b>";
                                // selectorLiquid.tableJson.database = Liquid.curDatabase;
                                // selectorLiquid.tableJson.schema = Liquid.curSchema;
                                // selectorLiquid.tableJson.table = liquid.tableJson.table;
                                Liquid.loadData(selectorLiquid, null);
                                selectorLiquid.onPostClosed = "Liquid.onColumnsManagerProcess('"+liquid.controlId+"')";
                            } else
                                console.error(xhr.responseText);
                        } catch (e) {
                            console.error(xhr.responseText);
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
                                        for(var ic=0; ic<resltJson.updatedColumns.length; ic++) {
                                            for(var ics=0; ics<liquid.tableJsonSource.columns.length; ics++) {
                                                if(liquid.tableJsonSource.columns[ics].name === resltJson.updatedColumns[ic].name) {
                                                    Liquid.overlayObjectContent( liquid.tableJsonSource.columns[ics], resltJson.updatedColumns[ic] );
                                                    break;
                                                }
                                            }
                                        }
                                        for(var ic=0; ic<resltJson.addedColumns.length; ic++) {
                                            if(resltJson.addedColumns[ic].name) {
                                                liquid.tableJsonSource.columns.push( resltJson.addedColumns[ic] );
                                            }
                                        }
                                        for(var ic=0; ic<resltJson.deletedColumns.length; ic++) {
                                            var name = resltJson.deletedColumns[ic].name;
                                            if(name) {
                                                for(var index=0; index<liquid.tableJsonSource.columns.length; index++) {
                                                    if(liquid.tableJsonSource.columns[index].name == name) {
                                                        try { console.log("INFO: on "+liquid.controlId+" removed column "+name); } catch (e) { }
                                                        liquid.tableJsonSource.columns.splice(index, 1);
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        liquid.tableJsonSource.columnsResolved = false;
                                        liquid.tableJsonSource.askForSave = true;
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
    onSetDatabase:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidSelectDatabases', window.liquidSelectDatabases);
        var selectorLiquid = Liquid.getLiquid("liquidSelectDatabases");
        if(selectorLiquid) {
            selectorLiquid.tableJson.caption = "<b>Select current Database</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onSetDatabaseProcess('"+obj_id+"')";
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
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidSelectSchemas', window.liquidSelectSchemas);
        var selectorLiquid = Liquid.getLiquid("liquidSelectSchemas");
        if(selectorLiquid) {
            selectorLiquid.tableJson.caption = "<b>Select current Schema</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            selectorLiquid.tableJson.schema =  Liquid.curSchema;
            Liquid.loadData(selectorLiquid, null);
            selectorLiquid.onPostClosed = "Liquid.onSetSchemaProcess('"+obj_id+"')";
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
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidAssets', window.liquidAssets);
    },
    onLiquidRoles:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidRoles', window.liquidRoles);
    },
    onLiquidRolesAssets:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidRolesAssets', window.liquidRolesAssets);
    },
    onLiquidUsersRoles:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidUsersRoles', window.liquidUsersRoles);
    },
    onLiquidUsersAsset:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        Liquid.onContextMenuClose();
        Liquid.startPopup('liquidUsersAsset', window.liquidUsersAsset);
    },
    onMenuOptions:function(obj) {
        Liquid.onContextMenu({target:{classList:["liquidMenuX"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onOptions:function(obj) {
        Liquid.onContextMenu({target:{classList:["liquidOptions"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onLiquidOptions:function() {
        Liquid.onContextMenu({target:{classList:["liquidGeneralOptions"],id:null}});
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
                if(typeof foreignTable.options === 'undefined') foreignTable.options = { grids:[] };
                var optionsJson = foreignTable.options ? foreignTable.options : { };
                Liquid.formToObjectExchange(obj, foreignTable.options);
            }
            if(Liquid.formToObjectExchange(obj, tagetLiquid.tableJsonSource)) {
                try { console.log("INFO: updated table json : \n"+JSON.stringify(tagetLiquid.tableJsonSource)); } catch(e) { console.error(e); }
                Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                liquid.askForSave = true;
            } else {
                console.log("INFO: no changes to apply");
            }
        }
    },
    onLiquidOptionsOk:function(objId) {
        var obj = document.getElementById(objId);        
        Liquid.formToObjectExchange(obj, Liquid);
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
                            Liquid.onContextMenu({target:{classList:["liquidConnection"],id:null}});
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
        Liquid.onContextMenuClose();
        var db = prompt("Database where to search, * for all", Liquid.curDatabase ? Liquid.curDatabase: "*");
        if(db) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                Liquid.onDoSearch(db, null, null, searchFor);
                Liquid.lastSearchFor = searchFor;
            }
        }
    },
    onSearchSchema:function(event) {
        Liquid.onContextMenuClose();
        var scm = prompt("Schema where to search, * for all (current db.schema: "+(Liquid.curDatabase ? Liquid.curDatabase : "[N/D]")+"."+(Liquid.curSchema ? Liquid.curSchema : "[N/D]")+")", Liquid.curSchema ? Liquid.curSchema : "*");
        if(scm) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                Liquid.onDoSearch(Liquid.curDatabase, scm, null, searchFor);
                Liquid.lastSearchFor = searchFor;            
            }
        }
    },
    onSearchTable:function(event) {
        Liquid.onContextMenuClose();
        var tbl = prompt("Table where to search, * for all (cur database.schema:"+Liquid.curDatabase+"."+Liquid.curSchema+")", "*");
        if(tbl) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                Liquid.onDoSearch(Liquid.curDatabase, Liquid.curSchema, tbl, searchFor);
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
    handleFormText:function(childNode) {
        if(childNode.name.toLowerCase() === 'redirect' || childNode.id.toLowerCase() === 'redirect') {
            if(childNode.value === '' || childNode.value === './') {
                return window.location.href;
            } else if(childNode.value === '/') {
                return window.location.origin;
            } else {
                return childNode.value;
            }
        } else {
            return childNode.value;
        }
    },    
    formToObjectExchange:function(obj, targetObj) {
        var nUpdates = 0;
        if(obj && targetObj) {
            for(var j=0; j<obj.childNodes.length; j++) {
                if(obj.childNodes[j].nodeName.toUpperCase()==='INPUT') {
                    if(obj.childNodes[j].id) {
                        var propName = obj.childNodes[j].id;
                        var propValue = null;
                        if(obj.childNodes[j].type === 'text'){
                            propValue = Liquid.handleFormText(obj.childNodes[j]);
                        } else if(obj.childNodes[j].type === 'checkbox'){
                            propValue = obj.childNodes[j].checked ? true : false;
                        } else if(obj.childNodes[j].type === 'file') {
                            var queue = { obj:obj, targetObj:targetObj, files:obj.childNodes[j].files, iFile:0, propName:propName, propValue:null, linkToFile:null };
                            Liquid.formFilesToObjectExchange(queue);
                        } else if(obj.childNodes[j].type === 'number') {
                            propValue = Number(obj.childNodes[j].value);
                        } else if(obj.childNodes[j].type) {
                            console.warn("WARNING : object type:"+obj.childNodes[j].type);
                            propValue = obj.childNodes[j].value;
                        }
                        nUpdates += Liquid.formToObjectUpdate(targetObj, propName, propValue);
                    }                    
                } else if(obj.childNodes[j].nodeName === 'TEXTAREA') {
                    var propName = obj.childNodes[j].id;
                    var propValue = obj.childNodes[j].value;
                    nUpdates += Liquid.formToObjectUpdate(targetObj, propName, propValue);
                } else if(obj.childNodes[j].nodeName.toUpperCase()==='TBODY' || obj.childNodes[j].nodeName.toUpperCase()==='TR' || obj.childNodes[j].nodeName.toUpperCase()==='TD' || obj.childNodes[j].nodeName.toUpperCase()==='DIV' || obj.childNodes[j].nodeName.toUpperCase()==='SPAN' || obj.childNodes[j].nodeName.toUpperCase()==='P') {
                    nUpdates += Liquid.formToObjectExchange(obj.childNodes[j], targetObj);
                }
            }
        }
        return nUpdates;
    },
    formToObjectUpdate:function(targetObj, propName, propValue) {
        if(targetObj[propName] !== propValue) {
            if(isDef(targetObj[propName])) 
                console.log("INFO: Update property "+propName+" "+targetObj[propName]+"->"+propValue);
            targetObj[propName] = propValue;
            return 1;
        }
        return 0;
    },
    formFilesToObjectExchange:function(queue) {
        if(queue) {
            if(queue.iFile < queue.files.length) {
                var file = queue.files[queue.iFile];
                if(file) {
                    var reader = new FileReader();
                    // reader.readAsDataURL(file);
                    reader.readAsBinaryString(file);
                    reader.onload = function(evt) {
                        try { 
                            if(queue.linkToFile === true) { 
                                // For security reason canno get file path... only update file content
                            }
                            if(queue.files.length === 1) {
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
                            	queue.propValue = "base64,"+btoa(evt.target.result);                            	
                            	var t2 = performance.now();
                            	var s3 = queue.propValue.length;
                            	console.log("ZIP time:"+(t2-t1)/1000.0 + " sec, size:"+s1 / 1024 +" / "+s2/1024+" / "+s3/1024 + " Kb, ratio:"+(s3/s1 * 100.0)+"%")
                            } else {
                                if(!queue.propValue) queue.propValue = [];
                                queue.propValue.push(evt.target.result); 
                            }
                        } catch(e) { console.error(e); }
                        queue.iFile++;
                        Liquid.formFilesToObjectExchange(queue);
                    };
                    reader.onerror = function (evt) {
                        console.error("ERROR: file read error");
                        queue.propValue.push("");
                        queue.iFile++;
                        Liquid.formFilesToObjectExchange(queue);
                    };
                }
            } else {
                if(queue.targetObj && queue.propName)
                    queue.targetObj[queue.propName] !== queue.propValue;
                if(queue.targetRow && queue.targetCol) {
                    var validateResult = Liquid.validateField(queue.liquid, queue.liquid.tableJson.columns[queue.targetCol.field], queue.propValue);
                    if(validateResult !== null) {
                        if(validateResult[0] >= 0) {
                            queue.propValue = validateResult[1];
                            // NO : hude file can be pronlematic here
                            // Liquid.registerFieldChange(queue.liquid, null, queue.targetRow[ queue.liquid.tableJson.primaryKeyField ? queue.liquid.tableJson.primaryKeyField : "1" ], queue.targetCol.field, null, queue.propValue);
                            var rowId = queue.targetRow[ queue.liquid.tableJson.primaryKeyField ? queue.liquid.tableJson.primaryKeyField : "1" ];
                            if(rowId === '' || rowId === null) {
                                if(queue.liquid.addingNode) {
                                	queue.liquid.addingNode.data[queue.targetCol.field] = queue.propValue;
                                }
                                if(queue.liquid.addingRow) {
                                	queue.liquid.addingRow[queue.targetCol.field] = queue.propValue;
                                }
                            }
                            Liquid.updateDependencies(queue.liquid, queue.targetCol, null, null);
                        }
                    }
                }
            }
        }
    },
    getEventsByName:function(liquid, eventName) {
        var events = [];
        if(liquid) {
            for(var ievt = 0; ievt < liquid.tableJson.events.length; ievt++) {
                var event = liquid.tableJson.events[ievt];
                if(eventName === event.name) {
                    events.push(liquid.tableJson.events[ievt]);
                }
            }
        }
        return events;
    },
    onEvent:function(obj, eventName, eventData, callback, callbackParams, defaultRetval, bAlwaysCallback) {
        var liquid = Liquid.getLiquid(obj);
        var result = typeof defaultRetval !== 'undefined' ? defaultRetval : null;
        var systemEventCounter = 0;
        var eventCounter = 0;
        var systemResult = typeof defaultRetval !== 'undefined' ? defaultRetval : null;;
        if(liquid) {
            if(liquid.tableJson) {
                if(liquid.tableJson.events) {
                    //
                    //  N.B. : Needs to execute user event and system event syncronously (system event onInserting need to pass data to user event onInserting)
                    //         Execute first the system event, than if no system event execute user event
                    //
                    events = Liquid.getEventsByName(liquid, eventName);
                    eventCounter = events.length;
                    for(var ievt = 0; ievt < events.length; ievt++) {                        
                        var event = events[ievt];
                        if(event) {
                            if(Liquid.isSystemEvent(event)) { // system event take care of the syncronous chain
                            	var eventParams = Liquid.buildCommandParams(liquid, event);
                                res = systemResult = Liquid.onEventProcess(liquid, event, obj, eventName, eventParams.params, eventData, callback, callbackParams, defaultRetval);
                                systemEventCounter++;
                                eventCounter++;
                            }
                        }
                    }
                    if(!systemEventCounter) { // no starting system event : execute now
                        for(var ievt = 0; ievt < events.length; ievt++) {
                            var event = events[ievt];
                            if(event) {
                                if(!Liquid.isSystemEvent(event)) {
                                	var eventParams = Liquid.buildCommandParams(liquid, event);
                                    res = Liquid.onEventProcess(liquid, event, obj, eventName, eventParams.params, eventData, null, null, defaultRetval);
                                    result = res;
                                    eventCounter++;
                                }
                            }
                        }
                    }
                }
            }
        }
        if(bAlwaysCallback) {
            if(callback) {
                result = callback(callbackParams);
            }
        }
        return {result: result ? result : defaultRetval, systemResult: systemResult, nEvents: eventCounter, nSystemEvents: systemEventCounter};
    },
    onEventProcess:function(liquid, event, obj, eventName, eventParams, eventData, callback, callbackParams, defaultRetval) {
        if(event) {
            var retVal = null;
            
            if(event.client) {
                retVal = retVal !== null ? retVal : true;
                if(callback) {
                    retVal = callback(callbackParams);
                } else {
                    if(event.clientAfter !== true || event.clientBefore === true) {
                        Liquid.executeClientSide(liquid, "event:"+event.name, event.client, (event.params ? event.params : eventData), event.isNative);
                    }
                }
            }
            
            if(event.server) {
                event.response = null;
                Liquid.registerOnUnloadPage();
                if(!event.xhr)
                    event.xhr = new XMLHttpRequest();
                if(event.xhr) {
                    event.xhr.open('POST', glLiquidServlet 
                            + '?operation=exec'
                            + '&className=' + encodeURI(event.server)
                            + '&clientData=' + encodeURI(JSON.stringify(event))
                            + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : ""),
                            (event.sync === true ? false : true)
                            );
                    
                    event.xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, event, "Event", e, event.onUploading, event.onUploadingParam); }, false);
                    event.xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, event, "Event", e, event.onDownloading, event.onDownloadingParam); }, false);
                    event.xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, event, "Event", e, event.onLoad, event.onLoadParam); }, false);
                    event.xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, event, "Event", e, event.onError, event.onErrorParam); }, false);
                    event.xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, event, "Event", e, event.onAbort, event.onAbortParam); }, false);
                    
                    var onreadystatechange = function() {
                        if(event.xhr.readyState === 4) {
                            if(event.xhr.status === 200) {                                
                                if(event.clientAfter === true || event.clientBefore === false) {
                                    Liquid.executeClientSide(liquid, "event:"+event.name, event.client, event.params, event.isNative);
                                }                                
                                try {
                                    var httpResultJson = null;
                                    if(event.xhr.responseText !== null && event.xhr.responseText !== 'null') {
                                        try {
                                            var responseText = Liquid.getXHRResponse(event.xhr.responseText);
                                            httpResultJson = JSON.parse(responseText);
                                        } catch (e) {
                                            httpResultJson = null;
                                            console.error("response:"+responseText);
                                            console.error("ERROR : onEventProcess() : errore in response process:" + e  + " on event "+event.name+" on control "+liquid.controlId);
                                        }
                                        
                                        event.response = httpResultJson;
                                        if(httpResultJson) {
                                            if(event.name === 'onGetSelection') {
                                                try {
                                                    liquid.ids = httpResultJson.ids;
                                                    Liquid.setNodesSelected(liquid, liquid.ids);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                            if(httpResultJson.client) {
                                                Liquid.executeClientSide(liquid, "event response:"+event.name, httpResultJson.client, event.params, event.isNative);
                                            }
                                        }
                                    }
                                    // reset error
                                    Liquid.setErrorDiv(liquid, null);
                                    if(Liquid.isSystemEvent(event)) { }
                                    if(event.name === 'onInserting') {
                                        if(httpResultJson) {
                                            if(httpResultJson.resultSet) {
                                                for(var ir = 0; ir < httpResultJson.resultSet.length; ir++) {
                                                    var fieldSet = httpResultJson.resultSet[ir];
                                                    var primaryKeyField = liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1";
                                                    liquid.addingRow[primaryKeyField] = fieldSet[primaryKeyField];
                                                    for(var prop in fieldSet) {
                                                        if(liquid.addingRow[prop] !== fieldSet[prop]) {
                                                            if(liquid.addingRow[prop] !== fieldSet[prop]) {
                                                                // Liquid.registerFieldChange(liquid, liquid.addingNode ? liquid.addingNode.__objectId : null, liquid.addingRow[primaryKeyField], prop, liquid.addingRow[prop], fieldSet[prop]);
                                                                liquid.addingRow[prop] = fieldSet[prop];
                                                            }
                                                        }
                                                    }
                                                }
                                            } else console.warn("WARNING : no fields value on event "+event.name+" on control "+liquid.controlId + " .. please check event "+event.servero);
                                        } else console.error("ERROR : invalid fields value on event "+event.name+" on control "+liquid.controlId + " .. please check event "+event.server);
                                    } else if(event.name === 'onPastedRow') {
                                        if(httpResultJson.tables) {
                                            var ids = [];
                                            for(var it=0; it<httpResultJson.tables.length; it++) {
                                                if(httpResultJson.tables[it].table === liquid.tableJson.table || httpResultJson.tables[it].table === liquid.tableJson.schema+"."+liquid.tableJson.table) {
                                                    if(httpResultJson.tables[it].error || httpResultJson.tables[it].fails) {
                                                        // paste faild so create modification
                                                        if(httpResultJson.tables[it].error) {
                                                            Liquid.setErrorDiv(liquid, httpResultJson.error);
                                                        }
                                                        
                                                        if(liquid.addingRow) {
                                                            liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                                                        }
                                                        
                                                        liquid.addingRow = null;
                                                        liquid.addingNode = null;
                                                        delete liquid.modifications;
                                                        liquid.modifications = null;

                                                        console.warn("WARNING: row paste failed at "+liquid.controlId+" key:"+liquid.addingRow[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ] );
                                                    } else {
                                                        // pasted ok
                                                        if(httpResultJson.tables[it].ids) {
                                                            for(var iid=0; iid< httpResultJson.tables[it].ids.length; iid++) {
                                                                ids.push(httpResultJson.tables[it].ids[iid]);
                                                                var primaryKeyField = liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1";
                                                                liquid.addingNode.data[primaryKeyField] = String(httpResultJson.tables[it].ids[iid]);
                                                                liquid.nRows++;
                                                                liquid.nPages = liquid.gridOptions.paginationPageSize > 0 ? Number(Math.ceil(liquid.nRows / liquid.gridOptions.paginationPageSize)) : 1;
                                                                if(liquid.navObj) {
                                                                    Liquid.updateStatusBar(liquid);
                                                                }
                                                            }
                                                        }
                                                        liquid.addingRow = null;
                                                        liquid.addingNode = null;
                                                        delete liquid.modifications;
                                                        liquid.modifications = null;                                                        
                                                    }
                                                }
                                            }
                                            if(ids) {
                                                if(ids.length) {
                                                    Liquid.loadData(liquid, ids);
                                                }
                                            }
                                        }
                                    }
                                    if(httpResultJson) {
                                        if(httpResultJson.error) {
                                            console.error("[SERVER] ERROR:" + atob(httpResultJson.error) + " on event "+event.name+" on control "+liquid.controlId);
                                            Liquid.setErrorDiv(liquid, httpResultJson.error);
                                        }
                                    }
                                } catch (e) {
                                    console.error(event.xhr.responseText);
                                    console.error("onEventProcess() . error in response process:" + e  + " on event "+event.name+" on control "+liquid.controlId);
                                }
                            } else {
                                console.error("onEventProcess() . wrong response:" + event.xhr.status);
                            }
                            // excuting callback
                            if(callback) {
                                retVal = callback(callbackParams, httpResultJson);
                            }
                            if(Liquid.isSystemEvent(event)) {
                                if(liquid.currentCommand) {
                                    if(liquid.currentCommand.step === Liquid.CMD_WAIT_FOR_ENABLE) {
                                        liquid.currentCommand.step = Liquid.CMD_ENABLED;
                                        Liquid.onButton(obj, liquid.currentCommand);
                                    }
                                }
                            }
                        }
                    };
                    var params = (event.params ? JSON.parse(JSON.stringify(event.params)) : [] );
                    if(eventData) params.push( { data: eventData } );
                    event.xhr.send("{\"params\":" + JSON.stringify(params) + "}");
                    if(event.sync === true) {
                        onreadystatechange();
                    } else {
                        event.xhr.onreadystatechange = onreadystatechange;
                    }
                    
                } else {
                    alert("Server busy on event " + eventName);
                }
                retVal = true;
            }
            
            return retVal !== null ? retVal : defaultRetval;
        }
        return defaultRetval;
    },
    /**
     * Eexecute a command
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {commandName} the name of the command to execute
     * @return {} n/d
     */
    onCommand:function(obj, commandName) { // aux entry
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.gridOptions.api.stopEditing();
            if(liquid.tableJson) {
                if(liquid.tableJson.commands) {
                    for(var icmd = 0; icmd < liquid.tableJson.commands.length; icmd++) {
                        var command = liquid.tableJson.commands[icmd];
                        if(commandName === command.name) {
                            command.step = Liquid.CMD_EXECUTE;
                            var eventName = "before" + commandName;
                            var eventData = null;
                            var defaultRetval = null;
                            var bAlwaysCallback = true;
                            var liquidCommandParams = Liquid.buildCommandParams(liquid, command);
                            eventName = eventName.toCamelCase();
                            Liquid.onEvent(obj, eventName, eventData, Liquid.onCommandStart, liquidCommandParams, defaultRetval, bAlwaysCallback);
                            command.step = 0;
                        }
                    }
                }
            }
        }
    },
    onCommandStart:function(liquidCommandParams) {
        var liquid = liquidCommandParams.liquid;
        var obj = liquidCommandParams.obj;
        var command = liquidCommandParams.command;
        var params = liquidCommandParams.params;
        var retVal = true;
        
        if(command.server) {
            Liquid.registerOnUnloadPage();
            if(!liquid.xhr)
                liquid.xhr = new XMLHttpRequest();
            if(Liquid.wait_for_xhr_ready(liquid, "command "+(command ? command.name : "?"))) {
                try {
                    Liquid.startWaiting(liquid);
                    if(command.client) {
                        if(command.clientAfter !== true || command.clientBefore === true) {
                            Liquid.executeClientSide(liquid, "command:"+command.name, command.client, liquidCommandParams, command.isNative);
                        }
                    }
                    
                    // Informazioni sul comando
                    var commandData = { name:command.name,  server:command.server, clientAfter:command.clientAfter, 
                                        img:command.img, size:command.size, text:command.text, labels:command.labels, isNative:command.isNative
                                        };
                    var clientData = JSON.stringify(commandData);                            
        
                    liquid.xhr.open('POST', glLiquidServlet 
                            + '?operation=exec'
                            + '&className=' + encodeURI(command.server)
                            + '&clientData=' + encodeURI(clientData)
                            + '&controlId=' + (liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : ""))
                            + '&owner=' + (typeof liquid !== 'undefined' && liquid ? (typeof liquid.tableJson !== 'undefined' && liquid.tableJson ? liquid.tableJson.owner : "" ) : "")
                            );
                    
                    liquid.xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, command, "Command", e, command.onUploading, command.onUploadingParam); }, false);
                    liquid.xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, command, "Command", e, command.onDownloading, command.onDownloadingParam); }, false);
                    liquid.xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, command, "Command", e, command.onLoad, command.onLoadParam); }, false);
                    liquid.xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, command, "Command", e, command.onError, command.onErrorParam); }, false);
                    liquid.xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, command, "Command", e, command.onAbort, command.onAbortParam); }, false);
                    
                    liquid.xhr.onreadystatechange = function() {
                        if(liquid.xhr.readyState === 4) {
                            Liquid.release_xhr(liquid);
                            
                            if(liquid.xhr.status === 200) {
                                var httpResultJson = null;                                
                                try {
                                    // \b \f \n \r \t
                                    var responseText = liquid.xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
                                    responseText = Liquid.getXHRResponse(responseText);
                                    httpResultJson = JSON.parse(responseText);
                                    command.response = httpResultJson;
                                    if(httpResultJson) {
                                        if(httpResultJson.client) {
                                            Liquid.executeClientSide(liquid, "command response:"+command.name, httpResultJson.client, liquidCommandParams, command.isNative);
                                        }
                                        if(httpResultJson.error) {
                                            console.error("[SERVER] ERROR:" + atob(httpResultJson.error) + " on command "+command.name+" on control "+liquid.controlId);
                                            Liquid.setErrorDiv(liquid, httpResultJson.error);
                                        }
                                        if(httpResultJson.warning) {
                                            console.warn("[SERVER] WARNING:" + atob(httpResultJson.warning) + " on command "+command.name+" on control "+liquid.controlId);
                                            // Liquid.setErrorDiv(liquid, httpResultJson.warning);
                                        }
                                        if(httpResultJson.message) {
                                            console.log("[SERVER] MESSAGE:" + atob(httpResultJson.message) + " on command "+command.name+" on control "+liquid.controlId);
                                            // Liquid.setErrorDiv(liquid, httpResultJson.error);
                                        }
                                        if(httpResultJson.detail && httpResultJson.detail.error) {
                                            console.error("[SERVER] ERROR:" + atob(httpResultJson.detail.error));
                                            Liquid.setErrorDiv(liquid, httpResultJson.detail.error);
                                        }
                                        if(httpResultJson.detail) {
                                            if(httpResultJson.detail.tables) {
                                                for(var it=0; it<httpResultJson.detail.tables.length; it++) {
                                                }
                                            }
                                            if(httpResultJson.detail.foreignTables) {
                                                for(var it=0; it<httpResultJson.detail.foreignTables.length; it++) {
                                                }
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error(liquid.xhr.responseText);
                                    console.error("onCommandStart() . error in response process:" + e);
                                }                                
                                if(command.client) {
                                    if(command.clientAfter === true || command.clientBefore === false) {
                                        Liquid.executeClientSide(liquid, "command:"+command.name, command.client, liquidCommandParams, command.isNative);
                                    }
                                }                                
                            } else if(liquid.xhr.status === 404) {
                                alert("Servlet Url is wrong : \""+glLiquidServlet+"\" was not found\n\nPlease set the variable \"glLiquidRoot\" to a correct value...\n\nShould be : glLiquidRoot=<YourAppURL>");
                                console.error("onCommandStart() . wrong servlet url:" + glLiquidServlet);
                            } else {
                                console.error("onCommandStart() . wrong response:" + liquid.xhr.status);
                            }
                            Liquid.release_xhr(liquid);
                            liquid.xhr = null;
                            Liquid.stopWaiting(liquid);
                            retVal = Liquid.onCommandDone(liquidCommandParams);
                        }
                    };
                    
                    liquid.xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                    
                } catch (e) {
                    console.error(e);
                }
            } else {
                alert("!!! " + liquid.controlId+" is till waiting for last operaion:"+liquid.xhrDescription+ " !!!");
            }
        } else {
            // system command or no server actions, simulate response
            command.response = { detail:{} };
            if(command.client) {
                retVal = Liquid.executeClientSide(liquid, "command:"+command.name, command.client, liquidCommandParams, command.isNative);
            }
            if(command.name === "insert") {
                Liquid.addRow(liquid);
                Liquid.onPreparedRow(liquid, true);
            } else if(command.name === "delete") {
                // no prepare operations here
            }
            Liquid.onCommandDone(liquidCommandParams);
        }
        return retVal;
    },
    onCommandDone:function(liquidCommandParams) {
        var liquid = liquidCommandParams.liquid;
        var ids = null;
        var obj = liquidCommandParams.obj;
        var command = liquidCommandParams.command;
        var params = liquidCommandParams.params;
        if(command.name) {
            var eventName = "after" + command.name + "";
            try {
                eventName = eventName.toCamelCase();
                Liquid.onEvent(obj, eventName, null, null);
            } catch (e) {
                console.error(e);
            }
        }        
        var isSystem = false;
        if(isDef(liquid)) {
            if(isDef(liquid.tableJson)) {
                if(isDef(liquid.tableJson.isSystem)) {
                    isSystem = liquid.tableJson.isSystem;
                }
            }
        }
        if(!isSystem) {
            if(Liquid.isNativeCommand(command)) {
                if(liquid) {
                    var needFullUpdate = false;
                    if(liquid.modifications) { // reload rows
                        if(command.response) {
                            if(command.response.detail) {
                                if(command.response.detail.foreignTables) {
                                    if(command.response.detail.foreignTables.length > 0) {
                                        needFullUpdate = true;
                                    }
                                }
                            }
                        }
                        if(needFullUpdate) {
                        } else {
                            ids = [];
                            // Process result ids to read from server
                            Liquid.process_ids_to_reload(liquid, command, ids);
                            // check if is modification of adding node
                            for(var im = 0; im < liquid.modifications.length; im++) {
                                var modification = liquid.modifications[im];
                                if(modification) {
                                    if(modification.rowId) {
                                        if(ids.indexOf(modification.rowId) < 0) {
                                            if(liquid.addingNode) {
                                                if(liquid.addingNode.__objectId === modification.nodeId) {
                                                    if(ids) {
                                                        if(ids.length) {
                                                            var primaryKeyField = liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1";
                                                            liquid.addingNode.data[primaryKeyField] = (typeof ids[0] === 'number' ? ids[0].toString() : ids[0]);
                                                        }
                                                    }
                                                    liquid.addingNode = null;
                                                    liquid.addingRow = null;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if(typeof liquid.tableJson.isSystem === 'undefined' || !liquid.tableJson.isSystem) {
                            // Not system table
                            if(command.name === "delete") {
                                // remove node
                                if(command.response.detail)
                                    Liquid.onDeletedRow(liquid);
                            } else {
                                if(command.name === "insert") {
                                    // remove nore if add rec ord failed
                                    if(ids === null || ids.length === 0) {
                                        var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                                        console.warn(res);
                                    } else { 
                                        // Increase nRows manually
                                        liquid.nRows++;
                                    }
                                }
                                // Process result ids to read from server
                                Liquid.loadData(liquid, ids);
                            }                    
                        } else {
                            // system control : recordset is at runtime
                        }
                        delete liquid.modifications;
                        liquid.modifications = null;
                    }
                }
                if(command.name === "insert") { liquid.addingNode = null; liquid.addingRow = null; }
                if(command.name === "delete") { liquid.deletingNodes = null; }
            } else {
                // Custom command
                // Process result ids to read from server
                if(command.response) {
                    if(command.response.detail) {
                        // Process result ids to read from server
                        var ids = [];
                        Liquid.process_ids_to_reload(liquid, command, ids);
                        if(ids.length) {
                            Liquid.loadData(liquid, ids);
                        }
                    }
                }
            }
        } else {
            // system control : recordset is at runtime
            if(command.name === "delete") {
                if(command.response.detail)
                    Liquid.onDeletedRow(liquid);
            } else {
                if(command.name === "insert") {
                    if(ids === null || ids.length === 0) {
                        var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                        console.warn(res);
                    }
                }
            }
        }
    },
    /**
     * Enable a command
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {commandName} the name of the command
     * @return {} n/d
     */
    enableCommand:function(obj, commandName) {
        Liquid.onCommandModify(obj, commandName, true, true);
    },
    /**
     * Disable a command
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {commandName} the name of the command
     * @return {} n/d
     */
    disableCommand:function(obj, commandName) {
        Liquid.onCommandModify(obj, commandName, false, true);
    },
    /**
     * Show a command
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {commandName} the name of the command
     * @return {} n/d
     */
    showCommand:function(obj, commandName) {
        Liquid.onCommandModify(obj, commandName, 'undefined', false);
    },
    /**
     * Hide a command
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {commandName} the name of the command
     * @return {} n/d
     */
    hideCommand:function(obj, commandName) {
        Liquid.onCommandModify(obj, commandName, 'undefined', true);
    },
    onCommandModify:function(obj, commandName, bEnable, bShow) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            try {
                for(var icmd=0; icmd<liquid.tableJson.commands.length; icmd++) {
                    var cmd = liquid.tableJson.commands[icmd];
                    if(cmd.name === commandName) {
                        if(cmd.linkedObj) {
                            if(bEnable === true) {
                                cmd.linkedObj.classList.remove("liquidCommandDisabled");
                            } else if(bEnable === false) {
                                cmd.linkedObj.classList.add("liquidCommandDisabled");
                            }
                            if(bShow === true) {
                                cmd.linkedObj.style.visibility = '';
                                cmd.linkedObj.style.display = '';
                            } else if(bShow === false) {
                                cmd.linkedObj.style.visibility = '';
                                cmd.linkedObj.style.display = 'none';
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    },
    process_ids_to_reload:function(obj, command, ids) {
        try {
            var liquid = Liquid.getLiquid(obj);
            if(liquid) {
                if(command) {
                    if(command.response) {
                        var details = null;
                        if(command.response.detail instanceof Array) {
                            details = command.response.detail;
                        } else {
                            details = [ command.response.detail ];
                        }
                        for (var i=0; i<details.length; i++) {
                            var detail = details[i];
                            if(detail) {
                                if(detail.tables) {
                                    for(var it=0; it<detail.tables.length; it++) {
                                        if(detail.tables[it].table === liquid.tableJson.table || detail.tables[it].table === liquid.tableJson.schema+"."+liquid.tableJson.table) {
                                            if(detail.tables[it].ids) {
                                                for(var iid=0; iid< detail.tables[it].ids.length; iid++) {
                                                    ids.push(detail.tables[it].ids[iid]);
                                                    /*
                                                    if(command.name === "insert") {
                                                        liquid.addingNode.data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"] = String(detail.tables[it].ids[iid]);
                                                    }
                                                    */
                                                }
                                            }
                                            if(detail.tables[it].error) {
                                                console.error("[SERVER] ERROR on table:" + detail.tables[it].table + " error:"+atob(detail.tables[it].error));
                                                Liquid.setErrorDiv(liquid, detail.tables[it].error);
                                            }
                                        }
                                    }
                                }
                                if(detail.foreignTables) {
                                    for(var it=0; it<detail.foreignTables.length; it++) {
                                        if(detail.foreignTables[it].error) {
                                            console.error("[SERVER] ERROR: on table " + detail.foreignTables[it] + " : " + atob(detail.foreignTables[it].error));
                                            Liquid.setErrorDiv(liquid, detail.foreignTables[it].error);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch(e) {
            console.error("process_ids_to_reload() error :"+e);
        }
    },
    onValidateFields:function(obj, command) { // validate fields for insert
        var liquid = Liquid.getLiquid(obj);
        var retVal = true;
        if(liquid) {
            if(command) {
                if(command.name === "insert") {
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                        liquid.tableJson.columns[ic].isChecked = false;
                        liquid.tableJson.columns[ic].isValidated = false;
                    }
                    if(liquid.tableJson.grids) {
                        for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                            var grid = liquid.tableJson.grids[ig];
                            for(var i=0; i<grid.columns.length; i++) {
                                var obj = document.getElementById(grid.columns[i].linkedContainerId);
                                var col = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B - 1] : null;
                                if(col)
                                    col.isChecked = true;
                                if((typeof grid.columns[i].required !== 'undefined' && grid.columns[i].required)
                                        || (typeof col !== 'undefined' && col.required)) {
                                    if(obj) {
                                        obj.style.borderColor = "";
                                        if(obj.value === null || obj.value === '') {
                                            obj.style.borderColor = "red";
                                            col.isValidated = false;
                                            retVal = false;
                                        } else {
                                            col.isValidated = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    var msg = "";
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                        if(liquid.tableJson.columns[ic].required) {
                            if(!liquid.tableJson.columns[ic].isChecked) {                                
                                var addingValue = liquid.addingRow[liquid.tableJson.columns[ic].field];
                                if(!addingValue || addingValue === '')
                                    msg += liquid.tableJson.columns[ic].name + " is required but not visible\n";
                            } else {
                                if(!liquid.tableJson.columns[ic].isValidated) {
                                    var addingValue = liquid.addingRow[liquid.tableJson.columns[ic].field];
                                    if(!addingValue || addingValue === '')
                                        msg += liquid.tableJson.columns[ic].name + " is required\n";
                                }
                            }
                        }
                        var validateResult = Liquid.validateField(liquid, liquid.tableJson.columns[ic], liquid.addingRow[liquid.tableJson.columns[ic].field]);
                        if(validateResult !== null) {
                            if(validateResult[0] >= 0) {
                                // ok                                
                            } else {
                                // ko
                                msg += liquid.tableJson.columns[ic].name + " is invalid\n";
                            }
                        } else {
                            // fails
                            msg += liquid.tableJson.columns[ic].name + " verification failed\n";
                        }
                    }
                    if(msg) {
                        retVal = false;
                        alert(msg);
                    }
                }
            }
        }
        return retVal;
    },
    isSystemEvent:function(event) {
        return (event.isSystem);
    },
    isNativeCommand:function(command) {
        return (command.isNative || command.name === "rollback" || command.name === "update-rollback" || command.name === "insert-rollback" || command.name === "delete-rollback");
    },
    isRollbackCommand:function(command) {
        return (command.name === "insert-rollback" || command.name === "update-rollback" || command.name === "delete-rollback");
    },
    clientSideCallbackTest:function(liquid, params) {
        var paramDesc = "";
        try { paramDesc = JSON.stringify(params); } catch (e) {}
        console.log("clientSideCallbackTest() : " + liquid.controlId + " params:" + (typeof params !== 'undefined' ? paramDesc : "[N/D]"));
    },
    onClick:function(e) {
        var focusedLiquid = null;
        for(var i=0; i<glLiquids.length; i++) {
            if(glLiquids[i] instanceof LiquidCtrl) {
                if(glLiquids[i].mode === 'lookup') {
                    if(glLiquids[i].status === 'open') {
                        if((glLiquids[i].popupCaptionObj && glLiquids[i].popupCaptionObj.contains(e.target))
                        || (glLiquids[i].lookupObj && glLiquids[i].lookupObj.contains(e.target))
                        || (glLiquids[i].filtersObj && glLiquids[i].filtersObj.contains(e.target))
                        || (glLiquids[i].navObj && glLiquids[i].navObj.contains(e.target))
                        || (glLiquids[i].aggridContainerObj && glLiquids[i].aggridContainerObj.contains(e.target))
                        || (glLiquids[i].lookupContainerObj && glLiquids[i].lookupContainerObj.contains(e.target))
                        ) {
                        } else {
                            Liquid.onCloseLookup(glLiquids[i].controlId);
                        }
                    }
                }
                if(glLiquids[i].outDivObj && glLiquids[i].outDivObj.contains(e.target)) {
                    focusedLiquid = glLiquids[i];
                    while(focusedLiquid.srcLiquid) focusedLiquid = focusedLiquid.srcLiquid;
                }
            } else if(glLiquids[i] instanceof LiquidMenuXCtrl) {
                var liquid = glLiquids[i];
                Liquid.closeAllPopupMenuCommand(liquid, e);
            }            
        }
        if(glNavigations) {
            for(var i=0; i<glNavigations.length; i++) {
                if(glNavigations[i]) {
                    var obj = document.getElementById(glNavigations[i]);
                    if(obj) {
                        if(obj.contains(e.target)) return;
                        for(var j=0; j<obj.childNodes.length; j++) {
                            if(obj.childNodes[j].contains(e.target)) return;
                        }
                    }
                }
            }
        }
        if(focusedLiquid) {
            if(focusedLiquid.status !== "closed") {
                setTimeout( function() { 
                    Liquid.setFocus(focusedLiquid); 
                }, 50);
            }
        }
        e.stopPropagation();
    },
    appendActions:function(liquid, cmdName, server, client) {
        if(liquid) {
            for(var i=0; i<liquid.tableJson.actions.length; i++) {
                if(liquid.tableJson.actions[i].name === cmdName) {
                    if(server) {                        
                        if(liquid.tableJson.actions[i].server instanceof Array) {
                            for(var c=0; c<liquid.tableJson.actions[i].server.length; c++)
                                if(liquid.tableJson.actions[i].server[c] === server)
                                    return;
                            liquid.tableJson.actions[i].server.push(server);                            
                        } else if(typeof liquid.tableJson.actions[i].server === "string") {
                            liquid.tableJson.actions[i].server = [ liquid.tableJson.actions[i].server, server ];
                        }
                    }
                    if(client) {                        
                        if(liquid.tableJson.actions[i].client instanceof Array) {
                            for(var c=0; c<liquid.tableJson.actions[i].client.length; c++)
                                if(liquid.tableJson.actions[i].client[c] === client)
                                    return;
                            liquid.tableJson.actions[i].client.push(client);                                    
                        } else if(typeof liquid.tableJson.actions[i].client === "string") {
                            if(liquid.tableJson.actions[i].client !== client)
                                liquid.tableJson.actions[i].client = [ liquid.tableJson.actions[i].client, client ];
                        }
                    }
                }
            }
        }
    },
    executeClientSide:function(liquid, sourceDesciption, client, liquidCommandParams, isNative) {
        var retVal = null;
        if(liquid) {
            if(client) {
                try {
                    var clients = null;
                    var retVal = null;
                    if(client instanceof Array) {
                        clients = client;
                    } else {
                        clients = [ client ];
                    }
                    for(var i=0; i<clients.length; i++) {
                        if(clients[i]) {
                            var clientFunc = Liquid.getProperty(clients[i]);
                            try {
                                if(clientFunc && typeof clientFunc === "function") {
                                    retVal = clientFunc(liquid, liquidCommandParams);
                                } else if(typeof clients[i] === "string" && clients[i]) {
                                    try { retVal = eval(clients[i]); } catch(e) { if(isNative===true) {} else { console.error("ERROR: on control:"+liquid.controlId+" at "+sourceDesciption+"\nAn error occours in function:'" + clients[i]+"' ..\nError:"+e); } }
                                }
                            } catch(e) {
                                console.error("Error in Function :" + clients[i]+" error:"+e);
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
        return retVal;
    },
    setNodesSelected:function(obj, ids) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
            if(isDef(nodes) && nodes.length > 0) {
                for(var i=0; i<nodes.length; i++) {
                    var nodeId = nodes[i].data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"];
                    if(ids.indexOf(nodeId) >= 0) {
                        nodes[i].setSelected(true);
                    }
                }
            }
        }
    },
    setNodesSelectedDefault:function(obj) {
        var retVal = false;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            try {
                if(isDef(liquid.tableJson.autoSelect)) {
                    var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    if(isDef(nodes) && nodes.length > 0) {
                        retVal = true;
                        if(typeof liquid.tableJson.autoSelect === 'string' && liquid.tableJson.autoSelect.toLowerCase() === 'last')
                            nodes[nodes.length - 1].setSelected(true);
                        else if(typeof liquid.tableJson.autoSelect === 'string' && liquid.tableJson.autoSelect.toLowerCase() === 'first')
                            nodes[0].setSelected(true);
                        else if(liquid.tableJson.autoSelect === true)
                            nodes[0].setSelected(true);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        return retVal;
    },
    /**
     * Get the current selecter row
     * @param {liquid} the control id or the class instance (LiquidCtrl)
     * @return [ including list, excluding list ] array
     */
    getSelectedPrimaryKeys:function(liquid) {
        if(liquid) {
            var idsSelected = "";
            var idsUnselected = "";
            if(liquid.selection.all) {
                // exclude list
                idsSelected = "\"*\"";
                for(var i=0; i<liquid.selection.exclude.length; i++) {
                    if(idsUnselected.length > 0) idsUnselected += ",";
                    var value = liquid.selection.exclude[i];
                    if(typeof value === 'string') idsUnselected += '"' + value + '"'; else idsUnselected += value;
                }
            } else {
                // include list
                for(var i=0; i<liquid.selection.include.length; i++) {
                    if(idsSelected.length > 0) idsSelected += ",";
                    var value = liquid.selection.include[i];
                    if(typeof value === 'string') idsSelected += '"' + value + '"'; else idsSelected += value;
                }
            }
        }
        return [ idsSelected, idsUnselected ];
    },
    serializedRow:function(liquid, bOnlySelected) {
        if(liquid) {
            var dataList = [];
            var selNodes = null;
            if(bOnlySelected) {
                selNodes = liquid.gridOptions.api.getSelectedNodes();
            } else {
                selNodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
            }
            for(var i=0; i<selNodes.length; i++) {
                if(selNodes[i].data)
                    dataList.push(selNodes[i].data);
            }
            return JSON.stringify(dataList);
        }
        return "";
    },    
    /**
     * Set the control as current (focused)
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @return n/d
     */
    setFocus:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.status === "closed") return;
        if(liquid !== glLastFocusedLiquid) {
            var isChild = false;
            if(liquid && glLastFocusedLiquid) {
                var parentNode = liquid.outDivObj;
                while ((parentNode = parentNode.parentNode)) {
                    if(parentNode.id) {
                        if(parentNode.id === glLastFocusedLiquid.controlId) {
                            isChild = true;
                            break;
                        }
                    }
                }
            }
            if(!isChild)
                if(glLastFocusedLiquid) {
                    glLastFocusedLiquid.outDivObj.style.zIndex = glLastFocusedLiquid.tableJson.zIndex ? glLastFocusedLiquid.tableJson.zIndex : (glLastFocusedLiquid.zIndex ? glLastFocusedLiquid.zIndex : 130);
                    if(glLastFocusedLiquid.popupCaptionObj)
                        glLastFocusedLiquid.popupCaptionObj.classList.add("liquidPopupCaptionUnselected");
                }
            if(liquid) {
                liquid.outDivObj.style.zIndex = liquid.focusedZIndex;
                if(liquid.outDivObj)
                    liquid.outDivObj.style.display = "";
                if(liquid.obscuringObj)
                    liquid.obscuringObj.style.display = "";
            }
            glLastFocusedLiquid = liquid;
            if(glLastFocusedLiquid)
                if(glLastFocusedLiquid.popupCaptionObj)
                    glLastFocusedLiquid.popupCaptionObj.classList.remove("liquidPopupCaptionUnselected");
        }
    },
    /**
     * Set the control's parent
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {parentObjId} the html element id
     * @return n/d
     */
    setParent:function(obj, parentObjId) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(parentObjId) {
                Liquid.parentObj = liquid.parentObj = document.getElementById(parentObjId);
                if(liquid.parentObj) {
                    if(liquid.parentObj) {
                        if(liquid.parentObjId !== parentObjId) {
                            liquid.parentObjId = parentObjId;
                            liquid.parentObj.appendChild(liquid.outDivObj);
                            var top = liquid.outDivObj.offsetTop;
                            var left = liquid.outDivObj.offsetLeft;
                            var wh = liquid.outDivObj.offsetWidth;
                            var ht = liquid.outDivObj.offsetHeight;
                            var gapW = !liquid.isIconic && !liquid.isMaximized ? left:0;
                            var gapH = !liquid.isIconic && !liquid.isMaximized ? top:0;
                            liquid.outDivObj.style.position = "absolute";
                            liquid.outDivObj.style.top = top+"px";
                            liquid.outDivObj.style.left = left+"px";
                            liquid.outDivObj.style.width = (wh-gapW*2.0)+"px";
                            liquid.outDivObj.style.height = (ht-gapH*2.0)+"px";
                        }
                        liquid.parentObjStatus = Liquid.createStatusDiv(liquid.parentObj, parentObjId);
                    }
                    liquid.parentObj.style.overflow = "auto";
                    liquid.parentObj.className = "liquidWinXContainer";                    
                    liquid.parentObj.ondrop = function(event) { Liquid.onDrop(event); };
                    liquid.parentObj.ondragover = function(event) { Liquid.onAllowDrop(event); };
                    
                    if(liquid.parentObj.style.position !== 'relative' && liquid.parentObj.style.position !== 'absolute')
                        liquid.parentObj.style.position = 'relative';

    
                    if(glLiquidContainers.indexOf(parentObjId) < 0) {
                        var resizeObserver = new ResizeObserver(entries => { Liquid.onParentResize(entries); });
                        resizeObserver.observe(liquid.parentObj);
                        glLiquidContainers.push(parentObjId);
                        glLiquidContainersObserver.push(resizeObserver);
                    }
                } else {
                    console.error("ERROR : Parent HTML element not found:" + liquid.parentObjId+" on control:"+liquid.controlId);
                }
            } else {
                liquid.parentObjId = null;
                liquid.parentObj = null;
            }
        }
    },
    restoreGrids:function(liquid) {
        if(isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) {
            for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                Liquid.onGridMode(liquid.tableJson.grids[ig].gridTabObj, "readonly");
            }
        }
    },
    restoreLayouts:function(liquid) {
        if(isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
            for(var ig = 0; ig < liquid.tableJson.layouts.length; ig++) {
                Liquid.onLayoutMode(liquid.tableJson.layouts[ig].layoutTabObj, "readonly");
            }
        }
    },
    restoreCommands:function(liquid) {
        liquid.gridOptions.suppressRowClickSelection = liquid.lastSuppressRowClickSelection;
        liquid.currentCommand = null;
        if(liquid.tableJson.commands) {
            for(var icmd = 0; icmd < liquid.tableJson.commands.length; icmd++) {
                var cmd = liquid.tableJson.commands[icmd];
                if(cmd.linkedObj) {
                    cmd.linkedObj.classList.remove("liquidCommandDisabled");
                }
            }
        }
    },
    onButtonFromString:function(obj, commandJsonString) {
        if(commandJsonString) {
            try {
                Liquid.onButton(obj, JSON.parse(commandJsonString));
            } catch(e) {
                console.error("ERROR: onButtonFromString() : "+ e);
            }
        }
    },
    onButton:function(obj, command) {
        if(command) {
            if((command.confirm ? confirm(command.confirm) : true)) {
                var liquid = Liquid.getLiquid(obj);
                
                if(typeof command.step === 'undefined')
                    command.step = 0;
                
                if(Liquid.isNativeCommand(command)) {
                    if(command.name === "update" || command.name === "delete") {
                        var selNodes = Liquid.getCurNodes(liquid);
                        if(!selNodes || selNodes.length === 0) {
                            var msg = Liquid.lang === 'eng' ? ("No items selected") : ("Nessuna riga selezionata" );
                            Liquid.showToast("LIQUID", msg, "warning");
                            return;
                        }
                    }
                    if(command.name === "insert" || command.name === "update" || command.name === "delete") {
                        if(command.step===0) {
                            liquid.lastSuppressRowClickSelection = liquid.gridOptions.suppressRowClickSelection;
                            liquid.gridOptions.suppressRowClickSelection = true;
                        }
                    }
                    var gotoGridIndex = null, gotoLayoutIndex = null;
                    if(liquid.lastGridTabObj) {
                        var nameItems = liquid.lastGridTabObj.id.split(".");
                        if(nameItems.length > 2) {
                            if(nameItems[1] === 'grid_tab') {
                                gotoGridIndex = nameItems[2] - 1;
                            } else if(nameItems[1] === 'layout_tab') {
                                gotoLayoutIndex = nameItems[2] - 1;
                            } else {
                                gotoGridIndex = 0;
                            }
                        }
                    }
                    if(command.name === "insert-rollback") {
                        if(liquid.addingNode) {
                            var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                            console.warn(res);
                            liquid.addingNode = null;
                            if(isDef(liquid.nodesBeforeAdding)) {
                                for(var i=0; i<liquid.nodesBeforeAdding.length; i++) {
                                    liquid.nodesBeforeAdding[i].setSelected(true);
                                }
                                setTimeout(function() { liquid.gridOptions.api.ensureIndexVisible(liquid.cRowBeforeAdding, "top"); liquid.cRowBeforeAdding = null; }, 250 );
                                liquid.nodesBeforeAdding = null;
                            }
                        }
                        command.step = Liquid.CMD_EXECUTE;
                    } else if(command.name === "next" || command.name === "previous") {
                        command.step = 0;
                        var selNodes = liquid.gridOptions.api.getSelectedNodes();
                        var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                        if(selNodes && selNodes.length > 0) {
                            if(typeof liquid.tableJson.resetSelectionOnRowChange === true) {
                                if(liquid.gridOptions.rowSelection === "multiple") 
                                    for(var i=0; i<selNodes.length; i++) selNodes[i].setSelected(false);
                            } else {
                                if(liquid.gridOptions.rowSelection === 'single') {
                                    for(var i=0; i<selNodes.length; i++) selNodes[i].setSelected(false);
                                } else if(typeof liquid.tableJson.rowMultiSelectWithClick !== true) {
                                    for(var i=0; i<selNodes.length; i++) selNodes[i].setSelected(false);
                                }                                
                            }
                        }
                        if(nodes) {
                            var cRow = liquid.cRow; //selNodes[0].rowIndex
                            if(command.name === "previous") {
                                if(cRow > 0) cRow--; else cRow = nodes.length-1;
                            } else if(command.name === "next") {
                                if(cRow+1 < nodes.length) cRow++; else cRow = 0;
                            }
                            if(typeof liquid.tableJson.resetSelectionOnRowChange === true) {
                                nodes[cRow].setSelected(true);
                            } else {
                                if(liquid.gridOptions.rowSelection === 'single') {
                                    nodes[cRow].setSelected(true);
                                } else if(typeof liquid.tableJson.rowMultiSelectWithClick !== true) {
                                    nodes[cRow].setSelected(true);
                                } else {
                                    // no selection
                                }
                            }
                            liquid.enableOverscroll = false;
                            liquid.gridOptions.api.setFocusedCell(cRow, 'start', 'top');
                            liquid.gridOptions.api.ensureIndexVisible(cRow, "top");
                            liquid.cRow = cRow;
                            Liquid.updateStatusBar(liquid);
                        }
                        Liquid.executeClientSide(liquid, "command:"+command.name, command.client, null, command.isNative);
                        return;
                    } else if(command.name === "copy") {
                        Liquid.copyToClipBorad(liquid);
                        Liquid.executeClientSide(liquid, "command:"+command.name,command.client, null, command.isNative);
                        return;
                    } else if(command.name === "paste") {
                        Liquid.pasteFromClipBorad(liquid);
                        Liquid.executeClientSide(liquid, "command:"+command.name,command.client, null, command.isNative);
                        return;
                    }
                    if(command.step === 0) { // prepare
                        command.lastGridIndex = gotoGridIndex;
                        if(command.linkedLabelObj)
                            if(isDef(command.labels))
                                if(command.labels.length >= 1)
                                    command.linkedLabelObj.innerHTML = command.labels[0];
                        if(isDef(command.rollbackObj))
                            command.rollbackObj.style.display = '';
                        command.step = Liquid.CMD_WAIT_FOR_ENABLE;

                        liquid.currentCommand = command;

                        if(liquid.tableJson.commands) {
                            for(var icmd = 0; icmd < liquid.tableJson.commands.length; icmd++) {
                                var cmd = liquid.tableJson.commands[icmd];
                                if(cmd.name !== command.name && (!cmd.linkedCmd || (cmd.linkedCmd && cmd.name !== cmd.linkedCmd.name))) {
                                    if(cmd.linkedObj) {
                                        cmd.linkedObj.classList.add("liquidCommandDisabled");
                                    }
                                }
                            }
                        }
                        var defaultValue = "noEventDef";
                        var bAlwaysCallback = false;
                        var bContinue = false;
                        if(command.name === "insert") {
                            Liquid.addRow(obj, command);
                            var result = Liquid.onEvent(obj, "onInserting", liquid.addingRow, Liquid.onPreparedRow, liquid, defaultValue, bAlwaysCallback);
                            if(result.systemResult === defaultValue) {
                                liquid.currentCommand.step = Liquid.CMD_ENABLED;
                                bContinue = true;
                            }
                        } else if(command.name === "update") {
                            var result = Liquid.onEvent(obj, "onUpdating", null, null, null, defaultValue, bAlwaysCallback);
                            if(result.Result === defaultValue || result.systemResult === true) {
                                liquid.currentCommand.step = Liquid.CMD_ENABLED;
                                bContinue = true;
                            }
                        } else if(command.name === "delete") {
                            var selNodes = Liquid.getCurNodes(liquid);
                            if(selNodes) {
                                liquid.deletingNodes = selNodes;
                                var dataList = [];
                                for(var ir = 0; ir < liquid.deletingNodes.length; ir++) dataList.push(liquid.deletingNodes[ir].data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1"] );
                                var result = Liquid.onEvent(obj, "onDeleting", dataList, Liquid.onPreparedDelete, liquid, defaultValue, bAlwaysCallback);
                                if(result.systemResult === defaultValue) {
                                    liquid.currentCommand.step = Liquid.CMD_ENABLED;
                                    bContinue = true;
                                }
                            }
                        }
                        if(Liquid.isRollbackCommand(command))
                            command.step = Liquid.CMD_EXECUTE;
                        else
                        if(!bContinue)
                            return;
                    }

                    if(command.step === Liquid.CMD_WAIT_FOR_ENABLE) { 
                        // waiting for validations

                    } else if(command.step === Liquid.CMD_ENABLED) {
                        var mode = "write";
                        if(command.name === "delete")
                            mode = command.name;
                        if(!Liquid.isRollbackCommand(command)) {
                            command.curGridIndex = gotoGridIndex;
                            if(isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) {
                                if(gotoGridIndex < 0) gotoGridIndex = 0;
                                for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                                    Liquid.onGridMode(liquid.tableJson.grids[ig].gridTabObj, mode);
                                }
                                if(gotoGridIndex !== null) {
                                    if(gotoGridIndex>=0 && gotoGridIndex<liquid.tableJson.grids.length) {
                                        Liquid.onGridTab(liquid.tableJson.grids[gotoGridIndex].gridTabObj);
                                    }
                                }
                            }
                            command.curLayoutIndex = gotoLayoutIndex;
                            if(isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
                                if(gotoLayoutIndex < 0) gotoLayoutIndex = 0;
                                for(var ig = 0; ig < liquid.tableJson.layouts.length; ig++) {
                                    Liquid.onLayoutMode(liquid.tableJson.layouts[ig].layoutTabObj, mode);
                                }
                                if(gotoLayoutIndex !== null) {
                                    if(gotoLayoutIndex>=0 && gotoLayoutIndex<liquid.tableJson.layouts.length) {
                                        Liquid.onLayoutTab(liquid.tableJson.layouts[gotoLayoutIndex].layoutTabObj);
                                    }
                                }
                            }
                        }
                        command.step = Liquid.CMD_VALIDATE;

                    } else if(command.step === Liquid.CMD_VALIDATE) {
                        if(command.name === "insert") {
                            if(!Liquid.onValidateFields(liquid, command)) {
                                return;
                            }
                        }
                        if(isDef(command.onValidate)) {
                            var clientFunc = Liquid.getProperty(command.onValidate);
                            var result = null;
                            if(clientFunc)
                                result = clientFunc(liquid);
                            else
                                try {
                                    result = eval(command.onValidate);
                                } catch (e) {
                                    console.error("error in eval('" + command.onValidate + "')" + " : " + e);
                                }
                            if(result) {
                                command.step = Liquid.CMD_EXECUTE;
                                if(isDef(command.labels))
                                    if(command.labels.length >= 2)
                                        command.linkedLabelObj.innerHTML = command.labels[1];
                            } else {
                                command.step = 0;
                                return;
                            }
                        } else {
                            command.step = Liquid.CMD_EXECUTE;
                        }
                    }

                    if(command.step === Liquid.CMD_EXECUTE) {
                        if(command.linkedLabelObj)
                            command.linkedLabelObj.innerHTML = (typeof command.text !== "undefined" ? command.text : "");
                        if(command.lastGridIndex < 0) Liquid.onGridTab(liquid.listGridTabObj);
                        Liquid.restoreGrids(liquid);
                        Liquid.restoreLayouts(liquid);
                        Liquid.restoreCommands(liquid);
                        if(Liquid.isNativeCommand(command)) {
                            if(command.rollbackCommand)
                                if(command.rollbackCommand.linkedObj)
                                    command.rollbackCommand.linkedObj.style.display = 'none';
                        }
                    }
                    if(Liquid.isRollbackCommand(command)) {
                        command.step = 0;
                        if(command.linkedCmd) {
                            command.linkedCmd.step = 0;
                            if(command.linkedCmd.linkedLabelObj)
                                command.linkedCmd.linkedLabelObj.innerHTML = (typeof command.linkedCmd.text !== "undefined" ? command.linkedCmd.text : "");
                            Liquid.restoreGrids(liquid);
                            Liquid.restoreLayouts(liquid);
                            Liquid.refreshGrids(liquid);
                            Liquid.refreshLayouts(liquid);
                            if(command.linkedCmd.lastGridIndex < 0) Liquid.onGridTab(liquid.listGridTabObj);
                        }
                        Liquid.restoreCommands(liquid);
                        if(command.linkedObj)
                            command.linkedObj.style.display = 'none';
                        Liquid.onEvent(obj, "onRollback", liquid.addingRow);
                        
                        if(liquid.modifications) {
                            if(liquid.modifications.length>1) console.warn("WARNING: dischanging "+liquid.modifications.length+" modifications...");
                            delete liquid.modifications;
                            liquid.modifications = null;
                        }
                        return;
                    }
                } else {
                    command.step = Liquid.CMD_EXECUTE;
                }
                if(command.step === Liquid.CMD_EXECUTE) {
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command);
                    Liquid.onCommandStart(liquidCommandParams);
                    command.step = 0;
                }
            }
        }
    },
    getItemObj:function(column) {
        var itemObj = column.linkedObj;
        if(itemObj) {
            if(itemObj.dataset) {
                if(isDef(itemObj.dataset.linkedInputId))
                    itemObj = document.getElementById(itemObj.dataset.linkedInputId);
            }
            return itemObj;
        }
    },
    getItemObjFromHTMLElement:function(element) {
        var itemObj = element;
        if(itemObj) {
            if(itemObj.dataset) {
                if(isDef(itemObj.dataset.linkedInputId)) {
                    itemObj = document.getElementById(itemObj.dataset.linkedInputId);
            }
            }
            return itemObj;
        }
    },
    getItemResetObj:function(column) {
        var itemObj = column.linkedObj;
        if(itemObj) {
            if(itemObj.dataset) {
                if(isDef(itemObj.dataset.linkedInputId)) {
                    itemObj = document.getElementById(itemObj.dataset.linkedInputId+".reset");
            }
            }
            return itemObj;
        }
    },
    getField:function(obj, name) {
        var col = Liquid.getColumn(obj, name);
        if(col)
            return col.field;
        return null;
    },
    getColumn:function(obj, name) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid)
            if(liquid.tableJson)
                if(liquid.tableJson.columns) {
                    var fullName = liquid.tableJson.table + "." + name;
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++)
                        if(liquid.tableJson.columns[ic].name === name || liquid.tableJson.columns[ic].name === fullName)
                            return liquid.tableJson.columns[ic];
                        else if(liquid.tableJson.table + "." + liquid.tableJson.columns[ic].name === name)
                            return liquid.tableJson.columns[ic];
                        else if(liquid.tableJson.columns[ic].field === name)
                            return liquid.tableJson.columns[ic];
                    // Now insensitive case
                    name = name.toUpperCase();
                    fullName = fullName.toUpperCase();
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++)
                        if(liquid.tableJson.columns[ic].name.toUpperCase() === name || liquid.tableJson.columns[ic].name.toUpperCase() === fullName)
                            return liquid.tableJson.columns[ic];
                        else if(isDef(liquid.tableJson.table) && liquid.tableJson.table.toUpperCase() + "." + liquid.tableJson.columns[ic].name.toUpperCase() === name)
                            return liquid.tableJson.columns[ic];
                }

    },
    getFilterLabel:function(obj, filterCol) {
        if(filterCol) 
            if(isDef(filterCol.label)) {
                return filterCol.label;
            }
        var column = Liquid.getColumn(obj, filterCol.name);
        if(column) {
            if(isDef(column.label)) {
                return column.label;
            }
            var parts = column.name.split('.');
            return parts.length > 1 ? parts[parts.length-1]:column.name;
        }
        return "";
    },
    getColumnTooltip:function(liquid, col) {
        if(liquid) {
            var tooltipField = "";
            var dbField = "";
            if(liquid.tableJson.database) dbField += "Database: " + liquid.tableJson.database + "\n";
            if(liquid.tableJson.schema) dbField += "Schema: " + liquid.tableJson.schema + "\n";
            if(col) {
                if(col.name) {
                    var nameItems = col.name.split(".");
                    if(nameItems.length > 1) {
                        table = "Table: " + nameItems[0] + "\n";
                        field = "Schema: " + nameItems[1] + "\n";
                    } else {
                        table = "Table: " + liquid.tableJson.table + "\n";
                        field = "Field: " + col.name + "\n";
                    }
                } else {
                    table = liquid.tableJson.table + "\n";
                    field = "Field: " + "N/D" + "\n";
                }
                dbField += table;
                dbField += field;
                if(isDef(col.readonly)) {
                    field = "Readonly: " + col.readonly + "\n";
                }
                tooltipField += "DB coords:\n\n"+dbField + "";
                tooltipField += "\n\n";
                tooltipField += "Label: "+(col.label?col.label:"N/D") + "\n";
                tooltipField += "type: "+col.typeName + "\n";
                tooltipField += "size: "+(col.size?Liquid.bytesToSize(col.size):"N/D") + "\n";
                tooltipField += "digits: "+(col.digits?col.digits:"N/D") + "\n";
                tooltipField += "nullable: "+(col.nullable?col.nullable:"N/D") + "\n";
                tooltipField += "default: "+(col.default?col.default:"N/D") + "\n";
                tooltipField += "autoIncString: "+(col.autoIncString?col.autoIncString:"N/D") + "\n";
                tooltipField += "remarks: "+(col.remarks?col.remarks:"N/D") + "\n";
                tooltipField += "\n";
                tooltipField += "managed as: "+Liquid.getTypeName(col.type) + "(native type:"+col.type+")\n";
                return tooltipField;
            }
        }
        return "";
    },
    getProperty:function(propName) {
        var parts = propName.split('.'), obj = null;
        try {
            for(var i = 0, length = parts.length, obj = window; i < length; ++i) {
                obj = obj[parts[i]];
            }
            if(typeof obj === 'undefined') {
                for(var i = 0, length = parts.length, obj = Liquid; i < length; ++i) {
                    obj = obj[parts[i]];
                }
            }
        } catch (e) { }
        return obj;
    },
    getObjectProperty:function(baseObj, propName) {
        var parts = propName.split('.'), obj = null;
        try {
            for(var i = 0, length = parts.length, obj = baseObj; i < length; ++i) {
                obj = obj[parts[i]];
            }
        } catch (e) {
        }
        return obj;
    },
    solveSourceColumn:function(liquid, promiseSuccess, promiseFailure) {
        if(liquid) {
            if(liquid.srcColumn) {
                try {
                    liquid.srcColumnObj = Liquid.getColumn(liquid.srcLiquid, liquid.srcColumn);
                    if(liquid.srcColumnObj) {
                        liquid.srcColumnIndex = liquid.srcColumnObj ? liquid.srcColumnObj.field : -1;
                    } else {
                        if(liquid.srcLiquid) {
                            if(!liquid.srcLiquid.isAsyncResolve) { // Async
                                console.error("ERROR: column \""+liquid.srcColumn+"\" not found in "+liquid.srcLiquid.controlId+"");
                            } else {
                                if(promiseSuccess || promiseFailure) {
                                    if(liquid.promise) {
                                        liquid.promise.then(promiseSuccess, promiseFailure);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) { console.error(e); }
            }
        }
    },
    calScreePos:function(liquid) {
        var screeWidth = window.innerWidth;
        var screeHeight = window.innerHeight;
        if(liquid.tableJson.width > screeWidth)
            liquid.tableJson.width = screeWidth;
        if(liquid.tableJson.height > screeHeight)
            liquid.tableJson.height = screeHeight;
        var height = liquid.tableJson.height ? (Number(liquid.tableJson.height) > 0 ? Number(liquid.tableJson.height) : liquid.outDivObj.clientHeight) : liquid.outDivObj.clientHeight;
        var width = liquid.tableJson.height ? (Number(liquid.tableJson.height) > 0 ? Number(liquid.tableJson.height) : liquid.outDivObj.clientWidth) : liquid.outDivObj.clientWidth;
        liquid.tableJson.centerTop = (screeHeight - height) / 2;
        liquid.tableJson.centerLeft = (screeWidth - width) / 2;
    },
    onParentResize:function(e) {
        var obj = e.length > 0 ? e[0].target : null;
        for(var i=0; i<glLiquids.length; i++) {
            if(glLiquids[i].mode !== "lookup") {
                if(glLiquids[i].winXStatus === 'maximized') {
                    Liquid.onResize(glLiquids[i]);
                }
            }
        }
    },
    getPrecomputedWidth:function(obj) {
        if(obj) {
            if(obj.offsetWidth>0) return obj.offsetWidth; 
            if(obj.scrollWidth>0) return obj.scrollWidth+1;
            if(getComputedStyle(obj, null).display === 'none') return 0;
            return getComputedStyle(obj).width.replace(/[^0-9]/g,'');
        }
        return 0;
    },
    getPrecomputedHeight:function(obj) {
        if(obj) {
            if(obj.offsetHeight>0) return obj.offsetHeight; 
            if(obj.scrollHeight>0) return obj.scrollHeight+1;
            if(getComputedStyle(obj, null).display === 'none') return 0;
            return getComputedStyle(obj).height.replace(/[^0-9]/g,'');
        }
        return 0;
    },
    onResize:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid instanceof LiquidCtrl) {
                var referenceHeight = 0;
                
                if(liquid.mode !== "lookup") {
                    if(liquid.isIconic) {
                        if(liquid.winXStatus !== 'iconic') {
                            if(!liquid.iconicPos) {                            
                                var iconincInfo = Liquid.getIconicCount(liquid.parentObj);
                                liquid.iconicPos = { left:(3 + iconincInfo.x * Liquid.iconincSize.wx), top:(liquid.parentObj.clientHeight - (iconincInfo.y+1) * Liquid.iconincSize.wy-1), width:Liquid.iconincSize.wx, height:Liquid.iconincSize.wy };
                            }
                            liquid.outDivObj.style.left = liquid.iconicPos.left+'px';
                            liquid.outDivObj.style.top = liquid.iconicPos.top+'px';
                            liquid.outDivObj.style.width = liquid.iconicPos.width+"px";
                            liquid.outDivObj.style.height = liquid.iconicPos.height+"px";
                            liquid.outDivObj.style.position = 'absolute';
                            liquid.outDivObj.style.boxShadow  = '';
                            liquid.outDivObjOverflow = liquid.outDivObj.style.overflow;
                            liquid.outDivObj.style.overflow = 'hidden';
                            liquid.winXStatus = 'iconic';
                            var searchObj = document.getElementById(liquid.controlId+".popup.search");
                            if(searchObj) searchObj.style.display = "none";
                            liquid.outDivObj.style.resize = '';
                        }
                    } else if(liquid.isMaximized) {
                        if(liquid.winXStatus !== 'maximized') {
                            if(liquid.winXStatus === '') liquid.outDivObjSize = { y:liquid.outDivObj.offsetTop, x:liquid.outDivObj.offsetLeft, wx:liquid.outDivObj.offsetWidth, wy:liquid.outDivObj.offsetHeight };
                            liquid.referenceHeightObj = liquid.parentObj;
                            liquid.outDivObj.style.position = 'absolute';
                            if(liquid.parentObj) {
                                liquid.outDivObj.style.width = (liquid.parentObj.offsetWidth-3)+'px';
                                liquid.outDivObj.style.height = (liquid.parentObj.offsetHeight-3)+'px';
                            } else {
                                liquid.outDivObj.style.width = (document.body.offsetWidth-3)+'px';
                                liquid.outDivObj.style.height = (document.body.offsetHeight-3)+'px';
                                console.warn("WARNING: controlId"+liquid.controlId+" hs no parent...");
                            }
                            liquid.outDivObj.style.left = 0;
                            liquid.outDivObj.style.top = 0;
                            // liquid.outDivObj.style.width = '100%';
                            // liquid.outDivObj.style.height = '100%';
                            // liquid.outDivObj.style.position = 'relative';
                            if(liquid.outDivObjOverflow) liquid.outDivObj.style.overflow = liquid.outDivObjOverflow;
                            liquid.outDivObj.style.boxShadow  = '0 0px 0px rgba(0,0,0,0)';
                            liquid.winXStatus = 'maximized';
                            var searchObj = document.getElementById(liquid.controlId+".popup.search");
                            if(searchObj) searchObj.style.display = "";
                            liquid.outDivObj.style.resize = '';
                        } else {
                            liquid.outDivObj.style.left = 0;
                            liquid.outDivObj.style.top = 0;
                            liquid.outDivObj.style.width = (liquid.parentObj.offsetWidth-3)+'px';
                            liquid.outDivObj.style.height = (liquid.parentObj.offsetHeight-3)+'px';
                        }
                    } else {
                        if(liquid.winXStatus !== '') {
                            if(liquid.outDivObjSize) {
                                liquid.outDivObj.style.position = 'absolute';
                                liquid.outDivObj.style.left = liquid.outDivObjSize.x;
                                liquid.outDivObj.style.top = liquid.outDivObjSize.y;
                                liquid.outDivObj.style.width = (liquid.outDivObjSize.wx)+'px';
                                liquid.outDivObj.style.height = (liquid.outDivObjSize.wy)+'px';
                                liquid.outDivObj.style.boxShadow  = '';
                                if(liquid.outDivObjOverflow) liquid.outDivObj.style.overflow = liquid.outDivObjOverflow;
                                var searchObj = document.getElementById(liquid.controlId+".popup.search");
                                if(searchObj) searchObj.style.display = "";
                                liquid.outDivObj.style.resize = liquid.tableJson.resize;
                            }
                            liquid.winXStatus = '';
                        } else {
                            if(liquid.outDivObj)
                                liquid.outDivObjSize = { y:liquid.outDivObj.offsetTop, x:liquid.outDivObj.offsetLeft, wx:liquid.outDivObj.offsetWidth, wy:liquid.outDivObj.offsetHeight };
                        }
                    }                
                    liquid.referenceHeightObj = liquid.outDivObj;
                    if(liquid.referenceHeightObj) {
                        var lastDisplay = liquid.referenceHeightObj.style.display;
                        var lastPos = liquid.referenceHeightObj.style.position;
                        var lastLeft = liquid.referenceHeightObj.style.left;
                        if(liquid.referenceHeightObj.clientHeight <= 0) {
                            liquid.referenceHeightObj.style.display = "block";
                            liquid.referenceHeightObj.style.position = "absolute";
                            liquid.referenceHeightObj.style.left = "+9999em";
                        }
                    }
                    if(liquid.referenceHeightObj) referenceHeight = liquid.referenceHeightObj.clientHeight;
                    else return;
                } else {
                    // liquid.aggridContainerObj
                    if(isNaN(liquid.lookupHeight))
                        if(typeof liquid.lookupHeight === 'string')
                            liquid.lookupHeight = liquid.lookupHeight.replace(/[^0-9]/g,'');
                    if(!isNaN(liquid.lookupHeight)) {
                        referenceHeight = Number(liquid.lookupHeight);
                    } else {
                        console.error("ERROR: " + liquid.controlId + " undetected lookup height:" + liquid.lookupHeight);
                    }
                }
// if(liquid.controlId === "testGrid4_lookup_Dettaglio_utenti_utente") debugger
                liquid.multiPanelsHeight = 0;
                if(liquid.tableJson.multipanels) {
                    if(liquid.tableJson.multipanels.length > 0) {
                        for(var ic=0; ic<liquid.tableJson.multipanels.length; ic++) {
                            if(isDef(liquid.tableJson.multipanels[ic].height)) {
                                liquid.multiPanelsHeight += liquid.tableJson.multipanels[ic].height;
                            }
                        }
                   }
                }
                liquid.commandsObjHeight = Liquid.getPrecomputedHeight(liquid.commandsObj);
                liquid.filtersObjHeight = Liquid.getPrecomputedHeight(liquid.filtersObj);
                liquid.gridTabsObjHeight = Liquid.getPrecomputedHeight(liquid.gridTabsObj);
                liquid.navObjHeight = Liquid.getPrecomputedHeight(liquid.navObj);
                liquid.actionsObjHeight = Liquid.getPrecomputedHeight(liquid.actionsObj);

                if(referenceHeight > 0) {
                    var gridTabsHeight = (liquid.gridTabsObj ? (liquid.gridTabsObjHeight ? liquid.gridTabsObjHeight : 0) : 0);
                    var aggridContainerHeight = (
                            (referenceHeight)
                            - (liquid.popupCaptionObj ? liquid.popupCaptionObj.offsetHeight : 0)
                            - (liquid.lookupObj ? liquid.lookupObj.offsetHeight : 0)
                            - (liquid.foreignTablesObj ? liquid.foreignTablesObj.offsetHeight : 0)
                            - (liquid.commandsObj ? liquid.commandsObjHeight : 0)
                            - (liquid.filtersObj ? liquid.filtersObjHeight : 0)
                            - (gridTabsHeight)
                            - (liquid.multiPanelsHeight ? liquid.multiPanelsHeight : 0)
                            - (liquid.navObj ? liquid.navObjHeight : 0)
                            - (liquid.actionsObj ? liquid.actionsObjHeight : 0)
                            );

                    if(liquid.aggridContainerObj)
                            liquid.aggridContainerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                } else {
                    liquid.needResize = true;
                }
                if(liquid.referenceHeightObj) {
                    liquid.referenceHeightObj.style.display = lastDisplay;
                    liquid.referenceHeightObj.style.position = lastPos;
                    liquid.referenceHeightObj.style.left = lastLeft;
                }
                
                if(liquid.foreignTables) {
                    var foreignTableContainerHeight = aggridContainerHeight 
                            + (liquid.navObj ? liquid.navObjHeight : 0)
                            + (liquid.commandsObj ? liquid.commandsObjHeight : 0)
                            + (liquid.filtersObj ? liquid.filtersObjHeight : 0)
                            + (gridTabsHeight)
                            + (liquid.multiPanelsHeight ? liquid.multiPanelsHeight : 0)
                            + (liquid.actionsObj ? liquid.actionsObjHeight : 0)
                            ;
                    for(var ig = 0; ig < liquid.foreignTables.length; ig++) {
                        if(liquid.foreignTables[ig].contentObj)
                            liquid.foreignTables[ig].contentObj.style.height = (foreignTableContainerHeight > 0 ? foreignTableContainerHeight : "0") + "px";
                    }
                }
                if(liquid.tableJson.grids) {
                    for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                        if(liquid.tableJson.grids[ig].containerObj)
                            liquid.tableJson.grids[ig].containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    }
                }
                if(liquid.tableJson.layouts) {
                    for(var ig = 0; ig < liquid.tableJson.layouts.length; ig++) {
                        if(liquid.tableJson.layouts[ig].containerObj)
                            liquid.tableJson.layouts[ig].containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    }
                }
                if(liquid.tableJson.documents) {
                    for(var ig = 0; ig < liquid.tableJson.documents.length; ig++) {
                        if(liquid.tableJson.documents[ig].containerObj)
                            liquid.tableJson.documents[ig].containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    }
                }
                if(liquid.tableJson.charts) {
                    for(var ig = 0; ig < liquid.tableJson.charts.length; ig++) {
                        if(liquid.tableJson.charts[ig].containerObj)
                            liquid.tableJson.charts[ig].containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    }
                }
            } else if(liquid instanceof LiquidMenuXCtrl) {
                if(liquid.stateClose === false && liquid.stateMoving === false) {
                    Liquid.setMenuIcon(liquid.menuIconObj, liquid, liquid.outDivObj, liquid.menuIconObj, liquid.stateClose, false);
                }
            }
        }
    },
    getIconicCount:function(parentObj) {
        var result = {x:0, y:0 };
        var nIconic = 0;
        if(glLiquids) {
            for(var i=0; i<glLiquids.length; i++) {
                if(glLiquids[i].mode !== "lookup") {
                    if(glLiquids[i].isIconic) {
                        nIconic++;
                    }
                }
            }
            if(nIconic) {
                var maxX = Math.floor(parentObj.offsetWidth / Liquid.iconincSize.wx);
                result.y = Math.floor((nIconic-1) / maxX);
                result.x = (nIconic-1) % maxX;
            }
        }
        return result;
    },
    toolbarButtonMouseOver:function() {
        this.classList.add("liquidButtonHOver");
    },
    toolbarButtonMouseOut:function() {
        this.classList.remove("liquidButtonHOver");
    },
    onNavigatorBarClick:function() {
        Liquid.setFocus(this);
    },
    buildCommandButton(liquid, command, parentObj) {
        if(liquid) {
            if(parentObj) {
                if(isDef(command.name)) {
                    command.step = 0;
                    command.linkedObj = Liquid.createCommandButton(liquid, command, parentObj.className);
                    parentObj.appendChild(command.linkedObj);
                    command.linkedLabelObj = document.getElementById(command.linkedObj.id + ".label");
                    if(isDef(command.rollback)) {
                        command.rollbackCommand = {name: command.name + "-rollback", text: command.rollback, img: (command.rollbackImg ? command.rollbackImg : "cancel.png"), size: "20"};
                        command.rollbackObj = Liquid.createCommandButton(liquid, command.rollbackCommand, parentObj.className);
                        command.rollbackObj.style.display = 'none';
                        command.rollbackCommand.linkedObj = command.rollbackObj;
                        command.rollbackCommand.linkedCmd = command;
                        parentObj.appendChild(command.rollbackObj);
                    }
                }
            }
        }
    },
    onCommandBarClick:function(event) {
        var nameItems = this.id.split(".");
        if(nameItems.length > 2) {
            var cmdName = nameItems[2];
            var liquid = Liquid.getLiquid(this);
            if(liquid) {
                try {
                    if(isDef(liquid.gridOptions)) {
                        if(isDef(liquid.gridOptions.api)) {
                            var editingcells = liquid.gridOptions.api.getEditingCells();
                            if(editingcells && editingcells.length) {
                                liquid.gridOptions.api.stopEditing();
                                liquid.pendingCommand = {commandBar: true, commandName: cmdName, obj: this};
                                return;
                            }
                        }
                    }
                } catch(e) { console.error(e); }
                if(isDef(liquid.tableJson)) {
                    if(liquid.tableJson.commands) {
                        for(var i=0; i<liquid.tableJson.commands.length; i++) {
                            if(liquid.tableJson.commands[i].name === cmdName) {
                                var command = liquid.tableJson.commands[i];
                                return Liquid.onButton(liquid, command);
                            } else if(liquid.tableJson.commands[i].name + "-rollback" === cmdName) {
                                var command = liquid.tableJson.commands[i].rollbackCommand;
                                liquid.lastCommand = command;
                                return Liquid.onButton(liquid, command);
                            }
                        }
                    }
                    if(liquid.tableJson.actions) {
                        for(var i=0; i<liquid.tableJson.actions.length; i++) {
                            if(liquid.tableJson.actions[i].name === cmdName) {
                                var command = liquid.tableJson.actions[i];
                                liquid.lastAction = command;
                                return Liquid.onButton(liquid, command);
                            }
                        }
                    }
                } else if(isDef(liquid.menuJson)) {
                    if(liquid.menuCommands) {
                        for(var i=0; i<liquid.menuCommands.length; i++) {
                            if(liquid.menuCommands[i].name === cmdName) {
                                var command = liquid.menuCommands[i];
                                Liquid.openCloseParentCommand(liquid, command, null, event);
                                if(liquid.menuJson.closeParent===true || command.closeParent === true) {
                                    Liquid.closeAllPopupMenuCommand(liquid, event);
                                }
                                return Liquid.onButton(liquid, command);
                            } else if(liquid.menuCommands[i].name + "-rollback" === cmdName) {
                                var command = liquid.menuCommands[i].rollbackCommand;
                                return Liquid.onButton(liquid, command);
                            }
                        }
                    }
                }
            }
        }
    },
    closeAllPopupMenuCommand:function(liquid, event) {
        if(liquid) {
            if(liquid.lastMenuPopup.length > 0) {
                var commandsToClose = [];
                for(var im=0; im<liquid.lastMenuPopup.length; im++) {
                    lastMenuPopup = liquid.lastMenuPopup[im];
                    if(lastMenuPopup) {
                        if(lastMenuPopup.commandsContainer) {
                            if(!lastMenuPopup.commandsContainer.contains(event.target)) {
                                for(var ic=0; ic<liquid.menuCommands.length; ic++) {
                                    if(lastMenuPopup) {
                                        if(liquid.menuCommands[ic].name === lastMenuPopup.name) {
                                            if(liquid.menuCommands[ic].keepOpen !== true) {
                                                if(liquid.menuCommands[ic].isOpen === true) {
                                                    commandsToClose.push(lastMenuPopup);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                for(var im=0; im<commandsToClose.length; im++) {
                    Liquid.openCloseParentCommand(liquid, commandsToClose[im], 'closeCascade');
                }
            }
        }
    },    
    openCloseParentCommand:function(liquid, command, action, event) {
        if(isDef(command.commandsContainer)) {
            if(command.commandsContainer.style.display === 'none') {
                if(action !== 'close' && action !== 'closeCascade') {
                    command.commandsContainer.style.height = '';
                        if(command.popup === true) {                            
                            command.commandsContainer.style.left = command.linkedObj.offsetLeft+20 + 'px';
                            command.commandsContainer.style.top = command.linkedObj.offsetTop+command.linkedObj.offsetHeight+1 + 'px';
                        }
                    liquid.lastMenuPopup.push( command );
                    $( command.commandsContainer ).slideDown( "fast", function() {
                        command.commandsContainer.style.display = '';
                        command.isOpen = true;
                    });
                }
            } else {
                liquid.lastMenuPopup.splice( command, 1 );
                $( command.commandsContainer ).slideUp( "fast", function() {
                    command.commandsContainer.style.display = 'none';
                    command.isOpen = false;
                });
            }
        }
        var keepOpen = false;
        if(command.parentCommand && command.parentCommand.keepOpenOnCommand === true) keepOpen = true;
        if(command.keepOpen === true) keepOpen = true;
        if(keepOpen !== true) {
            if(typeof command.commandsContainer === 'undefined' || command.commandsContainer === null || action === 'clossingCascade') { // not contaiver or clossingCascade
                if(isDef(command.parentCommand)) {
                    if(isDef(command.parentCommand.commandsContainer)) {
                        Liquid.openCloseParentCommand(liquid, command.parentCommand, 'clossingCascade');
                    }
                }
            }
        }
        if(event) event.stopPropagation();
    },
    appendDependency:function(liquid, column, dependency ) {
        try {
            if(liquid && column && dependency){
                if(typeof column.dependencies === 'undefined' || !column.dependencies)
                    column.dependencies = [];
                var hash = Liquid.getHashCode(JSON.stringify(dependency));
                dependency.hash = hash;
                for(var id=0; id<column.dependencies.length; id++) {
                    if(column.dependencies[id].hash === hash) {
                        return false;
                    }
                }
                if(Liquid.debug)
                    console.log("DEBUG: " + liquid.controlId + " Added dependency:" + JSON.stringify(dependency));
                column.dependencies.push(dependency);
                return true;
            }
        } catch(e) { console.error("ERROR:"+e); }
        return false;
    },
    updateDependencies:function(liquid, col, rootHash, event ) {
        var updateCount = 0;
        if(liquid && col){
            if(isDef(col.dependencies)) {
                for(var id=0; id<col.dependencies.length; id++) {
                    if(col.dependencies[id].hash !== rootHash) {
                        if(Liquid.debug)
                            console.log("DEBUG: " + liquid.controlId + " Updating dependency "+(id+1)+"/"+(col.dependencies.length)+" :" + JSON.stringify(col.dependencies[id]));
                        if(isDef(col.dependencies[id].gridName)) {
                            var grid = Liquid.getGridByName(liquid, col.dependencies[id].gridName);
                            var gridObj = col.dependencies[id].gridObj;
                            var objId = col.dependencies[id].objId;
                            var selNodes = Liquid.getCurNodes(liquid);
                            var data = null;
                            if(selNodes) if(selNodes.length) data = selNodes[0].data;
                            if(event && event.target && event.target.id !== objId)
                                Liquid.onGridRefreshField(liquid, grid, gridObj, data);                            
                        } else if(isDef(col.dependencies[id].layoutName)) {
                            var layout = Liquid.getLayoutByName(liquid, col.dependencies[id].layoutName);
                            var iRow = col.dependencies[id].iRow;
                            var obj = document.getElementById(col.dependencies[id].objId);
                            if(iRow===0)
                                if(event && event.target !== obj)
                                    Liquid.setLayoutFields(liquid, layout, obj, iRow, false);
                        }
                    }
                }
            }
        }
        return updateCount;
    },
    dumpDependencies:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid){
            if(liquid.tableJson) {
                if(liquid.tableJson.columns) {
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                        var col = liquid.tableJson.columns[ic];
                        if(col) {
                            if(isDef(col.dependencies)) {
                                for(var id=0; id<col.dependencies.length; id++) {
                                    if(Liquid.debug)
                                        console.log("DEBUG: " + liquid.controlId + " on column:"+col.name+" dependency "+(id+1)+"/"+(col.dependencies.length)+" :" + JSON.stringify(col.dependencies[id]));
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    getHashCode:function(str){
        var hash = 0;
        if(str) {
            for (var i = 0; i < str.length; i++) {
                var character = str.charCodeAt(i);
                hash = ((hash<<5)-hash)+character;
                hash = hash & hash;
            }
        }
        return hash;
    },
    createFilterObject:function(liquid, parentNode, filterGroupIndex, filterObj) {
        if(filterObj) {
            var filtersDefinition = (liquid.filtersJson ? (liquid.filtersJson.length > filterGroupIndex ? liquid.filtersJson[filterGroupIndex] : null) : null);
            var inputType = (filterObj.type ? filterObj.type : "text");
            var inputMax = (filterObj.max ? "max=\"" + filterObj.max + "\"" : "");
            var inputMin = (filterObj.min ? "max=\"" + filterObj.min + "\"" : "");
            var inputStep = (filterObj.step ? "step=\"" + filterObj.step + "\"" : "");
            var inputPattern = (filterObj.pattern ? "pattern=\"" + filterObj.pattern + "\"" : "");
            var inputMaxlength = (filterObj.maxlength ? "maxlength=\"" + filterObj.maxlength + "\"" : "");
            var inputAutocomplete = (filterObj.autocomplete ? "autocomplete=\"" + filterObj.autocomplete + "\"" : "");
            var inputAutofocus = (filterObj.autofocus ? "autofocus=\"" + filterObj.autofocus + "\"" : "");
            var inputWidth = (filterObj.width ? "width=\"" + Liquid.getCSSDim(filterObj.width) + "\"" : "");
            var inputHeight = (filterObj.height ? "height=\"" + Liquid.getCSSDim(filterObj.height) + "\"" : "");
            var inputPlaceholder = (filterObj.placeholder ? "placeholder=\"" + filterObj.placeholder + "\"" : "");
            var inputRequired = (filterObj.required ? "required=\"" + filterObj.required + "\"" : "");
            var inputAutocomplete = (filterObj.autocomplete ? "autocomplete=\"" + filterObj.autocomplete + "\"" : "");
            var innerHTML = "<table style=\"width:100%; table-layout:fixed\"><tr>"
                    + "<td class=\"liquidFilterLabel\" id=\""+(liquid.controlId+".filters."+filterGroupIndex+"."+filterObj.name+".label")+"\">" + Liquid.getFilterLabel(liquid, filterObj) + "</td>"
                    + "<td class=\"liquidFilterInputTd\" id=\""+(liquid.controlId+".filters."+filterGroupIndex+"."+filterObj.name+".td")+"\">";
            var filterId = liquid.controlId + ".filters." +filterGroupIndex+"."+ filterObj.name + ".filter";
            var codeOnChange = (liquid.tableJson.filterMode == 'client' || liquid.tableJson.filterMode == "dynamic" ? " onchange=\"Liquid.onFilterChange(event, '"+filterId+"');\"" : "");
            if(filterObj.valuesList || filterObj.values) {
                var values = filterObj.valuesList ? filterObj.valuesList : filterObj.values;
                innerHTML += "<select id=\"" + filterId + "\"" + codeOnChange + " class=\"liquidSelect\" >";
                for(var i=0; i<values.length; i++) {
                    var valueObj = values[i];
                    if(valueObj) {
                        var selected = "";
                        if(valueObj.value === filterObj.value)
                            selected = "selected";
                        innerHTML += "<option " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " value=\"" + (valueObj.value ? valueObj.value : valueObj.label) + "\" " + selected + ">" + (valueObj.label ? valueObj.label : valueObj.value) + "</option>";
                    }
                }
                innerHTML += "</select>" + "</td>";
            } else if(filterObj.editor) {
                var values = filterObj.editor.values ? filterObj.values : filterObj.editorValues;
                innerHTML += "<select id=\"" + filterId + "\"" + codeOnChange + " class=\"liquidSelect\" >";
                for(var i=0; i<values.length; i++) {
                    var valueObj = values[i];
                    if(valueObj) {
                        var selected = "";
                        if(valueObj.value === filterObj.value)
                            selected = "selected";
                        innerHTML += "<option " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " value=\"" + (valueObj.value ? valueObj.value : valueObj.label) + "\" " + selected + ">" + (valueObj.label ? valueObj.label : valueObj.value) + "</option>";
                    }
                }
                innerHTML += "</select>"
                        + "</td>";
            } else {
                if(!filterObj.lookup || typeof filterObj.lookup === 'undefined') {
                    var filterId = liquid.controlId + ".filters." +filterGroupIndex + "." + filterObj.name + ".filter";
                    filterObj.objId = filterId;
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete 
                            + " value=\"\" id=\"" + filterObj.linkedContainerId + "\""
                            + " type=\"" + inputType + "\""
                            + " class=\"liquidFilterInput\""
                            + codeOnChange
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + "/>" 
                            + "<div style=\"display:inline-block; margin-left:-22px;\">"
                            + "<img src=\""+Liquid.getImagePath("delete.png")+"\" onClick=\"Liquid.onResetFilter('" + filterId + "')\" style=\"top:4px; right:7px; position:relative; cursor:pointer\" width=\"16\" height=\"16\">"
                            + "</div>"
                            + "</td>"
                            + "<td class=\"liquidFilterImg\">"
                            + "<img id=\"" + liquid.controlId + "." + filterObj.name + ".filter.search\" src=\""+Liquid.getImagePath("search.png")+"\" onClick=\"Liquid.onSearchControl(this, '" + filterObj.name + "', '" + filterId + "')\" style=\"padding-top:1; cursor:pointer\" width=\"16\" height=\"16\">"
                            + "</td>"
                            + "</tr></table>";
                } else {
                    // lookup created later...
                    innerHTML += "<div id=\"" + filterObj.linkedContainerId + "\"></div>";
                }
            }
            parentNode.innerHTML = innerHTML;
        }
    },
    createCommandButton:function(liquid, command, className) {
        if(command) {
            var div = document.createElement("div");
            div.className = className+"Button";
            div.style.borderWidth = "1px";
            div.style.borderStyle = "solid";
            div.onmouseover = Liquid.toolbarButtonMouseOver;
            div.onmouseout = Liquid.toolbarButtonMouseOut;
            if(command.navigator === true) {
                div.onclick = Liquid.onNavigatorBarClick;
            } else {
                div.onclick = Liquid.onCommandBarClick;
            }
            div.style.cursor = 'pointer';
            div.id = liquid.controlId + ".command." + command.name;
            if(Liquid.projectMode || Liquid.debug) {
                div.title = "Command: "+(command.name ? command.name : "N/D")
                            +"\nTitle: "+(command.title ? command.title : "N/D")
                            +"\nServer: "+(command.server ? command.server : "N/D")
                            +"\nClient: "+(command.client ? command.client : "N/D")
                            +(command.clientAfter ? "\nClientAfter: "+command.clientAfter : "");
                            +"\nNative: "+(command.isNative === true ? true : false);
                            +"\nImage: "+(command.img ? command.img : "N/D");
                            +"\nSize: "+(command.size ? command.size : "N/D");
                            +"\nText: "+(command.text ? command.text : "N/D");
                } else {
                    div.title = (command.title ? command.title : (command.name ? command.name : ""));
                }
            if(typeof command.img === 'undefined') command.img = null;
            var size = command.size ? command.size : command.img ? 24 : 0;
            var width = (command.img ? (command.width ? command.width : 0) : 0);
            var height = (command.img ? (command.height ? command.height : 0) : 0);
            div.innerHTML = "<table><tr><td style=\"width:1px\"><img class=\""+className+"Img\" " + (command.img ? " src=\"" + (command.img ? Liquid.getImagePath(command.img) : " ") + "\"" : "") 
                            + " width=" + (width ? Liquid.getCSSDim(width) : Liquid.getCSSDim(size)) + " height=" + (height ? Liquid.getCSSDim(height) : Liquid.getCSSDim(size)) + " style=\"cursor:pointer\" />"
                            + "</td>"
                            + (command.text ? "<td><div id=\"" + div.id + ".label" + "\" class=\""+className+"Text\" style=\"cursor:pointer\">" + command.text + "</div></td>" : "")
                            + "</tr></table>"
                            ;
                    
            if(typeof liquid.type === 'left') {
            } else if(typeof liquid.type === 'right') {
            } else if(typeof liquid.type === 'top') {
            } else if(typeof liquid.type === 'bottom') {
            }
            return div;
        }
    },
    createFiltersLookups:function(liquid, filtersJson) {
        for(var i=0; i<filtersJson.length; i++) {
            var filterJson = filtersJson[i];
            for(var ic=0; ic<filterJson.columns.length; ic++) {
                if(isDef(filterJson.columns[ic].lookup)) {
                    if(filterJson.columns[ic].lookup) {
                        if(!Liquid.startLookup(liquid.controlId, "filters_"+(i+1)+"_"+filterJson.columns[ic].name, filterJson.columns[ic].linkedContainerId, filterJson.columns[ic].lookup, filterJson.columns[ic].lookupField, filterJson.columns[ic].options, 'filter', "filter field", null)) {
                            // TODO: normal filer?
                        }
                    }
                }
            }
        }
    },
    createFiltersPickups:function(liquid, filtersJson) {
        for(var i=0; i<filtersJson.length; i++) {
            var filterJson = filtersJson[i];
            for(var ic=0; ic<filterJson.columns.length; ic++) {
                filterObj = filterJson.columns[ic];
                var iField1B = Liquid.solveGridField(liquid, filterObj);
                if(iField1B > 0) {
                    var col = liquid.tableJson.columns[iField1B-1];
                    if(isDef(col)) {
                        if(Liquid.isDate(col.type)) {
                            var obj = document.getElementById(filterObj.objId);
                            Liquid.createDateTimePicker(col, obj, false, liquid, null);
                        }
                    }
                }
            }
        }
    },
    createGrid:function(liquid, grid, id) { // Tab List/Grid
        if(liquid) {
            if(grid) {
                var cellsMap = [];
                var i = 0;
                grid.id = liquid.controlId + ".grid_tab." + id + ".table";
                var tbl = document.createElement("table");
                tbl.id = grid.id;
                tbl.style.tableLayout = 'fixed';
                tbl.className = "liquidGridTableContainer";
                if(isDef(grid.height)) tbl.style.height = Liquid.getCSSDim(grid.height);
                if(isDef(grid.width)) tbl.style.width = Liquid.getCSSDim(grid.width);
                var tbody = document.createElement("tbody");
                grid.nRows = grid.nRows ? Number(grid.nRows) : 1;
                grid.nCols = grid.nCols ? Number(grid.nCols) : 1;
                for(var c=0; c< grid.columns.length; c++) {
                    if(isDef(grid.columns[c].row)) grid.columns[c].row = Math.floor(grid.columns[c].row);
                    if(isDef(grid.columns[c].col)) grid.columns[c].col = Math.floor(grid.columns[c].col);
                }                
                for(var r = 0; r < grid.nRows; r++) {
                    var tr = document.createElement("tr");
                    tr.className = "liquidGridRow " + (r % 2 ? "liquidGridRowOdd" : "liquidGridRowEven");
                    for(var c = 0; c < grid.nCols; c++) {
                        var td = document.createElement("td");
                        i = Liquid.getGridCell(liquid, grid, r, c);
                        if(i >= 0 && i < grid.columns.length) {
                            var div = document.createElement("div");
                            var inputType = "text";
                            div.innerHTML = "<span class=\"liquidGridTables liquidGridLabel\">" + (grid.columns[i].label ? grid.columns[i].label : grid.columns[i].name) + "</span>";
                            td.appendChild(div);
                            if(isDef(grid.columns[i].labelWidth))
                                td.style.width = Liquid.getCSSDim(grid.columns[i].labelWidth);
                            if(isDef(grid.columns[i].labelHeight))
                                td.style.height = Liquid.getCSSDim(grid.columns[i].labelHeight);
                        }
                        tr.appendChild(td);
                        td = document.createElement("td");
                        if(i >= 0 && i < grid.columns.length) {
                            var tdId = grid.id + "." + (i + 1) + ".value.container";
                            if(cellsMap.indexOf(tdId) >= 0) 
                                console.error("ERROR: control:"+liquid.controlId+" grid:"+grid.name+" row:"+(r+1) + " columns:"+(c+1)+" item duplicate");
                            cellsMap.push(tdId);
                            td.id = tdId;
                            grid.columns[i].index1B = i + 1;
                            Liquid.createGridObject(liquid, td, grid, grid.columns[i]);
                            if(isDef(grid.columns[i].width)) {
                                td.style.width = Liquid.getCSSDim(grid.columns[i].width);
                                td.style.display = "block";
                            }
                            if(isDef(grid.columns[i].height)) {
                                td.style.height = grid.columns[i].height;
                                td.style.display = "block";
                            }
                        }
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                tbl.appendChild(tbody);
                return tbl;
            }
        }
    },
    isSunEditor:function(col) {
        if(    (isDef(col.editor) && typeof col.editor === "string" && (col.editor.toLowerCase() === 'sun' || col.editor.toLowerCase() === 'suneditor' || col.editor.toLowerCase() === 'richedit'))
            || (isDef(col.editor) && isDef(col.editor.type) && typeof col.editor.type === "string" && (col.editor.type.toLowerCase() === 'sun' || col.editor.type.toLowerCase() === 'suneditor' || col.editor.type.toLowerCase() === 'richedit'))
            ) {
            return true;
        } else {
            return false;
        }
    },
    isCodeEditor:function(col) {
        if( isDef(col.editor) && isDef(col.editor.code) && col.editor.code === true ) {
            return true;
        } else {
            return false;
        }
    },
    createGridObject:function(liquid, parentNode, grid, gridObj) {
        if(gridObj) {
            var div = document.createElement("div");
            var innerHTML = "";
            var inputType = (gridObj.type ? gridObj.type : "text");
            var inputMax = (gridObj.max ? "max=\"" + gridObj.max + "\"" : "");
            var inputMin = (gridObj.min ? "max=\"" + gridObj.min + "\"" : "");
            var inputStep = (gridObj.step ? "step=\"" + gridObj.step + "\"" : "");
            var inputPattern = (gridObj.pattern ? "pattern=\"" + gridObj.pattern + "\"" : "");
            var inputMaxlength = (gridObj.maxlength ? "maxlength=\"" + gridObj.maxlength + "\"" : "");
            var inputAutocomplete = (gridObj.autocomplete ? "autocomplete=\"" + gridObj.autocomplete + "\"" : "");
            var inputAutofocus = (gridObj.autofocus ? "autofocus=\"" + gridObj.autofocus + "\"" : "");
            var inputWidth = (gridObj.width ? "width:" + Liquid.getCSSDim(gridObj.width) + ";" : "");
            var inputHeight = (gridObj.height ? "height:" + Liquid.getCSSDim(gridObj.height) + ";" : "");
            var inputPlaceholder = (gridObj.placeholder ? "placeholder=\"" + gridObj.placeholder + "\"" : "");
            var inputRequired = (gridObj.required ? "required=\"" + gridObj.required + "\"" : "");
            var inputAutocomplete = (gridObj.autocomplete ? "autocomplete=\"" + gridObj.autocomplete + "\"" : "");
            var col = gridObj.colLink1B > 0 ? liquid.tableJson.columns[gridObj.colLink1B - 1] : null;
            var itemId = grid.id + "." + (gridObj.index1B) + ".value";
            if((col && typeof col.required !== 'undefined')) {
                inputRequired = col.required;
            }
            if((col && typeof col.size !== 'undefined')) {
                if(inputMaxlength !== "") {
                    if(Number(inputMaxlength) > col.size)
                        inputMaxlength = col.size;
                } else {
                    inputMaxlength = col.size;
                }
            }
            if(typeof col === 'undefined' || !col) {
                innerHTML += "<div id=\"" + itemId + "\" title=\""+(gridObj.name)+" not found...check on your database\" style=\"color:"+Liquid.undetectedColumnColor+"\">"+Liquid.undetectedColumnMessage+"</div>";
            } else {
                var toolTip = Liquid.getColumnTooltip(liquid, col);
                if((col && typeof col.lookup !== 'undefined' && col.lookup) || (typeof gridObj.lookup !== 'undefined' && gridObj.lookup)) {
                    innerHTML += "<div id=\"" + itemId + "\" title=\""+toolTip+"\"></div>";

                } else if(Liquid.isSunEditor(col) || Liquid.isSunEditor(gridObj)) {
                    innerHTML += "<div"
                            + " id=\"" + itemId + "\""
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " onclick=\"Liquid.onPickRichField(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " ></div>";

                } else if((col && typeof col.type !== 'undefined' && (col.type === "93"))) {
                    innerHTML += ""
                            + "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + inputType + "\" "
                            // + " data-date-format=\"DD-MM-YYYY HH:mm:ss\""
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " autocomplete=\"off\""
                            // + " onclick=\"Liquid.onPickDate(event,this)\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + "/>"
                            ;
                } else if((col && typeof col.type !== 'undefined' && (col.type === "6" || col.type === "91"))) {
                    innerHTML += ""
                            + "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + inputType + "\" "
                            // + " data-date-format=\"DD-MM-YYYY HH:mm:ss\""
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " autocomplete=\"off\""
                            + " onclick=\"Liquid.onPickDate(event,this)\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " />"
                            ;
                } else if(Liquid.isInteger(col.type)) {
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + "number" + "\" "
                            + " step=\"" + "1" + "\" "
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " />";
                } else if(Liquid.isFloat(col.type)) {
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + "number" + "\" "
                            + " step=\"" + "0.01" + "\" "
                            + " pattern=\"" + "\d*" + "\" "
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " />";
                } else {
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + inputType + "\" "
                            + " class=\"liquidGridControl "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + "\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            +"/>";
                }
            }
            div.innerHTML = innerHTML;
            div.style.height = '0px';
            div.style.display = "contents";
            gridObj.linkedContainerId = itemId;
            parentNode.appendChild(div);
            if(!liquid.gridsFirstId)
                liquid.gridsFirstId = gridObj.linkedContainerId;
            if(col) {
                Liquid.appendDependency(liquid, col, { gridName:grid.name, gridObj:gridObj, objId:itemId } );
            }
        }
    },
    createGridsPickups:function(liquid, grids) {
        if(grids) {
            for(var ig = 0; ig < grids.length; ig++) {
                var grid = grids[ig];
                for(var i=0; i<grid.columns.length; i++) {
                    var obj = document.getElementById(grid.columns[i].linkedContainerId);
                    var col = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B - 1] : null;
                    if(isDef(col)) {
                        if(Liquid.isDate(col.type)) {
                            Liquid.createGridPickDate(liquid, obj);
                        }
                    }
                }
            }
        }
    }
    ,createGridsLookups:function(liquid, grids) {
        if(grids) {
            for(var ig = 0; ig < grids.length; ig++) {
                var grid = grids[ig];
                for(var i=0; i<grid.columns.length; i++) {
                    var obj = document.getElementById(grid.columns[i].linkedContainerId);
                    if(isDef(grid.columns[i].lookup)) {
                        if(grid.columns[i].lookup) {
                            Liquid.startLookup(liquid.controlId, grid.name + "_" + grid.columns[i].name.replace(/\./g, "_"), grid.columns[i].linkedContainerId, grid.columns[i].lookup, grid.columns[i].lookupField, grid.columns[i].options, 'grid', "grid \"" + grid.name + "\" field \"" + grid.columns[i].name + "\"", null);
                        }
                    } else {
                        var col = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B - 1] : null;
                        if(isDef(col)) {
                            if(isDef(col.lookup)) {
                                Liquid.startLookup(liquid.controlId, grid.name + "_" + grid.columns[i].name.replace(/\./g, "_"), grid.columns[i].linkedContainerId, col.lookup, col.lookupField, col.options, 'grid', "column field \"" + col.name + "\"", null);
                            }
                        }
                    }
                }
            }
        }
    },
    getGridCell:function(liquid, grid, r, c) {
        if(grid) {
            if(grid.columns) {
                for(var i=0; i<grid.columns.length; i++) {
                    if(grid.columns[i].row === r && grid.columns[i].col === c)
                        return i;
                }
            }
            var index = r*grid.nCols+c;
            if(index < grid.columns.length) {
                if(typeof grid.columns[index].row === 'undefined' && typeof grid.columns[index].col === 'undefined') return index;
            }
        }
        return -1;
    },
    getGridCoords:function(liquid, obj) {
        if(liquid && obj) {
            var nameItems = obj ? obj.id.split(".") : null;
            if(nameItems && nameItems.length > 2) {
                var gdIndex = nameItems[2] - 1;
                if(nameItems.length > 4) {
                    var gItemIndex = nameItems[4] - 1;
                    var grid = liquid.tableJson.grids[gdIndex];
                    var gridControl = grid.columns[gItemIndex];
                    var col = liquid.tableJson.columns[gridControl.colLink1B - 1];
                    return {grid: grid, control: gridControl, column: col};
                }
            }
        }
        return null;
    },
    getGridByName:function(liquid, gridName) {
        if(liquid && gridName)
            if(isDef(liquid.tableJson.grids))
                for(var ig=0; ig<liquid.tableJson.grids.length; ig++)
                    if(liquid.tableJson.grids[ig].name === gridName) 
                        return liquid.tableJson.grids[ig];
        return null;
    },
    solveGridField:function(liquid, column) {
        if(liquid) {
            if(column) {
                var name = column.name;
                var label = column.label;
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    if(name === liquid.tableJson.columns[iF].name || label === liquid.tableJson.columns[iF].label) {
                        return iF + 1;
                    }
                }
                // Now insensitive case
                name = column.name ? column.name.toUpperCase() : "";
                label = column.label ? column.label.toUpperCase() : "";
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    var uName = isDef(liquid.tableJson.columns[iF].name) ? liquid.tableJson.columns[iF].name.toUpperCase() : null;
                    var uLabel = isDef(liquid.tableJson.columns[iF].label) ? liquid.tableJson.columns[iF].label.toUpperCase() : null;
                    if(name ===  uName || label === uLabel) {
                        return iF + 1;
                    }
                }
            }
        }
        return 0;
    },
    onGridFieldModify:function(e, obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var grid_coords = Liquid.getGridCoords(liquid, obj);
            if(grid_coords) {
                var gridControl = grid_coords.control;
                if(gridControl) {
                    var col = grid_coords.column;
                    if(col) {
                        if(typeof col.isReflected === 'undefined' || col.isReflected !== true) {
                            var selNodes = Liquid.getCurNodes(liquid);
                            for(var node=0; node<selNodes.length; node++) {
                                var data = selNodes[node].data;
                                if(obj.classList.contains("liquidGridControlRW")) {
                                    var newValue=null;
                                    var curValue=null;
                                    if(obj.nodeName==='INPUT') newValue = obj.value;
                                    else newValue = obj.innerHTML;
                                    if(Liquid.isDate(col.type)) { curValue = data[col.field]; } else curValue = data[col.field];
                                    if(newValue !== curValue) {
                                        var validateResult = Liquid.validateField(liquid, col, newValue);
                                        if(validateResult !== null) {
                                            if(validateResult[0] >= 0) {
                                                newValue = validateResult[1];
                                                data[col.field] = newValue;
                                                selNodes[node].setDataValue(col.field, newValue);
                                                Liquid.setGridFieldAsChanged(liquid, gridControl, true);
                                                Liquid.registerFieldChange(liquid, null, data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], col.field, null, newValue);
                                                Liquid.updateDependencies(liquid, col, null);
                                                // TODO: multirecord modify
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    getLayoutByName:function(liquid, layoutName) {
        if(liquid && layoutName)
            if(isDef(liquid.tableJson.layouts))
                for(var ig=0; ig<liquid.tableJson.layouts.length; ig++)
                    if(liquid.tableJson.layouts[ig].name === layoutName) 
                        return liquid.tableJson.layouts[ig];
        return null;
    },
    getLayoutCoords:function(liquid, obj) {
        if(liquid && obj) {
            var nameItems = obj ? obj.id.split(".") : null;
            if(nameItems && nameItems.length > 2) {
                var layoutIndex = nameItems[2] - 1;
                if(nameItems.length > 2) {
                    return { layout: liquid.tableJson.layouts[layoutIndex], itemIndex:nameItems[4] - 1, layoutIndex:layoutIndex, col:nameItems[4]-1, row:nameItems[6] - 1  };
                }
            }
        }
        return null;
    },
    loadLayoutsContent:function(liquid) {        
        if(liquid.tableJson.layouts) {
            for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                var layout = liquid.tableJson.layouts[il];
                if(layout) {
                    if(layout.source !== 'undefined' && layout.source) {
                        layout.containerObj.innerHTML = "Loading \""+layout.source+"\"...";
                        try {
                            var sources = [
                                 { key:"source" }
                                ,{ key:"sourceForInsert" }
                                ];
                            layout.templateRows = [];
                            // need rendered html to compute height
                            lastDisplay = layout.containerObj.style.display;
                            layout.containerObj.style.display = "";
                            for (var is=0; is<sources.length; is++) {
                                source = layout[sources[is].key];
                                if(isDef(source)) {
                                    if(source.startsWith("url(")) {
                                        var jsonURL = source.substring(4);
                                        if(jsonURL.endsWith(")"))
                                            jsonURL = jsonURL.substring(0, jsonURL.length - 1);
                                        var xhr = new XMLHttpRequest();
                                        xhr.open('GET', jsonURL, false);
                                        xhr.send();
                                        if(xhr.status === 200) {
                                            try {
                                                if(xhr.responseText) {
                                                    layout.containerObj.innerHTML = xhr.responseText;
                                                    var height = Liquid.getItemsMaxHeight(layout.containerObj);
                                                    var rootObj = document.createElement("div");
                                                    rootObj.className = "liquidLayoutRowContainerDiv";
                                                    rootObj.id = liquid.controlId+"."+layout.name+".source."+(is+1);
                                                    while(layout.containerObj.childNodes.length) {
                                                        rootObj.appendChild(layout.containerObj.childNodes[0]);
                                                    }
                                                    layout.pageLoaded = true;                                                    
                                                    layout.templateRows.push( { key:sources[is].key, templateRow:rootObj, isAutoInsert:isAutoInsert, isFormX:isFormX, mode:mode, source:source, height:height } );
                                                    layout.containerObj.innerHTML = "";
                                                } else console.error("ERROR: No response reading :"+jsonURL+" of controlId:"+liquid.controlId);
                                            } catch (e) { console.error(e); }
                                        } else {
                                            console.error("ERROR: source file :"+source+" failed to read (error:"+xhr.status+") on layout \""+layout.name+"\" of controlId \""+liquid.controlId+"\"");
                                        }
                                        if(Liquid.debug) console.log("INFO: reading source:"+layout.source+" of layout:"+layout.name+":"+jsonURL);
                                    } else {
                                        var content = Liquid.getProperty(layout.source);
                                        if(content === 'undefined' || !content) {
                                            layout.containerObj.innerHTML = content;
                                        } else {
                                            layout.containerObj.innerHTML = layout.source;
                                        }
                                        var height = Liquid.getItemsMaxHeight(layout.containerObj);
                                        var rootObj = document.createElement("div");
                                        while(layout.containerObj.childNodes.length) {
                                            rootObj.appendChild(layout.containerObj.childNodes[0]);
                                        }
                                        layout.templateRows.push( { key:sources[is].key, templateRow:rootObj, isAutoInsert:isAutoInsert, isFormX:isFormX, mode:mode, source:layout.source, height:height } );
                                        layout.pageLoaded = true;
                                    }
                                }
                            }
                            layout.containerObj.style.display = lastDisplay;
                            
                            Liquid.refreshLayout(liquid, layout, true);
                            
                            var mode = "readonly";
                            var isFormX = Liquid.isFormX(liquid);
                            var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                            if(isFormX || isAutoInsert === true) mode = "write";
                            Liquid.onLayoutMode(layout.containerObj, mode);
                            
                        } catch (e) {
                            console.error("ERROR : in layouts : parse error:" + e);
                        }
                    } else {
                        layout.containerObj.innerHTML = "source attribute not found";
                    }
                }
            }
        }
    },    
    refreshLayouts:function(liquid, bSetup) {
        if(liquid.tableJson.layouts) {
            if(liquid.tableJson.layouts.length > 0) {
                for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                    var layout = liquid.tableJson.layouts[il];
                    Liquid.refreshLayout(liquid, layout, bSetup);
                }
            }
        }
    },
    refreshLayout:function(liquid, layout, bSetup) {
        if(liquid) {
            if(layout) {
                /// if(bSetup) if(liquid.controlId === 'testGrid4') if(layout.name === 'MyCustomPage2') debugger;
                if(layout.pageLoaded === true) {
                    if(layout.pendingLink === true) {
                        if(!bSetup) { 
                            /// setTimeout( function() { Liquid.refreshLayout(liquid, layout, bSetup); }, 1000); 
                            bSetup = true;
                            // return;
                        }
                    }
                    var curNodes = null;
                    if(layout.nRows <= 0) { // all rows : baseIndex1B = 1
                        layout.baseIndex1B = 1;
                        curNodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    } else {
                        curNodes = Liquid.getCurNodes(liquid);
                        if(!curNodes || (curNodes != null && !curNodes.length)) { // no selection : show anyway from first row
                            curNodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                        }
                    }

                    layout.firstNodeId = curNodes && curNodes.length ? curNodes[0].id : null;
                    Liquid.linkLayoutToFields(liquid, layout, layout.containerObj, bSetup);
                }
            }
        }
    },
    linkLayoutToFields:function(liquid, layout, containerObj, bSetup) {
        if(liquid) {
            if(layout) {
                if(containerObj) {
                    if(containerObj.nodeName.toUpperCase() === 'IFRAME') {
                        try { containerObj = containerObj.contentWindow.document.body; } catch (e) { console.error("ERROR: unable to access to dsocument at layout:"+layout.name+", error:"+e); }
                    }
                    /// if(bSetup) if(liquid.controlId === 'testGrid4') if(layout.name === 'MyCustomPage2') debugger;
                    var nRows = 0;
                    if(typeof layout.nRows !== 'undefined' && (layout.nRows === 0 || layout.nRows === 'auto')) {
                        // var lastDisplay = containerObj.style.display;
                        // containerObj.style.display = '';
                        if(containerObj.offsetWidth > 0 && containerObj.offsetHeight > 0) {
                            // layout.itemsMaxHeight = Liquid.getItemsMaxHeight(containerObj);
                            layout.itemsMaxHeight = layout.templateRows[0].height;
                            if(layout.itemsMaxHeight > 0)
                                if(layout.overflow === 'clamp') {
                                    layout.nRows = Math.floor(containerObj.clientHeight / layout.itemsMaxHeight);
                                    if(layout.nRows <= 0) layout.nRows = 1;
                                    layout.itemsMaxHeight = containerObj.clientHeight / layout.nRows;
                                } else {
                                    layout.nRows = Math.round(containerObj.clientHeight / layout.itemsMaxHeight);
                                }
                            else
                                layout.nRows = 1;
                            if(layout.nRows < 1)
                                layout.nRows = 1;
                            layout.itemsMaxHeight = containerObj.clientHeight / layout.nRows;
                        } else {
                            /// setTimeout(function(){ Liquid.linkLayoutToFields(liquid, layout, containerObj, bSetup); }, 3000);                            
                            return;
                        }
                        // containerObj.style.display = lastDisplay;
                        nRows = layout.nRows;
                    } else {
                        nRows = layout.nRows;
                        if(nRows < 0 || nRows === 'all' || nRows=='*') {
                            if(liquid.loadCounter > 0) {
                                nRows = liquid.nRows;
                                layout.baseIndex1B = 1;
                            } else {
                                // not ready
                                layout.pendingRefresh = true;
                                return;
                            }
                        }
                        
                        if(nRows>=1) {
                            if(containerObj.offsetWidth <= 0 || containerObj.offsetHeight <= 0) {
                                /// setTimeout(function(){ Liquid.linkLayoutToFields(liquid, layout, containerObj, bSetup); }, 3000);
                                // not ready
                                layout.pendingRefresh = true;
                                return;
                            }
                        }
                        if(layout.nRows > 0) {
                            layout.itemsMaxHeight = containerObj.clientHeight / nRows;
                        } else {
                            layout.itemsMaxHeight = "auto";
                        }
                    }                    
                    if(layout.overflow === 'clamp' || layout.overflow === 'hidden') {
                        containerObj.style.overflow = "hidden";
                    }                            
                    if(typeof layout.rowsContainer === 'undefined' || !layout.rowsContainer) {
                        layout.rowsContainer = [];
                    }
                    

                    var isFormX = Liquid.isFormX(liquid);
                    var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                    if(isFormX) {
                        if(layout.nRows <= 0) { // all rows
                            if(nRows <= 0) nRows = 1;
                        }
                    } else if(isAutoInsert) {
                        if(layout.nRows <= 0) { // all rows
                            nRows = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren.length;
                        }
                    }
                    
                    // Duplicate contents
                    for(var ir=0; ir<nRows; ir++) {
                        var templateRowSource = Liquid.getTemplateRowSource(liquid, layout, layout.baseIndex1B-1+ir );
                        var templateRow = Liquid.getTemplateRow(liquid, layout, layout.baseIndex1B-1+ir );
                        var bCreateRow = false;                       
                        if(layout.rowsContainer.length < ir+1) {
                            bCreateRow = true;
                        } else {
                            if(layout.rowsContainer[ir] === null) {
                                bCreateRow = true;
                            } else {
                                if(layout.rowsContainer[ir].templateRowSource != templateRowSource) {
                                    layout.rowsContainer[ir].templateRowSource = templateRowSource;
                                    layout.rowsContainer[ir].containerObj.innerHTML = "";
                                    layout.rowsContainer[ir].containerObj.innerText = "";
                                    layout.rowsContainer[ir].bSetup = true;
                                    if(templateRow) layout.rowsContainer[ir].containerObj.appendChild(templateRow.cloneNode(true));
                                }
                            }
                        }
                        if(bCreateRow) {
                            var rowObj = document.createElement("div");
                            rowObj.className = "liquidLayoutRowContainer";
                            rowObj.style.display = "block";
                            rowObj.style.position = "relative";
                            if(layout.overflow === 'auto' || layout.overflow === 'scroll' || layout.overflow === 'overlay') rowObj.style.overflow = 'auto';
                            else rowObj.style.overflow = 'hidden';
                            rowObj.style.border = "0px solid red";
                            rowObj.style.width = "100%";
                            rowObj.style.height = !isNaN(layout.itemsMaxHeight) ? layout.itemsMaxHeight+"px" : (layout.itemsMaxHeight ? layout.itemsMaxHeight : "100%");
                            rowObj.style.paddingTop = rowObj.style.paddingBottom = (!isNaN(layout.rowPadding) ? layout.rowPadding+"px" : (layout.rowPadding ? layout.rowPadding : ""));
                            rowObj.id = liquid.controlId+".layout."+layout.name+".rowContainer."+(ir+1);

                            // link dei campi
                            if(templateRow) {
                                rowObj.appendChild(templateRow.cloneNode(true));
                            } else {
                                console.error("ERROR : no template defined for layout : "+layout.name, " at row #"+ir);
                            }
                            
                            containerObj.appendChild(rowObj);
                            if(layout.rowsContainer.length < ir+1) {
                                layout.rowsContainer.push( { containerObj:rowObj, objs:[], objsReset:[], cols:[], bSetup:true, templateRowSource:templateRowSource } );
                            } else {
                                layout.rowsContainer[ir] = { containerObj:rowObj, objs:[], objsReset:[], cols:[], bSetup:true, templateRowSource:templateRowSource };
                            }
                        }
                    }
                    
                    if(layout.nRows <= 0) { // all rows : baseIndex1B = 1
                        layout.baseIndex1B = 1;
                    } else { // nRows from cur nodes
                        layout.baseIndex1B = Liquid.getNodeIndex(liquid, layout.firstNodeId);
                    }
                    
                    var nodes = null;
                    if(isDef(liquid.gridOptions)) {
                        if(isDef(liquid.gridOptions.api)) {
                            nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                        }
                    }
                    for(var ir=0; ir<nRows; ir++) {
                        // if(layout.name === 'MyCustomPage2') debugger;
                        Liquid.setLayoutFields(liquid, layout, layout.rowsContainer[ir].containerObj, ir, layout.rowsContainer[ir].bSetup);
                        layout.rowsContainer[ir].bSetup = false;
                        var isAddingNode = Liquid.isAddingNode(liquid, layout.baseIndex1B-1+ir, nodes);
                        if( layout.baseIndex1B > 0 && (layout.baseIndex1B-1+ir < liquid.nRows || isAddingNode) || isFormX ) {
                            layout.rowsContainer[ir].containerObj.style.filter = "";
                            layout.rowsContainer[ir].containerObj.disabled = false;
                            layout.rowsContainer[ir].containerObj.style.pointerEvents = '';
                            
                            // Firing event onRowRendering
                            Liquid.onEvent(layout.rowsContainer[ir].containerObj, "onRowRendering", { 
                                layout:layout, 
                                layoutRow:(ir+1), 
                                layoutRows:nRows, 
                                obj:layout.rowsContainer[ir].containerObj,
                                rowData: Liquid.getFullRecordData(liquid, nodes[layout.baseIndex1B-1+ir]),
                                node: Liquid.getCleanNodeData(nodes[layout.baseIndex1B-1+ir]),
                                nodes: Liquid.getCleanNodesData(nodes),
                                command: null,
                                isAddingNode:(liquid.addingNode === nodes[layout.baseIndex1B-1+ir]),
                                rowsContainer:layout.rowsContainer[ir]
                            }, null);
                        } else {
                            layout.rowsContainer[ir].containerObj.style.filter = "grayscale(.5) opacity(0.5) blur(3px)";
                            layout.rowsContainer[ir].containerObj.disabled = true;
                            layout.rowsContainer[ir].containerObj.style.pointerEvents = 'none';
                        }
                    }
                    if(layout.nRows <= 0) {
                        if(nRows < layout.rowsContainer.length) {
                            for (var ir=nRows; ir<layout.rowsContainer.length; ir++) {
                                if(layout.rowsContainer[ir]) {
                                    var obj = layout.rowsContainer[ir].containerObj;
                                    if(obj) {
                                        obj.parentNode.removeChild(obj);
                                        layout.rowsContainer[ir] = null;
                                    }
                                }
                            }
                        }
                    }                    
                }
                layout.pendingLink = false;
                layout.pendingRefresh = true;
            }
        }
    },
    isWinX:function(liquid) {
        return (liquid.mode === "winX" || liquid.mode === "WinX");
    },
    isFormX:function(liquid) {
        return (liquid.mode === "formX" || liquid.mode === "FormX");
    },
    isAutoInsert:function(liquid, layout) {
        var autoInsert = false;
        if(isDef(liquid)) if(isDef(liquid.tableJson.autoInsert)) autoInsert = liquid.tableJson.autoInsert;
        if(isDef(layout)) if(isDef(layout.autoInsert)) autoInsert = layout.autoInsert;
        return autoInsert;
    },            
    getItemsMaxHeight:function(containerObj) {
        var maxHeight = 0, maxY = -999999999, minY = 999999999, setCount = 0;
        var scrollTop = document.body.scrollTop;
        for(var j=0; j<containerObj.childNodes.length; j++) {
            var obj = containerObj.childNodes[j];
            if(obj) {
                if(obj.nodeType===1) {
                    if(typeof obj.getBoundingClientRect === 'function') {
                        var rect = obj.getBoundingClientRect();
                        if(rect) {
                            if(rect.height>0) {
                                if(rect.top+scrollTop < minY) { minY = rect.top+scrollTop; setCount++; };
                                if(rect.bottom+scrollTop > maxY) { maxY = rect.bottom+scrollTop; setCount++; };
                            }
                        }
                    }
                }
            }
        }
        if(setCount) {
            return maxY - minY;
        } else {
            return 0;
        }
    },
    getTemplateRow:function (liquid, layout, ir) {
        var templateRow = null;
        if(liquid) {
            if(layout) {
                var nodes = null;
                try { nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren; } catch(e) {}
                var isAddingNode = Liquid.isAddingNode(liquid, ir, nodes);
                if(isAddingNode) {
                    if(layout.templateRows.length > 1)
                        if(layout.templateRows[1])
                            if(layout.templateRows[1].templateRow)
                                return layout.templateRows[1].templateRow;
                    return layout.templateRows[0].templateRow;
                } else {
                    return layout.templateRows[0].templateRow;
                }
            }
        }
    },
    getTemplateRowSource:function (liquid, layout, ir) {
        var templateRow = null;
        if(liquid) {
            if(layout) {
                var nodes = null;
                try { nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren; } catch(e) {}
                var isAddingNode = Liquid.isAddingNode(liquid, ir, nodes);
                if(isAddingNode) {
                    if(layout.templateRows.length > 1)
                        if(layout.templateRows[1])
                            if(layout.templateRows[1].source)
                                return layout.templateRows[1].source;
                    return layout.templateRows[0].source;
                } else {
                    return layout.templateRows[0].source;
                }
            }
        }
    },
    setLayoutFields: function (liquid, layout, obj, iRow, bSetup) {
        if(obj) {
            var objLinkers = null;
            var objLinkersTarget = null;
            if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'TEXTAREA') {
                objLinkers = [obj.id, obj.className];
                objLinkersTarget = [null, "className"];
            } else if(obj.nodeName.toUpperCase() === 'DIV' || obj.nodeName.toUpperCase() === 'SPAN' || obj.nodeName.toUpperCase() === 'TD' || obj.nodeName.toUpperCase() === 'P') {
                objLinkers = [obj.innerHTML, obj.id, obj.classList];
                objLinkersTarget = [null, null, "className"];
            }
            if(objLinkers) {
                var linkeCol = null;
                var objLinkerDesc = "";
                var value = "[!]";
                var linkCount = 0;
                var doc = obj.ownerDocument;
                var win = doc.defaultView || doc.parentWindow;

                if(bSetup) {
                    for (var il = 0; il < objLinkers.length; il++) {
                        if(typeof objLinkers[il] === 'string') {
                            if(objLinkers[il].startsWith("@{")) {
                                linkCount++;
                                objLinkerDesc += (objLinkerDesc.length > 0 ? "," : "") + objLinkers[il];
                                linkeCol = Liquid.getLayoutLinkedFields(liquid, objLinkers[il]);
                                if(linkeCol) {
                                }
                            }
                            if(objLinkersTarget) {
                                if(objLinkersTarget[il] === 'className') {
                                    // solve className
                                    var expr = Liquid.solveExpressionFieldOnRow(objLinkers[il], null, liquid, iRow);
                                    if(expr) {
                                        try {
                                            expr = eval(expr);
                                        } catch (e) {
                                        }
                                        if(objLinkersTarget[il] === 'className') {
                                            obj.className = expr;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if(linkCount) {
                        if(linkeCol) {
                            obj.setAttribute('linkedField', linkeCol.field);
                            obj.setAttribute('linkedName', linkeCol.name);
                            obj.setAttribute('linkedRow1B', iRow + 1);
                            obj.onchange = function (event) {
                                Liquid.onLayoutFieldChange(event);
                            };
                            var linkedObj = obj;
                            var linkedObjReset = null;
                            var layoutIndex1B = Liquid.getLayoutIndex(liquid, layout.name);
                            var controlName = "col." + linkeCol.field + ".row." + (iRow + 1);
                            var newId = liquid.controlId + ".layout." + layoutIndex1B + "." + controlName;
                            var otherObj = null;
                            while ((otherObj = win.document.getElementById(newId)) !== null)
                                newId += ".copy";
                            obj.id = newId;
                            
                            obj.title = ""+linkeCol.name+"";
                            
                            // date
                            if(obj.nodeName.toUpperCase() === 'INPUT') {
                                
                                if(linkeCol.type === "6") {
                                    obj.type = 'datetime-local';
                                    obj.format = "MM"+Liquid.dateSep+"dd"+Liquid.dateSep+"MM"+Liquid.dateSep+"yyyy hh"+Liquid.timeSep+"mm"+Liquid.timeSep+"ss";
                                    obj.setAttribute("data-date-format", obj.format);
                                } else if(linkeCol.type === "91") {
                                    obj.type = 'date';
                                    obj.format = "MM"+Liquid.dateSep+"dd"+Liquid.dateSep+"MM"+Liquid.dateSep+"yyyy";
                                    obj.setAttribute("data-format", obj.format);
                                } else if(linkeCol.type === "93") {
                                    obj.type = 'datetime-local';
                                    obj.format = "MM"+Liquid.dateSep+"dd"+Liquid.dateSep+"MM"+Liquid.dateSep+"yyyy hh"+Liquid.timeSep+"mm"+Liquid.timeSep+"ss";
                                    obj.setAttribute("data-date-format", obj.format);
                                }
                                    
                                var timePicker = true;
                                var datePicker = false;
                                var closeOnDateSelect = true;
                                var format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'Y' + ' ' + 'H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                                var formatDate = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'Y';
                                var formatTime = 'H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                                if(obj.type === 'date') {
                                    obj.type = "text";
                                    timePicker = false;
                                    datePicker = true;
                                    format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'yy';
                                } else if(obj.type === 'datetime') {
                                    obj.type = "text";
                                    timePicker = false;
                                    datePicker = true;
                                } else if(obj.type === 'datetime-local') {
                                    obj.type = "text";
                                    datePicker = true;
                                }
                                
                                if(datePicker) {
                                    var controlName = '.xdsoft_datetimepicker';
                                    var timeFormat = 'H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                                    var dp = $(controlName);
                                    $(obj).datetimepicker({
                                         showAnim: "slideDown"
                                        ,step: 1
                                        ,format:format
                                        ,formatTime:formatTime
                                        ,formatDate:formatDate
                                        ,showSecond: true ,showMillisec: true
                                        ,stepHour: 1 ,stepMinute: 1 ,stepSecond: 1
                                        ,closeOnDateSelect:closeOnDateSelect
                                        ,showTimePicker: timePicker, timepicker: timePicker, timePickerSeconds: false ,timePickerIncrement: 1
                                        ,dayOfWeekStart: 1
                                        ,changeMonth: true ,changeYear: true
                                        ,beforeShow:function() { }
                                        ,onShow:function(o, $input, event) {
                                            var opt = { lang:Liquid.lang };
                                            $(controlName).datetimepicker("option", opt);
                                            $(controlName).css('z-index', 90000);
                                            //$().datetimepicker("value", obj.value);
                                            this.setOptions(opt);
                                            console.log($(controlName).css('z-index'));
                                        }
                                        ,onClose:function(o) { 
                                            console.log($(controlName).css('z-index'));
                                        }
                                    });
                                }
                            }
                            //
                            // Lookup ?
                            //
                            if(isDef(linkeCol.lookup)) {
                                if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'TEXTAREA') {
                                    var parentNode = obj.parentNode;
                                    var newObj = win.document.createElement("div");
                                    newObj.className = obj.className;
                                    newObj.style = obj.style;
                                    newObj.style.width = obj.offsetWidth + 'px';
                                    newObj.style.height = obj.offsetHeight + 'px';
                                    newObj.style.display = obj.style.display;
                                    newObj.style.position = obj.style.position;;
                                    newObj.style.overflow = "";
                                    newObj.style.left = obj.style.left;
                                    newObj.style.top = obj.style.top;
                                    newObj.id = obj.id;
                                    newObj.innertHTML = obj.value;
                                    newObj.style.padding = "0px";
                                    newObj.onchange = obj.onchange;
                                    obj.onchange = null;
                                    parentNode.removeChild(obj);
                                    delete obj;
                                    parentNode.appendChild(newObj);
                                    obj = newObj;
                                    obj.setAttribute('linkedField', linkeCol.field);
                                    obj.setAttribute('linkedName', linkeCol.name);
                                    obj.setAttribute('linkedRow1B', iRow + 1);
                                }
                                obj.setAttribute('linkedInputId', "pending");
                                var lookupLiquid = Liquid.startLookup(liquid.controlId, layout.name + "_" + controlName.replace(/\./g, "_"), obj, linkeCol.lookup, linkeCol.lookupField, linkeCol.options, 'layout', "column field \"" + linkeCol.name + "\"", win);
                                if(lookupLiquid) {
                                    obj.setAttribute('linkedInputId', lookupLiquid.linkedInputId);
                                    linkedObj = document.getElementById(lookupLiquid.linkedInputId);
                                    linkedObj.style.width = "calc(100% - 16px)";
                                    linkedObjReset = document.getElementById(lookupLiquid.linkedInputId + ".reset");
                                }
                            }
                            layout.rowsContainer[iRow].objs.push(linkedObj);
                            layout.rowsContainer[iRow].objsReset.push(linkedObjReset);
                            layout.rowsContainer[iRow].cols.push(linkeCol);
                            Liquid.appendDependency(liquid, linkeCol, {layoutName: layout.name, objId: obj.id, iRow: iRow});
                        }
                    }
                }
                var linkedField = obj.getAttribute('linkedField');
                var linkedName = obj.getAttribute('linkedName');
                var linkedRow1B = obj.getAttribute('linkedRow1B');
                var linkedInputId = obj.getAttribute('linkedInputId');
                if(linkedField) {
                    linkedRow1B = Number(linkedRow1B);
                    if(linkedRow1B === iRow + 1) {
                        var baseIndex1B = layout.baseIndex1B;
                        var disabled = false;
                        var nodes = null;
                        if(isDef(liquid.gridOptions)) {
                            if(isDef(liquid.gridOptions.api)) {
                                nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                            }
                        }
                        value = "[?]";
                        if(baseIndex1B > 0) {
                            if(baseIndex1B - 1 + iRow < liquid.nRows) {
                                value = nodes[baseIndex1B - 1 + iRow].data[linkedField];
                            } else if(Liquid.isAddingNode(liquid, baseIndex1B - 1 + iRow, nodes)) {
                                value = nodes[baseIndex1B - 1 + iRow].data[linkedField];
                            } else {
                                disabled = true;
                                value = "";
                            }
                        } else {
                            var isFormX = Liquid.isFormX(liquid);
                            var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                            if(isFormX || isAutoInsert) {
                                if(liquid.addingRow) {
                                    value = liquid.addingRow[linkedField];
                                } else {
                                    disabled = true;
                                    value = ".";
                                }
                            } else {
                                disabled = true;
                                value = "";
                            }
                        }
                        var targetObj = obj;
                        if(isDef(linkedInputId)) {
                            if(linkedInputId === 'pending') {
                                targetObj = null;
                            } else {
                                targetObj = win.document.getElementById(linkedInputId);
                                targetObj.style.border = '0px';
                                targetObj.style.backgroundColor = 'transparent';
                            }
                        }
                        if(targetObj) {
                            Liquid.setHTMLElementValue(targetObj, value, disabled);
                            if(typeof layout.firstObjId === 'undefined' || !layout.firstObjId) {
                                layout.firstObjId = targetObj.id;
                                targetObj.focus();
                            }
                        }
                    }
                } else {
                    if(bSetup) {
                        if(linkCount) {
                            try {
                                if(Liquid.debug)
                                    value = "[COLUMN '" + objLinkerDesc + "'NOT FOUND]";
                                if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'TEXTAREA') {
                                    obj.value = value;
                                } else if(obj.nodeName.toUpperCase() === 'DIV' || obj.nodeName.toUpperCase() === 'SPAN' || obj.nodeName.toUpperCase() === 'TD' || obj.nodeName.toUpperCase() === 'P') {
                                    obj.innerHTML = value;
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
            if(obj.childNodes) {
                for (var j = 0; j < obj.childNodes.length; j++) {
                    Liquid.setLayoutFields(liquid, layout, obj.childNodes[j], iRow, bSetup);
                }
            }
        }
    },
    getLayoutLinkedFields:function(liquid, key) {
        if(key) {
            var index = key.indexOf("@{");
            if(index>=0) {
                var subKey = key.substring(index+2);
                index = subKey.indexOf("}");
                if(index>=0) {
                    fieldKey = subKey.substring(0, index);
                    fieldKey = fieldKey.replace(/'/g, "").replace(/"/g, "");
                    var linkedCol = Liquid.getColumn(liquid, fieldKey);
                    return linkedCol;
                }
            }
        }
    },
    getLayoutIndex:function(liquid, layoutName) {
        if(liquid) {
            if(liquid.tableJson.layouts) {
                for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                    if(liquid.tableJson.layouts[il].name ===layoutName) return il+1;
                }
            }
        }
    },
    getNodeIndex:function(liquid, id) {
        if(liquid) {
            if(id) {
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                for(var iN=0; iN<nodes.length; iN++) {
                    if(nodes[iN].id === id) {
                        return iN+1;
                    }
                }
            }
        }
        return 0;
    },
    getNodeIndexByPrimaryKey:function(liquid, key) {
        var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
        if(isDef(nodes) && nodes.length > 0) {
            for(var ind = 0; ind < nodes.length; ind++) {
                var data = nodes[ind].data;
                var id = data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
                if(id) 
                    if(key === id) 
                        return ind+1;
            }
        }
        return 0;
    },
    onLayoutFieldChange:function(event) {
        if(event) {
            var liquid = Liquid.getLiquid(event.target);
            if(liquid) {
                var lay_coord = Liquid.getLayoutCoords(liquid, event.target);
                if(lay_coord.layout) {
                    var newValue = null;
                    var obj = event.target;                    
                    var linkedField = obj.getAttribute('linkedField');
                    var linkedName = obj.getAttribute('linkedName');
                    var linkedRow1B = obj.getAttribute('linkedRow1B');
                    if(linkedField !== null) {
                        if(linkedRow1B !== null) {
                            linkedRow1B = Number(linkedRow1B);
                            var col = liquid.tableJson.columns[Number(linkedField) - 1];
                            var firstNodeId = lay_coord.layout.firstNodeId;
                            var baseIndex1B = Liquid.getNodeIndex(liquid, firstNodeId);
                            var nodes = null;
                            if(isDef(liquid.gridOptions)) {
                                if(isDef(liquid.gridOptions.api)) {
                                    nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                }
                            }
                            obj = Liquid.getItemObjFromHTMLElement(obj);
                            var doUpdate = true;
                            if(obj.nodeName.toUpperCase()==='INPUT' || obj.nodeName.toUpperCase()==='TEXTAREA') {
                                if(obj.type === 'checkbox') {
                                    newValue = obj.checked ? true : false;
                                } else if(obj.type === 'file') {
                                    // look to column definition of control
                                    linkToFile = false;
                                    if(isDef(lay_coord.col)) {
                                        if(liquid.tableJson.columns) {
                                            if(lay_coord.col < liquid.tableJson.columns.length) {
                                                var col = liquid.tableJson.columns[lay_coord.col];
                                                if(col) {
                                                    if(isDef(col.link)) linkToFile = col.link;
                                                    if(isDef(col.fileLink)) linkToFile = col.fileLink;
                                                }
                                            }
                                        }
                                    }
                                    var isFormX = Liquid.isFormX(liquid);
                                    if(isFormX) {
                                        var queue = { liquid:liquid, obj:obj, targetObj:null, targetRow:liquid.addingRow, targetCol:col, files:obj.files, iFile:0, propName:null, propValue:null, linkToFile:linkToFile };
                                        // update by file content asyncromously
                                        var filesName = "", filesSize = "";
                                        for(var iF=0; iF<obj.files.length; iF++) {
                                            filesName += (filesName.length ? ",":"") + obj.files[iF].name;
                                            filesSize += (filesSize.length ? ",":"") + obj.files[iF].size;
                                        }
                                        obj.dataset.filesName = filesName;
                                        obj.dataset.filesSize = filesSize;
                                        var additionFileInfo = col.name+".filesName";
                                        liquid.addingRow[additionFileInfo] = filesName;
                                        additionFileInfo = col.name+".filesSize";
                                        liquid.addingRow[additionFileInfo] = filesSize;
                                        Liquid.formFilesToObjectExchange(queue);
                                        doUpdate = false;
                                    } else {
                                        console.error("ERROR:unsupported");
                                    }
                                } else {
                                    newValue = obj.value;
                                }                        
                            } else if(obj.nodeName.toUpperCase()==='DIV' || obj.nodeName.toUpperCase()==='SPAN' || obj.nodeName.toUpperCase()==='TD' || obj.nodeName.toUpperCase()==='P') {
                                newValue = obj.innerHTML;
                            }
                            if(doUpdate) {
                                var isFormX = Liquid.isFormX(liquid);
                                if(isFormX) {
                                    var validateResult = Liquid.validateField(liquid, col, newValue);
                                    if(validateResult !== null) {
                                        if(validateResult[0] >= 0) {
                                            newValue = validateResult[1];
                                            Liquid.registerFieldChange(liquid, liquid.addingNode ? liquid.addingNode.__objectId : null, liquid.addingRow[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], linkedField, null, newValue);
                                            Liquid.updateDependencies(liquid, col, null, event);
                                        }
                                    }
                                } else {
                                    if(baseIndex1B > 0) {
                                        var isddingNode = Liquid.isAddingNode(liquid, baseIndex1B-1+linkedRow1B-1, nodes);
                                        if(baseIndex1B-1+linkedRow1B-1 < liquid.nRows || isddingNode) {
                                            var data = nodes[baseIndex1B-1+linkedRow1B-1].data;                            
                                            if(baseIndex1B) {
                                                var validateResult = Liquid.validateField(liquid, col, newValue);
                                                if(validateResult !== null) {
                                                    if(validateResult[0] >= 0) {
                                                        newValue = validateResult[1];
                                                        Liquid.registerFieldChange(liquid, null, data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], linkedField, null, newValue);
                                                        Liquid.updateDependencies(liquid, col, null, event);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    // return 0 in non Input or TEXTAREA
    setHTMLElementValue:function(targetObj, value, disabled) {
        if(targetObj.nodeName.toUpperCase() === 'INPUT' || targetObj.nodeName.toUpperCase() === 'TEXTAREA') {
            targetObj.value = value; // "@"+linkedField + "<=>" + value;
            if(isDef(disabled)) targetObj.disabled = disabled;
            return 1;
        } else if(targetObj.nodeName.toUpperCase() === 'DIV' || targetObj.nodeName.toUpperCase() === 'SPAN' || targetObj.nodeName.toUpperCase() === 'TD' || targetObj.nodeName.toUpperCase() === 'P') {
            targetObj.innertHTML = value; // "@"+linkedField + "<=>" + value;
            targetObj.innerText = String(value);
            if(isDef(disabled)) targetObj.disabled = disabled;
            return 0;
        }
    },            
    loadDocumentsContent:function(liquid) {        
        if(isDef(liquid.tableJson.documents)) {
            for(var id=0; id<liquid.tableJson.documents.length; id++) {
                var doc = liquid.tableJson.documents[id];
                if(doc) {
                    if(doc.useIframe) {
                        doc.containerObj.onload = function(event) { Liquid.onDocumentFolderLoaded(event.target); };
                        var path = glLiquidServlet.substr(0, glLiquidServlet.lastIndexOf("/"));
                        doc.containerObj.src = path+"/iframes/documents.jsp?docName="+doc.name+"&controlId="+liquid.controlId;
                    }
                }
            }
        }
    },    
    onDocumentFolderLoaded:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var doc = Liquid.getDocument(liquid, obj);
            if(doc) {
                doc.pageLoaded = true; 
                Liquid.refreshDocuemnt(liquid, doc, true); 
            }
        }
    },
    getDocument:function(liquid, obj) {
        if(liquid && obj) {
            var nameItems = obj ? obj.id.split(".") : null;
            if(nameItems && nameItems.length > 2) {
                var index = nameItems[2] - 1;
                if(index < liquid.tableJson.charts.length)
                    return liquid.tableJson.documents[index];
            }
        }
        return null;
    },
    getDocumentByName:function(liquid, docName) {
        if(liquid && docName) {
            if(isDef(liquid.tableJson.documents)) {
                for(var id=0; id<liquid.tableJson.documents.length; id++) {
                    if(liquid.tableJson.documents[id].name === docName) {
                        return liquid.tableJson.documents[id];
                    }
                }
            }
        }
        return null;
    },
    refreshDocuments:function(liquid, param) {
        if(liquid) {
            if(isDef(liquid.tableJson.documents)) {
                for(var id=0; id<liquid.tableJson.documents.length; id++) {
                    var doc = liquid.tableJson.documents[id];
                    if(doc) {
                        Liquid.refreshDocuemnt(liquid, doc, param);
                    }
                }
            }
        }
    },
    refreshDocuemnt:function(liquid, doc, param) {
        if(liquid) {
            if(doc) {
                if(doc.pageLoaded === true) {
                    var curNodes = Liquid.getCurNodes(liquid);
                    if(doc.containerObj) {
                        var targetWindow = null;                        
                        try { targetWindow = doc.containerObj.contentWindow; } catch (e) { console.error("ERROR: unable to access to contentWindow at docuemnt folder:"+doc.name+", error:"+e); }
                        if(targetWindow) {
                            try {
                                targetWindow.glLiquidServlet = glLiquidServlet;
                                targetWindow.glDoc = doc;
                            } catch (e) { console.error("ERROR: unable to access global var at :"+doc.name+", error:"+e); }
                            if(typeof targetWindow.loadDocuments === 'function')
                                targetWindow.loadDocuments(liquid, doc, curNodes, null);
                        }
                    }
                }
            }
        }
    },
    onUploadDocument:function(controlId, e) {
        var liquid = Liquid.getLiquid(controlId);
        Liquid.onEvent(e.target, "onUploadDocument", {liquid: liquid, obj: e.target, command: null}, null);
    },
    onDownloadDocument:function(controlId, e) {
        var liquid = Liquid.getLiquid(controlId);
        Liquid.onEvent(e.target, "onDownloadDocument", {liquid: liquid, obj: e.target, command: null}, null);
    },
    onDeleteDocument:function(controlId, e) {
        var liquid = Liquid.getLiquid(controlId);
        Liquid.onEvent(e.target, "onDeleteDocument", {liquid: liquid, obj: e.target, command: null}, null);
    },
    onUpdateDocument:function(controlId, e) {
        var liquid = Liquid.getLiquid(controlId);
        Liquid.onEvent(e.target, "onUpdateDocument", {liquid: liquid, obj: e.target, command: null}, null);
    },
    loadChartsContent:function(liquid) {        
        if(isDef(liquid.tableJson.charts)) {
            for(var ic=0; ic<liquid.tableJson.charts.length; ic++) {
                var chart = liquid.tableJson.charts[ic];
                if(chart) {
                    if(chart.useIframe) {
                        chart.containerObj.onload = function(event) { Liquid.onChartFolderLoaded(event.target); };
                        var path = glLiquidServlet.substr(0, glLiquidServlet.lastIndexOf("/"));
                        chart.containerObj.src = path+"/iframes/charts.jsp?chartName="+chart.name+"&type="+chart.type+"&controlId="+liquid.controlId;
                    }
                }
            }
        }
    },
    onChartFolderLoaded:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var chart = Liquid.getChart(liquid, obj);
            if(chart) {
                chart.pageLoaded = true; 
                Liquid.refreshChart(liquid, chart, true); 
            }
        }
    },
    getChart:function(liquid, obj) {
        if(liquid && obj) {
            var nameItems = obj ? obj.id.split(".") : null;
            if(nameItems && nameItems.length > 2) {
                var index = nameItems[2] - 1;
                if(index < liquid.tableJson.charts.length)
                    return liquid.tableJson.charts[index];
            }
        }
        return null;
    },
    refreshCharts:function(liquid, param) {
        if(liquid) {
            if(isDef(liquid.tableJson.charts)) {
                for(var id=0; id<liquid.tableJson.charts.length; id++) {
                    var chart = liquid.tableJson.charts[id];
                    if(chart) {
                        Liquid.refreshChart(liquid, chart, param);
                    }
                }
            }
        }
    },
    refreshChart:function(liquid, chart, param) {
        if(liquid) {
            if(chart) {
                if(chart.pageLoaded === true) {
                    var curNodes = Liquid.getCurNodes(liquid);
                    if(chart.containerObj) {
                        var targetWindow = null;                        
                        try { targetWindow = chart.containerObj.contentWindow; } catch (e) { console.error("ERROR: unable to access to contentWindow at docuemnt folder:"+chart.name+", error:"+e); }
                        if(targetWindow) {
                            try {
                                targetWindow.glLiquidServlet = glLiquidServlet;
                                targetWindow.glChart = chart;
                            } catch (e) { console.error("ERROR: unable to access global var at :"+chart.name+", error:"+e); }
                            if(typeof targetWindow.loadChart === 'function')
                                targetWindow.loadChart(liquid, chart, curNodes, null);
                        }
                    }
                }
            }
        }
    },
    onPickDate:function(event, obj) {
        var liquid = Liquid.getLiquid(obj);
        var grid_coords = Liquid.getGridCoords(liquid, obj);
        var gridControl = null;
        var col = null;
        if(grid_coords) {
            gridControl = grid_coords.control;
            col = grid_coords.column;
        }
        Liquid.createDateTimePicker(col, obj, true, liquid, null);
    },
    createGridPickDate:function(liquid, obj) {
        var grid_coords = Liquid.getGridCoords(liquid, obj);
        var gridControl = null;
        var col = null;
        if(grid_coords) {
            gridControl = grid_coords.control;
            col = grid_coords.column;
        }
        Liquid.createDateTimePicker(col, obj, false, liquid, null);
    },
    createDateTimePicker:function(col, obj, bShow, liquid, params ) {
        var controlName = "";
        var type = 'datetimepicker';
        var value = obj ? obj.value : "";
        var formatDate = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'yy';
        var timeFormat = 'H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
        var format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'yy' + ' ' + timeFormat;
        var timePicker = true;
        var closeOnDateSelect = false;
        if(col) {
            if(col.type === "6") {
                type = 'datetimepicker';
                timePicker = false;
                closeOnDateSelect = true;
                format = formatDate;
            } else if(col.type === "91") {
                type = 'datetimepicker';
                timePicker = false;
                closeOnDateSelect = true;
                format = formatDate;
            } else if(col.type === "93") {
                type = 'datetimepicker';
                format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'Y H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                closeOnDateSelect = true;
            } else {
                if(params) {
                    if(params.type === 'date') {
                        // type = 'datepicker';
                        type = 'datetimepicker';
                        format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'Y H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                    } else if(params.type === 'date') {
                        type = 'datetimepicker';
                        format = 'd'+Liquid.dateSep+'m'+Liquid.dateSep+'Y H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                    } else {
                        return;
                    }
                }
            }
        }
        if(type === 'datetimepicker') {
            controlName = '.xdsoft_datetimepicker';
            var dp = $(controlName);
            $(obj).datetimepicker({
                 showAnim: "slideDown"
                ,step: 1
                ,format: format
                ,formatDate: formatDate
                ,formatTime: timeFormat
                ,showSecond: true, showMillisec: true
                ,stepHour: 1, stepMinute: 1, stepSecond: 1
                ,closeOnDateSelect:closeOnDateSelect
                ,showTimePicker: timePicker, timepicker: timePicker, timePickerSeconds: false, timePickerIncrement: 1
                ,dayOfWeekStart: 1
                ,changeMonth: true ,changeYear: true
                ,beforeShow:function() {}
                ,onShow:function(o, $input, event) {
                    var opt = {};
                    if(col !== null) opt = Liquid.setDatePickerOptions(this, col);
                    $(controlName).datetimepicker("option", opt);
                    $(controlName).css('z-index', 90000);
                    $().datetimepicker("value", value);
                    this.setOptions(opt);
                }
                ,onClose:function(o) { if(liquid) liquid.gridOptions.api.stopEditing(); }
            });
            if(bShow)
                $(obj).datetimepicker("show");
        } else {
            controlName = '.ui-datepicker';
            var dp = $(controlName);
            $(controlName).css('z-index', 90000);
            $(obj).datepicker().datepicker("option", {
                 showAnim: "slideDown"
                ,inline: true
                ,date: value
                ,dateFormat: (typeof format !== "undefined" && format ? format : 'dd'+Liquid.dateSep+'mm'+Liquid.dateSep+'yy')
                ,changeMonth: true ,changeYear: true
                ,beforeShow:function(o) {
                   var opt = {};
                   if(col !== null) opt = Liquid.setDatePickerOptions(this, col);
                   $(obj).datepicker("option", opt);
                   setTimeout(function(){ $(controlName).css('z-index', 90000); }, 10);
                }
                ,onShow:function(o, $input, event) { }
                ,onClose:function(o) { 
                    if(liquid) { 
                        liquid.gridOptions.api.stopEditing(); 
                        if(obj) obj.onchange(); 
                    } 
                }
                ,onSelect:function(date, inst) {
                }    
            });
            if(bShow)
                $(obj).datepicker("show");
        }
        return controlName;
    },
    setDatePickerOptions:function(datePicker, col) {
        var opt = {};
        if(col) {
            if(isDef(col.maxDate)) opt.maxDate = col.maxDate;
            if(isDef(col.maxTime)) opt.maxTime = col.maxTime;
            if(isDef(col.minDate)) opt.minDate = col.minDate;
            if(isDef(col.minTime)) opt.minTime = col.minTime;
            if(isDef(col.disabledDates)) opt.disabledDates = col.disabledDates;
            if(isDef(col.startDate)) opt.startDate = col.startDate;
            if(isDef(col.format)) opt.format = col.format;
            if(isDef(col.timeFormat)) opt.timeFormat = col.timeFormat;
            if(isDef(col.allowTimes)) opt.allowTimes = col.allowTimes;
            if(isDef(col.datepicker)) opt.datepicker = col.datepicker;
            if(isDef(col.showTimePicker)) opt.showTimePicker = col.showTimePicker;
            if(isDef(col.lang)) opt.lang = col.lang;
            if(isDef(col.showSecond)) opt.showSecond = col.showSecond;
            if(isDef(col.showMillisec)) opt.showMillisec = col.showMillisec;
            if(isDef(col.stepHour)) opt.stepHour = col.stepHour;
            if(isDef(col.stepMinute)) opt.stepMinute = col.stepMinute;
            if(isDef(col.stepSecond)) opt.stepSecond = col.stepSecond;
            if(isDef(col.dayOfWeekStart)) opt.dayOfWeekStart = col.dayOfWeekStart;
            if(isDef(col.changeMonth)) opt.changeMonth = col.changeMonth;
            if(isDef(col.changeYear)) opt.changeYear = col.changeYear;
            opt.lang = Liquid.lang;
        }
        return opt;
    },
    onPickRichField:function(event, obj) {
        var liquid = Liquid.getLiquid(obj);
        var grid_coords = Liquid.getGridCoords(liquid, obj);
        if(grid_coords) {
            var gridControl = grid_coords.control;
            var col = grid_coords.column;
            if(col) {
                if(gridControl.linkedObj.classList.contains("liquidGridControlRW")) {
                    if(!liquid.suneditorTextArea) {
                        liquid.suneditorDiv = document.createElement('div');
                        liquid.suneditorDiv.id = liquid.controlId + ".sunEditorGlobalContainer";
                        liquid.suneditorDiv.onclick = function(event) {
                            Liquid.onCloseRichField(obj);
                        };
                        liquid.suneditorDiv.className = "liquidRichEditorContainer";
                        liquid.suneditorDiv.style.zIndex = 51000;

                        liquid.suneditorCen = document.createElement('center');
                        liquid.suneditorDiv.appendChild(liquid.suneditorCen);

                        liquid.suneditorTextArea = document.createElement('textarea');
                        liquid.suneditorTextArea.id = "sunEditorGlobal";
                        liquid.suneditorTextArea.className = "liquidRichEditor";
                        liquid.suneditorCen.appendChild(liquid.suneditorTextArea);
                        document.body.appendChild(liquid.suneditorDiv);

                        var classStyle = getComputedStyle(document.querySelector('.liquidRichEditor'));
                        const controlWidth = classStyle.width.replace("px", "");
                        const controlHeight = classStyle.height.replace("px", "");
                        const controlbackgroundColor = classStyle.backgroundColor;

                        liquid.suneditor = window.SUNEDITOR.create((liquid.suneditorTextArea), {
                            showPathLabel: false, charCounter: true,
                            height: (typeof controlHeight !== 'undefined' ? controlHeight : '100%'),
                            width: (typeof controlWidth !== 'undefined' ? controlWidth : '100%'),
                            mode: "classic",
                            katex: "window.katex",
                            display: "block",
                            stickyToolbar: "-1",
                            backgroundColor: (typeof controlbackgroundColor !== 'undefined' ? controlbackgroundColor : 'transparent'),
                            buttonList: [
                                ['undo', 'redo', 'font', 'fontSize', 'formatBlock'],
                                ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'removeFormat'],
                                ['fontColor', 'hiliteColor', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'table'],
                                ['link', 'image', 'video', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save']
                            ],
                            callBackSave:function(content) {
                                Liquid.onSaveRichField(liquid, content);
                            }
                        });
                        var classStyle = document.querySelector('.sun-editor');
                        classStyle.style.backgroundColor = controlbackgroundColor;
                        var classStyle = document.querySelector('.se-container');
                        classStyle.style.height = 'auto';
                        classStyle.style.backgroundColor = controlbackgroundColor;
                        classStyle.addEventListener('click', e => e.stopPropagation() );
                        classStyle.style.boxShadow = "rgb(167, 167, 167) 5px 5px 7px 1px";
                    }
                    liquid.suneditorNodes = Liquid.getCurNodes(liquid);
                    liquid.suneditorGridControl = gridControl;
                    liquid.suneditorCol = col;
                    
                    liquid.suneditor.setContents(gridControl.linkedObj.innerHTML);
                    liquid.suneditorDiv.style.display = "";
                }
            }
        }
    },
    onCloseRichField:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var content = null;
            if(Liquid.isCodeEditor(liquid.suneditorCol)) {
                var div = document.createElement("div");
                div.innerHTML = liquid.suneditor.getContents();
                content = div.textContent || div.innerText || "";
                curContent = liquid.suneditorGridControl.linkedObj.innerText;
                delete div;
            } else {
                content = liquid.suneditor.getContents();
                curContent = liquid.suneditorGridControl.linkedObj.innerHTML;
            }            
            if(curContent !== content) {
                if(!confirm("Content was changed ... discharge it?")) {
                    return;
                }
            }
            liquid.suneditorDiv.style.display = "none";
        }
    },
    onSaveRichField:function(obj, content) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.suneditorDiv.style.display = "none";
            if(liquid.suneditorGridControl.linkedObj)
                liquid.suneditorGridControl.linkedObj.innerHTML = content;
            if(liquid.suneditorGridControl.colLink1B > 0) {
                var iCol = liquid.suneditorGridControl.colLink1B - 1;
                var col = liquid.tableJson.columns[iCol];
                if(col) {
                    // register modifications
                    if(typeof col.isReflected === 'undefined' || col.isReflected !== true) {
                        for(var iN = 0; iN < liquid.suneditorNodes.length; iN++) {
                            var validateResult = Liquid.validateField(liquid, col, content);
                            if(validateResult !== null) {
                                if(validateResult[0] >= 0) {                                    
                                    if(Liquid.isCodeEditor(col)) {
                                        var div = document.createElement("div");
                                        div.innerHTML = validateResult[1];
                                        content = div.textContent || div.innerText || "";
                                        delete div;
                                    } else {
                                        content = validateResult[1];
                                    }
                                    Liquid.registerFieldChange(liquid, null, liquid.suneditorNodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], col.field, null, content);
                                    Liquid.updateDependencies(liquid, col, null, null);
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    onResetFilter:function(obj_id) {
        var obj = document.getElementById(obj_id);
        if(obj)
            if(obj.value !== '')
                obj.value = '';
            else
                Liquid.onBtFilterExecute(obj);
    },
    onSearchControl:function(obj, columnName, targetName) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var datalistId = obj.id + ".datalist";
            var targetObj = document.getElementById(targetName);
            var datalist = document.getElementById(datalistId);
            if(!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = datalistId;
                document.body.appendChild(datalist);
            } else {
                datalist.innerHTML = '';
            }
            if(datalist) {
                var shortColumnName = columnName;
                var table = liquid.tableJson.table;
                var nameItems = columnName.split(".");
                if(nameItems.length > 1) {
                    table = nameItems[0];
                    shortColumnName = nameItems[1];
                }
                var params = {
                    showToast:true ,
                    rowIndex: null, iCol: null, column: columnName, node: null,
                    colDef: {
                        cellEditorParams: {liquid: liquid, cache: false, values: null, table: table, column: columnName, idColumn: columnName, editor: "distinct"}
                    }, headless: true
                };
                var selectEditor = new SelectEditor();
                selectEditor.init(params);
                if(selectEditor.cellEditorParams.values) {
                    for(var i=0; i<selectEditor.cellEditorParams.values.length; i++) {
                        var opt = document.createElement('option');
                        opt.text = selectEditor.cellEditorParams.values[i];
                        datalist.appendChild(opt);
                    }
                }
            }
            targetObj.setAttribute('list', datalistId);
            targetObj.focus();
            targetObj.click();
            targetObj.select();
        }
    },
    /**
     * Set the control's rows visible by primary ley list
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @param {ids} the list of primary keys
     * @return n/d
     */
    onSetPreFfilter:function(obj, ids) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var xhr = new XMLHttpRequest();
            try {
                xhr.open('POST', glLiquidServlet + '?operation=setPrefilter' + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : ""));
                xhr.send(ids);
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            try {
                                var httpResultJson = JSON.parse(xhr.responseText);
                                if(httpResultJson && httpResultJson.client) {
                                    var clientFunc = Liquid.getProperty(httpResultJson.client);
                                    if(clientFunc)
                                        clientFunc(liquid, httpResultJson);
                                }
                            } catch (e) {
                                console.error(xhr.responseText);
                            }
                            Liquid.loadData(liquid, null);
                        }
                    }
                };
            } catch (e) {
                console.error(e);
            }
        }
    },
    onGridTab:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.lastGridTabObj) {
                liquid.lastGridTabObj.parentNode.className = "";
                document.getElementById(liquid.lastGridTabObj.id + ".content").style.display = 'none';
            }
            liquid.lastGridTabObj = obj;
            liquid.lastGridTabObj.parentNode.className = "liquidTabSel";
            document.getElementById(liquid.lastGridTabObj.id + ".content").style.display = '';
        }
    },
    onLayoutTab:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.tableJson.layouts) {
                Liquid.onGridTab(obj);
                var lay_coords = Liquid.getLayoutCoords(liquid, obj);
                if(lay_coords) {
                    if(lay_coords.layout) {
                        if(lay_coords.layout.pendingLink) {
                            Liquid.refreshLayout(liquid, lay_coords.layout, true);
                            Liquid.onLayoutMode(lay_coords.layout.containerObj, "readonly");
                        }
                    }
                }
            }
        }
    },
    onDocumentTab:function(obj) {
        Liquid.onGridTab(obj);
    },
    onChartTab:function(obj) {
        Liquid.onGridTab(obj);
    },
    onLayoutMode:function(obj, mode) {
        var layIndex = -1;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nameItems = obj.id.split(".");
            if(nameItems.length > 2) {
                layIndex = nameItems[2] - 1;
                if(layIndex >= 0 && layIndex < liquid.tableJson.layouts.length) {
                    var layout = liquid.tableJson.layouts[layIndex];
                    if(layout.rowsContainer) {
                        for(var ir=0; ir<layout.nRows; ir++) {
                            for(var ic=0; ic<layout.rowsContainer[ir].objs.length; ic++) {
                                // Liquid.setLayoutFieldAsChanged(liquid, grid.columns[ic], false);
                                var itemObj = layout.rowsContainer[ir].objs[ic];
                                var itemResetObj = layout.rowsContainer[ir].objsReset[ic];
                                var col = layout.rowsContainer[ir].cols[ic];
                                if(itemObj) {
                                    if(mode === "write") {
                                        if(col.readonly !== true) {
                                            if(typeof col.foreignTable === 'undefined'
                                                    || !col.foreignTable
                                                    || col.foreignEdit === true
                                                    || col.foreignEdit === 'y'
                                                    || col.lookup !== 'undefined'
                                                    ) {
                                                itemObj.classList.remove('liquidGridControlRO');
                                                itemObj.classList.remove('liquidGridControlDel');
                                                itemObj.classList.add('liquidGridControlRW');
                                                try { itemObj.readOnly = false; } catch (e) { }
                                                try { itemObj.disabled = false; } catch (e) { }
                                                if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; }
                                                // try { itemObj.disabled = false; } catch (e) { }

                                            } else {
                                            }
                                        } else {
                                            itemObj.classList.remove('liquidGridControlRW');
                                            itemObj.classList.remove('liquidGridControlDel');
                                            itemObj.classList.add('liquidGridControlRO');
                                            try { itemObj.readOnly = true; } catch (e) { }
                                            try { itemObj.disabled = true; } catch (e) { }
                                            if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; }
                                            // try { itemObj.disabled = false; } catch (e) { }
                                        }
                                    } else {
                                        itemObj.classList.remove('liquidGridControlRW');
                                        itemObj.classList.add('liquidGridControlRO');
                                        try { itemObj.readOnly = true; } catch (e) { }
                                        try { itemObj.disabled = true; } catch (e) { }
                                        if(itemResetObj) { itemResetObj.disabled = true; itemResetObj.style.filter = 'grayscale(0.8)'; }
                                        // try { itemObj.disabled = true; } catch (e) { }
                                        if(mode === "delete") {
                                            itemObj.classList.add('liquidGridControlDel');
                                        } else {
                                            itemObj.classList.remove('liquidGridControlDel');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return layIndex;
    },
    onGridMode:function(obj, mode) {
        var gdIndex = -1;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nameItems = obj.id.split(".");
            if(nameItems.length > 2) {
                gdIndex = nameItems[2] - 1;
                if(gdIndex >= 0 && gdIndex < liquid.tableJson.grids.length) {
                    var grid = liquid.tableJson.grids[gdIndex];
                    for(var ic=0; ic<grid.columns.length; ic++) {
                        Liquid.setGridFieldAsChanged(liquid, grid.columns[ic], false);
                        var itemObj = Liquid.getItemObj(grid.columns[ic]);
                        var itemResetObj = Liquid.getItemResetObj(grid.columns[ic]);
                        var col = grid.columns[ic].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[ic].colLink1B - 1] : null;
                        if(itemObj) {
                            if(mode === "write") {
                                if(col.readonly !== true && grid.columns[ic].readonly !== true) {
                                    if(typeof col.foreignTable === 'undefined'
                                            || !col.foreignTable
                                            || col.foreignEdit === true
                                            || col.foreignEdit === 'y'
                                            || col.lookup !== 'undefined'
                                            ) {
                                        itemObj.classList.remove('liquidGridControlRO');
                                        itemObj.classList.remove('liquidGridControlDel');
                                        itemObj.classList.add('liquidGridControlRW');
                                        try { itemObj.readOnly = false; } catch (e) { }
                                        try { itemObj.disabled = false; } catch (e) { }
                                        if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; }
                                        // try { itemObj.style.pointerEvents = ""; }catch(e) {}
                                    } else {
                                    }
                                } else {
                                    itemObj.classList.remove('liquidGridControlRW');
                                    itemObj.classList.remove('liquidGridControlDel');
                                    itemObj.classList.add('liquidGridControlRO');
                                    try { itemObj.readOnly = true; } catch (e) { }
                                    try { itemObj.disabled = true; } catch (e) { }
                                    if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; }
                                    // try { itemObj.style.pointerEvents = "none"; }catch(e) {}
                                }
                            } else {
                                itemObj.classList.remove('liquidGridControlRW');
                                itemObj.classList.add('liquidGridControlRO');
                                try { itemObj.readOnly = true; } catch (e) { }
                                try { itemObj.disabled = true; } catch (e) { }
                                if(itemResetObj) { itemResetObj.disabled = true; itemResetObj.style.filter = 'grayscale(0.8)'; }
                                // try { itemObj.style.pointerEvents = "none"; }catch(e) {}
                                if(mode === "delete") {
                                    itemObj.classList.add('liquidGridControlDel');
                                } else {
                                    itemObj.classList.remove('liquidGridControlDel');
                                }
                            }
                        }
                    }
                }
            }
        }
        return gdIndex;
    },
    setGridFieldAsChanged:function(obj, gridColumn, bChanged) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var itemObj = Liquid.getItemObj(gridColumn);
            if(itemObj) {
                if(bChanged) {
                    var col = gridColumn.colLink1B > 0 ? liquid.tableJson.columns[gridColumn.colLink1B - 1] : null;
                    itemObj.classList.add('liquidGridControlMod');
                } else {
                    itemObj.classList.remove('liquidGridControlMod');
                }
            }
        }
    },
    refreshGrids:function(obj, data) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.tableJson.grids) {
                if(liquid.tableJson.grids.length > 0) {
                    for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                        Liquid.onGridRefresh(liquid, liquid.tableJson.grids[ig], data);
                    }
                }
            }
        }
    },
    onGridRefresh:function(liquid, grid, data) {
        if(grid) {
            if(grid.columns) {
                if(typeof data === 'undefined' || !data) {
                    var selNodes = Liquid.getCurNodes(liquid);
                    if(selNodes)
                        if(selNodes.length)
                            data = selNodes[0].data;
                }
                for(var ic=0; ic<grid.columns.length; ic++) {
                    if(grid.columns[ic].linkedObj) {
                        Liquid.onGridRefreshField(liquid, grid, grid.columns[ic], data);
                    }
                }
            }
        }
    },
    onGridRefreshField:function(liquid, grid, gridObj, data) {
        if(liquid) {
            if(gridObj.colLink1B > 0) {
                var itemObj = Liquid.getItemObj(gridObj);
                var iCol = gridObj.colLink1B - 1;
                var value = "";
                if(data) {
                    if(Liquid.isDate(liquid.tableJson.columns[iCol].type)) {
                        value = data[liquid.tableJson.columns[iCol].field];
                    } else {
                        value = data[liquid.tableJson.columns[iCol].field];
                    }
                }
                if(itemObj.nodeName === 'DIV') {
                    itemObj.innerHTML = value;
                } else if(itemObj.nodeName === 'INPUT') {
                    itemObj.value = value;
                } else {
                    console.error("Unknown control type : " + itemObj.nodeName);
                    itemObj.innerHTML = value;
                }
            }
        }
    },
    onGridContainerSizeChanged:function(obj, params) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.outDivObj) {
                var gridWidth = liquid.outDivObj.offsetWidth;
                var columnsToShow = [];
                var columnsToHide = [];
                var totalColsWidth = 0;
                if(isDef(liquid.gridOptions)) {
                    if(isDef(liquid.gridOptions.api)) {
                        var allColumns = params.columnApi.getAllColumns();
                        if(allColumns && allColumns.length) {
                            for(var i = 0; i < allColumns.length; i++) {
                                var column = allColumns[i];
                                if(totalColsWidth > gridWidth) {
                                    columnsToHide.push(column.colId);
                                } else {
                                    columnsToShow.push(column.colId);
                                }
                                totalColsWidth += column.actualWidth;
                            }
                            // params.columnApi.setColumnsVisible(columnsToShow, true);
                            // params.columnApi.setColumnsVisible(columnsToHide, false);
                            if(liquid.tableJson.autoSizeColumns === true) {
                                params.api.sizeColumnsToFit();
                            } else {
                                var lastCol = columnsToShow[columnsToShow.length-1];
                                var width = null;
                                var colIndex = Number(lastCol)-1;
                                if(colIndex>=0 && colIndex<liquid.tableJson.columns.length) {
                                    width = Number(typeof liquid.tableJson.columns[colIndex].width !== 'undefined' ? liquid.tableJson.columns[colIndex].width : 0);
                                }
                                if(totalColsWidth < gridWidth) {
                                    if(isDef(width) && width > 0) {
                                    } else {
                                        params.columnApi.setColumnWidth(lastCol, (gridWidth-totalColsWidth+allColumns[allColumns.length-1].actualWidth-17), finished=true);
                                    }
                                } else {
                                    var newSize = gridWidth - (totalColsWidth - width);
                                    if(isDef(width) && width >= 0) {
                                    } else {
                                        if(newSize > 0) 
                                            params.columnApi.setColumnWidth(lastCol, (newSize), finished=true);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    refreshLinkedLiquids:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        var liquidRoot = liquid;
        if(liquid) {
            var liquidsToRefresh = [];
            if(liquid.linkedLiquids) {
                for(var i=0; i<liquid.linkedLiquids.length; i++) {
                    if(liquid.linkedLiquids[i]) {
                        Liquid.loadData(liquid.linkedLiquids[i], null);
                        liquid.linkedLiquids[i].lastRowClickedNode = null;
                        var liquidToRefresh = liquid.linkedLiquids[i];
                        if(liquidToRefresh) {
                            liquidsToRefresh.push(liquidToRefresh);
                            liquidRoot = liquidToRefresh;
                            while(liquidToRefresh && liquidToRefresh.srcLiquidControlId) {
                                liquidRoot = liquidToRefresh = liquidToRefresh.srcLiquid;
                            }
                        }
                    }
                }
            }
        }        
        for(var i=0; i<liquidsToRefresh.length; i++) {
            var curNodes = Liquid.getCurNodes(liquidsToRefresh[i]);
            Liquid.updateSelectionData(liquidsToRefresh[i]);
            Liquid.refreshGrids(liquidsToRefresh[i], curNodes && curNodes.length ? curNodes[0].data : '');
            Liquid.refreshLayouts(liquidsToRefresh[i], false);
            Liquid.refreshDocuments(liquidsToRefresh[i], false);
            Liquid.refreshCharts(liquidsToRefresh[i], false);
        }
        Liquid.onForeignTablesMode(liquidRoot);
    },
    setAutoresizeColumn:function(liquid, processChildren) {
        if(liquid) {
            if(liquid.aggridContainerObj) {
                if(liquid.aggridContainerObj.offsetWidth === 0 || liquid.aggridContainerObj.offsetHeight === 0) return;
                if(liquid.tableJson.autoSizeColumns === true) {
                    liquid.gridOptions.suppressColumnVirtualisation=true;
                    liquid.gridOptions.api.sizeColumnsToFit();
                } else if(liquid.tableJson.autoFitColumns === true || liquid.mode === 'auto') {
                    var allColumnIds = [];
                    liquid.gridOptions.suppressColumnVirtualisation=true;
                    liquid.gridOptions.columnApi.getAllColumns().forEach(function(column) { allColumnIds.push(column.colId); });
                    liquid.gridOptions.columnApi.autoSizeColumns(allColumnIds, true);
                } else {
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {   
                        if(liquid.tableJson.columns[ic].autoSize === true || liquid.tableJson.autoFitColumns === true || liquid.mode === 'auto') {
                            liquid.gridOptions.columnApi.autoSizeColumns([liquid.tableJson.columns[ic].field], true);
                        }                            
                    }
                }
                if(processChildren) {
                    if(liquid.linkedLiquids)
                        for(var i=0; i<liquid.linkedLiquids.length; i++)
                            Liquid.setAutoresizeColumn(liquid.linkedLiquids[i], true);
                }
            }
        }
    },
    updateStatusBar:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.navObj) {
                try {
                    document.getElementById(liquid.controlId + ".cRow").innerHTML = liquid.cRow + 1 + (liquid.pageSize > 0 ? liquid.cPage * liquid.pageSize : 0);
                    document.getElementById(liquid.controlId + ".nRows").innerHTML = liquid.nRows;
                } catch(e) {}
                try {
                    document.getElementById(liquid.controlId + ".cPage").value = liquid.cPage + 1;
                    document.getElementById(liquid.controlId + ".cPage").max = liquid.nPages;
                    document.getElementById(liquid.controlId + ".nPages").innerHTML = liquid.nPages;
                } catch(e) {}                
                if(liquid.cPage+1 === liquid.nPages) {
                    try {
                        with(document.getElementById(liquid.controlId + ".next"))
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                        with(document.getElementById(liquid.controlId + ".last"))
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    } catch(e) {}
                } else {
                    try {
                        with(document.getElementById(liquid.controlId + ".next"))
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                        with(document.getElementById(liquid.controlId + ".last"))
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    } catch(e) {}
                }
                if(liquid.cPage === 0) {
                    try {
                        with(document.getElementById(liquid.controlId + ".prev"))
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                        with(document.getElementById(liquid.controlId + ".first"))
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    } catch(e) {}
                } else {
                    try {
                        with(document.getElementById(liquid.controlId + ".prev"))
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                        with(document.getElementById(liquid.controlId + ".first"))
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    } catch(e) {}
                }
            }
        }
    },
    isAddingNode:function(liquid, rowIndex, nodes) {
        if(rowIndex === liquid.nRows) {
            if(rowIndex < nodes.length) {
                if(liquid.addingNode) {
                    if(liquid.addingNode.id === nodes[rowIndex].id) {
                        return true;
                    }
                }
            }
        }
    },
    isNumeric:function(type) {
        if(type === "3" || type === "4" || type === "7" || type === "8"  || type === "-5" || type === "-6" || type === "-7")
            return true;
        else
            return false;
    },
    isInteger:function(type) {
        if(type === "2" || type === "4" || type === "5" || type === "-5" || type === "-6" || type === "-7")
            return true;
        else
            return false;
    },    
    isFloat:function(type) {
        if(type === "7" || type === "8")
            return true;
        else
            return false;
    },
    isDate:function(type) {
        if(type === "6" || type === "91" || type === "92" || type === "93")
            return true;
        else
            return false;
    },
    getTypeName:function(type) {
        if(type === "6") {
            return "Date";
        } else if(type === "91") {
            return "Date";
        } else if(type === "92") {
            return "Time";
        } else if(type === "93") {
            return "Timestamp";
        } else if(type === "3") {
            return "Decimal";
        } else if(type === "7") {
            return "Float";
        } else if(type === "8") {
            return "Double";
        } else if(type === "2" || type === "4" || type === "-5" || type === "-6" || type === "5") {
            return "Integer";
        } else if(type === "-7") {
            return "Bit";
        } else if(type === "-15" || type === "-16") {
            return "varchar";
        } else if(type === "1" || type === "12" || type === "-1" || type === "-9"  || type === "-16" || type === "-150") {
            return "varchar";
        } else if(type === "-2" || type === "-3" || type === "-4") {
            return "Blob";
        } else if(type === "-155") {
            return "DatatimeOffset";
        } else if(type === "1111") {
            return "Geometry";
        } else {
            return "unknown:"+type;
        }
    },
    bytesToSize:function(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if(bytes === 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },
    onHomeTooltip:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var tooltip = "no modification on "+liquid.tableJson.table;
            if(liquid.modifications) {
                tooltip = "N.modification on "+liquid.tableJson.table+" : "+liquid.modifications.length+"\r\n";
                for(var r = 0; r < liquid.modifications.length; r++) {
                    for(var c = 0; c < liquid.modifications[r].fields.length; c++) {
                        var column = Liquid.getColumn(liquid, liquid.modifications[r].fields[c].field);
                        tooltip += " row:" + liquid.modifications[r].rowId + " field:" + (typeof column !== 'undefined'?column.name:liquid.modifications[r].fields[c].name) + "\n"; // + " value:" + liquid.modifications[r].fields[c].value;
                    }
                }
            }
        }
        return tooltip;
    },
    setTooltip:function(objId, tooltipFunc) {
        if(objId) {
            var obj = document.getElementById(objId);
            obj.setAttribute('tooltip', tooltipFunc);
            obj.addEventListener("mouseover", function(event) {
                this.titleShowTimeout = setTimeout(function() {
                    obj.title = eval(obj.getAttribute('tooltip'),obj);
                }, 100);
            });
            obj.addEventListener("mouseout", function() {
                clearTimeout(this.titleShowTimeout);
            });
        }
    },
    dbtoHtmlDate:function(date) {
        return Liquid.dbtoHtmlDateFunc(date,'-', Liquid.dateSep);
    },
    dbtoHtmlDateFunc:function(date, in_sep, out_sep) {
        try {
            if(isDef(date)) {
                var dateArray = date.split(' ');
                var year = dateArray[0].split(in_sep);
                var time = dateArray.length > 1 && dateArray[1] ? dateArray[1].split(':') : null;
                return year[2] + out_sep + year[1] + out_sep + year[0] + (time ? " " + time[0] + ":" + time[1] + ":" + time[2] : "");
            } else {
                return null;
            }
        } catch(e) { }
        return date;
    },
    htmlToDbDate:function(date) {
        return Liquid.dbtoHtmlDateFunc(date, Liquid.dateSep, "-");
    },
    toDate:function(dateStr) {
        var parts = dateStr.split("-");
        return new Date(parts[2], parts[1] - 1, parts[0]);
    },
    createNewRowData:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var newData = {};
            for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                var col = liquid.tableJson.columns[ic];
                Liquid.solveExpressionField(col, "default", liquid);
                newData[col.field] = (typeof col.default !== "undefined" ? col.default : "");
                // Verify column referenced in parent
                if(liquid.srcLiquid) {
                    if(liquid.srcForeignColumn.toLowerCase() === col.name.toLowerCase()) {
                        if(liquid.srcColumnObj) {
                            var selNodes = Liquid.getCurNodes(liquid.srcLiquid);
                            if(selNodes) {
                                if(selNodes.length) {
                                    var data = selNodes[0].data;
                                    newData[col.field] = data[liquid.srcColumnObj.field];
                                }
                            }
                        }
                    }
                }
            }
            return newData;
        }
    },
    addRow:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.cRowBeforeAdding = liquid.cRow;
            liquid.nodesBeforeAdding = Liquid.getCurNodes(liquid);
            liquid.addingRow = Liquid.createNewRowData(liquid);
        }
    },
    getAddingRowAsString:function(obj, data) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(data))
            	if(data instanceof Array) 
                    return data.join(",");
            	else if(typeof data === 'object') 
                    return JSON.stringify(data);
        }
        return "";
    },
    onPreparedRow:function(obj, bRegisterModify) {
        var retVal = true;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.addingNode === null || typeof liquid.addingNode === 'undefined') { // if not already done
                var res = liquid.gridOptions.api.updateRowData({add: [liquid.addingRow]});
                if(res) {
                    if(liquid.gridOptions) {
                        if(liquid.gridOptions.api) {
                            try {
                                liquid.addingNode = res.add[0];
                                liquid.gridOptions.api.deselectAll();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                    var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    if(isDef(nodes) && nodes.length > 0) {
                        nodes[nodes.length - 1].setSelected(true);
                        liquid.gridOptions.api.ensureIndexVisible(nodes[nodes.length - 1].rowIndex, "bottom");
                        // register modifications
                        for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                            var col = liquid.tableJson.columns[ic];
                            if(col.isReflected !== true) {
                                var validateResult = Liquid.validateField(liquid, col, liquid.addingRow[col.field]);
                                if(validateResult !== null) {
                                    if(validateResult[0] >= 0) {
                                        liquid.addingRow[col.field] = validateResult[1];
                                        if(bRegisterModify !== false)
                                            Liquid.registerFieldChange(liquid, liquid.addingNode ? liquid.addingNode.__objectId : null, liquid.addingRow[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], col.field, null, liquid.addingRow[col.field]);
                                        Liquid.updateDependencies(liquid, col, null, null);
                                    } else { // break here
                                        retVal = false;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return retVal;
    },
    onPreparedDelete:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            for(var ir = 0; ir < liquid.deletingNodes.length; ir++) {
                var node = liquid.deletingNodes[ir];
                Liquid.registerFieldChange(liquid, null, node.data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], null, null, null);
            }
        }
    },
    onDeletedRow:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.deletingNodes) {
                var dataList = [];
                var rowIndex = null;
                for(var ir = 0; ir < liquid.deletingNodes.length; ir++) {
                    dataList.push(liquid.deletingNodes[ir].data);
                    rowIndex = liquid.deletingNodes[ir].rowIndex-1;
                }
                var res = liquid.gridOptions.api.updateRowData({remove: dataList});                
                liquid.deletingNodes = null;
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                if(isDef(nodes) && nodes.length > 0) {
                    var bFound = false;
                    for(var i=0; i<nodes.length; i++) {
                        if(nodes[i].rowIndex === rowIndex) {
                            bFound = true;
                            nodes[i].setSelected(true);
                            break;
                        }
                    }
                    if(!bFound) nodes[nodes.length-1].setSelected(true);                        
                }
            }
        }
    },
    getSelectedNodes:function(obj) {
        var selNodes = null;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(liquid.gridOptions)) {
                if(isDef(liquid.gridOptions.api)) {
                    selNodes = liquid.gridOptions.api.getSelectedNodes();
                }
            }
        }
        return selNodes;
    },
    getCurNodes:function(obj) {
        var selNodes = null;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(liquid.gridOptions)) {
                if(isDef(liquid.gridOptions.api)) {
                    selNodes = liquid.gridOptions.api.getSelectedNodes();
                    if(!selNodes || selNodes.length === 0) {
                        if(!liquid.tableJson.requireSelected) {
                            if(liquid.lastRowClickedNode) {
                                selNodes = [liquid.lastRowClickedNode];
                            }
                        }
                    }
                }
            }
        }
        return selNodes;
    },
    findSelectAll:function(rootObj) {
        if(rootObj) {       
            if(rootObj.childNodes) {
                var nodes = rootObj.childNodes;
                for (var i=0; i<nodes.length; i++) {
                    if(nodes[i].classList) if(nodes[i].classList.contains("ag-header-select-all")) return nodes[i];
                    if(nodes[i].childNodes) {
                        var selectAll = Liquid.findSelectAll(nodes[i]);
                        if(selectAll) return selectAll;
                    }
                }
            }
        }
    },    
    onSelectAll:function(obj, event) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(event.target.classList.contains("ag-icon-checkbox-unchecked") || event.target.classList.contains("ag-icon-checkbox-indeterminate")) {
                liquid.selection.all = true;
                liquid.selection.exclude = [];
                liquid.selection.include = [];
            } else {
                liquid.selection.all = false;
                liquid.selection.exclude = [];
                liquid.selection.include = [];
            }
        }
    },
    processNodeSelected:function(liquid, node, bSelected) {
        if(liquid) {
            var id = node.data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
            if(liquid.selection.all) {
                if(bSelected) {
                    var index = liquid.selection.exclude.indexOf(id);
                    if(index >= 0) liquid.selection.exclude.splice(index, 1);
                } else {                    
                    var index = liquid.selection.exclude.indexOf(id);
                    if(index < 0) liquid.selection.exclude.push(id);
                }
            } else {
                if(bSelected) {
                    var index = liquid.selection.include.indexOf(id);
                    if(index < 0) liquid.selection.include.push(id);
                } else {                    
                    var index = liquid.selection.include.indexOf(id);
                    if(index >= 0) liquid.selection.include.splice(index, 1);
                }
            }
            // console.debug( " SELECTION : ALL:"+liquid.selection.all+" - INCLUDE:"+liquid.selection.include + " - EXCLUDE:"+liquid.selection.exclude );
        }
    },
    resumeNodeSelected:function(liquid) {
        if(liquid) {
            nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
            for(var i=0; i<nodes.length; i++) {
                var id = nodes[i].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
                if(liquid.selection.all) {
                    var index = liquid.selection.exclude.indexOf(id);
                    if(index < 0) nodes[i].setSelected(true);
                } else {                    
                    var index = liquid.selection.include.indexOf(id);
                    if(index >= 0) nodes[i].setSelected(true);
                }
            }
            // console.debug( " SELECTION : ALL:"+liquid.selection.all+" - INCLUDE:"+liquid.selection.include + " - EXCLUDE:"+liquid.selection.exclude );
        }
    },
    startNavigatorsBar:function( obj_id ) { // Entry adding navigation bar to obj_id html element
        if(obj_id) {
            glNavigations.push(obj_id);
        }
    },
    createNavigatorsBar:function() {
        if(glNavigations) {
            for(var i=0; i<glNavigations.length; i++) {
                var obj = document.getElementById(glNavigations[i]);
                if(obj) {
                    Liquid.createNavigationBar(obj);
                }
            }
        }
    },
    createNavigationBar:function(obj) {
        if(obj) {
            var navigationsObj = document.createElement("div");
            navigationsObj.className = "liquidNavigatiorBar";
            navigationsObj.style.display = "inline-flex";
            navigationsObj.id = "Liquid.navigations";
            var navigationsSpacerObj = document.createElement("div");
            navigationsSpacerObj.className = "liquidNavigatiorBarSpacer";
            navigationsSpacerObj.style.width = "20px";
            navigationsSpacerObj.style.display = "";
            navigationsObj.appendChild(navigationsSpacerObj);
            if(glLiquids) {
                if(glLiquids.length > 0) {
                    for(var i=0; i<glLiquids.length; i++) {
                        if(glLiquids[i]) {
                            if(glLiquids[i].mode==='' || glLiquids[i].mode==='popup' || glLiquids[i].mode==='winX' || glLiquids[i].mode==='WinX') {
                                if(typeof glLiquids[i].isSystem === 'undefined' && typeof glLiquids[i].tableJson.isSystem === 'undefined') {
                                    if(isDef(glLiquids[i].controlId)) {
                                        var name = (typeof glLiquids[i].tableJson.name !== 'undefined' ? glLiquids[i].tableJson.name : (typeof glLiquids[i].tableJson.caption !== 'undefined' ? glLiquids[i].tableJson.caption : glLiquids[i].table) );
                                        var navigation = { text:name, name:name, server:"", client:"Liquid.setFocus(this)", navigator:true };
                                        var navigationObj = Liquid.createCommandButton(glLiquids[i], navigation, navigationsObj.className);
                                        navigationsObj.appendChild(navigationObj);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            obj.innerHTML = '';
            obj.appendChild(navigationsObj);
        }
    },
    showServerMessage: function (message, title, buttons, timeout, timeoutButton, cypher) {
        var icon = null;
        var buttonList = [];
        var ibuttons = Number(buttons);
        var curMessageInfo = {message: message, title: title, buttons: buttons, timeout: timeout, timeoutButton: timeoutButton, cypher: cypher, timeoutID: null, intervalID: null};
        if(ibuttons & 1) buttonList.push({text: "Ok", click: function () { Liquid.onServerMessageButton(1, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 2) buttonList.push({text: ( Liquid.lang === 'eng' ? "Cancel" : "Annulla" ), click: function () { Liquid.onServerMessageButton(2, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 4)buttonList.push({text: ( Liquid.lang === 'eng' ? "Yes" : "Si" ), click: function () { Liquid.onServerMessageButton(4, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 8)buttonList.push({text: "No", click: function () { Liquid.onServerMessageButton(8, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 16) buttonList.push({text: ( Liquid.lang === 'eng' ? "Ignore" : "Ignora" ), click: function () { Liquid.onServerMessageButton(16, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 32) buttonList.push({text: ( Liquid.lang === 'eng' ? "Abort" : "Termina" ), click: function () { Liquid.onServerMessageButton(32, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 64) buttonList.push({text: ( Liquid.lang === 'eng' ? "Retry" : "Riprova" ), click: function () { Liquid.onServerMessageButton(64, curMessageInfo); Liquid.curMessageInfo = null; Liquid.curMessageDlg.dialog("close"); }});
        if(ibuttons & 128) icon = Liquid.getImagePath("question.png");
        if(ibuttons & 256) icon = Liquid.getImagePath("error.png");
        if(ibuttons & 512) icon = Liquid.getImagePath("warning.png");
        if(ibuttons & 1024) icon = Liquid.getImagePath("info.png");
        if(ibuttons & 2048) icon = Liquid.getImagePath("debug.png");
        if(ibuttons & 4096) if(timeout <= 0) timeout = 30;
        if(timeout && Number(timeout) > 0) {
            curMessageInfo.timeoutID = setTimeout( function () { 
                if(curMessageInfo) Liquid.onServerMessageButton(curMessageInfo.timeoutButton, curMessageInfo); 
                Liquid.curMessageDlg.dialog( "close" ); 
            }, timeout * 1000.0 );
            curMessageInfo.intervalID = setInterval( function () { 
                if(curMessageInfo) Liquid.onServerMessageCaptionRefresh(curMessageInfo); 
            }, 1000.0 );
        }
        Liquid.curMessageInfo = curMessageInfo;
        Liquid.dialogBoxButtons(null, title, message, buttonList, icon);
    },
    onServerMessageButton(buttonId, curMessageInfo) {
        Liquid.setServerMessageResponse(buttonId, curMessageInfo);
    },
    onServerMessageCaptionRefresh:function(curMessageInfo) {
        if(curMessageInfo) {
            var captionSpan = document.getElementById("ui-id-1");
            if(captionSpan) {
                curMessageInfo.timeout -= 1.0;
                var title = curMessageInfo.title + " - [ "+curMessageInfo.timeout+" sec ]";
                captionSpan.innerText = title;
            }
        }
    },
    setServerMessageResponse:function(response, curMessageInfo) {
        if(curMessageInfo) {
            if(curMessageInfo.timeoutID) clearTimeout(curMessageInfo.timeoutID);
            curMessageInfo.timeoutID = null;
            if(curMessageInfo.intervalID) clearInterval(curMessageInfo.intervalID);
            curMessageInfo.intervalID = null;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', glLiquidServlet + '?operation=setMessageResponse'
                    +'&jSON=' + encodeURIComponent( JSON.stringify( { response:(typeof response !== 'undefined' ? response : ""), cypher:curMessageInfo.cypher } ) )
                    );
            xhr.send();
        }
    },    
    dialogBox:function(parentObj, title, message, onOk, onCancel) {
        var buttons = [ ];
        if(onOk) buttons.push( { text:onOk.text, click:function() { onOk.func(); $( this ).dialog( "close" ); } } );
        if(onCancel) buttons.push( { text:onCancel.text, click:function() { onCancel.func(); $( this ).dialog( "close" ); } } );
        var icon = "";
        if(title.indexOf("QUESTION")>=0) icon = Liquid.getImagePath("question.png");
        if(title.indexOf("ERROR")>=0) icon = Liquid.getImagePath("error.png");
        if(title.indexOf("WARNING")>=0) icon = Liquid.getImagePath("warning.png");
        if(title.indexOf("INFO")>=0) icon = Liquid.getImagePath("info.png");
        if(title.indexOf("DEBUG")>=0) icon = Liquid.getImagePath("debug.png");
        return Liquid.dialogBoxButtons(parentObj, title, message, buttons, icon);
    },
    /**
     * Show a message by a dialog box
     * @param {parentObj} the id of the html element parent
     * @param {title} the title of dialog box
     * @param {message} the message of dialog box
     * @param {onOk} the callback called when ok button was pressed
     * @param {onCancel} the callback called when cancel button was pressed
     * @return n/d
     */
    dialogBoxButtons:function(parentObj, title, message, buttons, icon) {
        if(Liquid.curMessageBusy) {
            var curMessageInfo = {parentObj:parentObj, message: message, title: title, buttons: buttons};
            Liquid.dialogBoxAddToStack(curMessageInfo);
            return;
        }
        Liquid.curMessageBusy = true;
        var dialogConfirm = document.getElementById("dialog-box");
        if(!dialogConfirm) {
            dialogConfirm = document.createElement('div');
            dialogConfirm.id = "dialog-box";
            dialogConfirm.style.zIndex = 99000;
            dialogConfirm.style.display = "none";
            if(parentObj) parentObj.appendChild(dialogConfirm);
            else document.body.appendChild(dialogConfirm);
            dialogConfirm.innerHTML = ""
                    + "<p><span id=\"ui-icon-1\" class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:12px 12px 20px 0;\"></span>"
                    + "<span id=\"dialog-box-text\"></span></p>"
                    + "";
        }
        dialogConfirm.title = title;
        var captionSpan = document.querySelector(".ui-dialog-title");
        if(captionSpan) captionSpan.innerText = title;
        var curIcon = typeof icon !== 'undefined' && icon ? icon : null;
        var icopnSpan = document.getElementById("ui-icon-1");
        if(curIcon) {
            // My icon
            if(icopnSpan) {
                icopnSpan.id = "ui-icon-1";
                icopnSpan.innerHTML = "<img src=\""+curIcon+"\" width=\"32\" height=\"32\" />";
                icopnSpan.style.margin = "2px 12px 20px 0";
                icopnSpan.className = "";
            }
        } else {
            // By jquery
            if(icopnSpan) {
                icopnSpan.innerHTML = "";
                icopnSpan.className = "ui-icon ui-icon-alert";
            }
        }
        var dialogConfirmText = document.getElementById("dialog-box-text");
        dialogConfirmText.innerHTML = message;
        Liquid.curMessageDlg = $( "#dialog-box" ).dialog({
            resizable: false,
            height: "auto",
            width: "auto",
            modal: true,
            buttons: buttons,
        });
        $( "#dialog-box" ).on('dialogclose', function(event) {
            Liquid.curMessageDlg = null;
            Liquid.curMessageBusy = false;
            if(Liquid.curMessageInfo) {
                Liquid.onServerMessageButton(-1, Liquid.curMessageInfo);
                Liquid.curMessageInfo = null;
            }
            setTimeout( function(){ 
                Liquid.dialogBoxDequeue();
            }, (Liquid.curMessageDealyTimeSec > 0 ? Liquid.curMessageDealyTimeSec*1000:1000) );
        });
        // $('#dialog-box').dialog('option', 'position', 'center');
        // $('#dialog-box').parent().position({my:'center',of:'center',collison:'fit'});
        var objDlg = $('#dialog-box').parent();
        var clientHeight = objDlg.outerHeight();
        var clientWidth = objDlg.outerWidth();
        var winHeight = window.innerHeight;
        var winWidth = window.innerWidth;
        var top = (0 + winHeight/2.0 - (clientHeight > 0 ? clientHeight:0)/2);
        var left = (0 + winWidth/2.0 - (clientWidth > 0 ? clientWidth:0)/2);
        objDlg.css('position', 'fixed');
        objDlg.css('top', top);
        objDlg.css('left', left);
        
    },
    dialogBoxAddToStack(messageInfo) {
        glMessageInfoList.push(messageInfo);
    },
    dialogBoxDequeue() {
        for(var iq=0; iq<glMessageInfoList.length; iq++) {
            var messageInfo = glMessageInfoList[iq];
            if(messageInfo) {
                if(!Liquid.curMessageBusy) {
                    glMessageInfoList[iq] = null;
                    setTimeout( function(){ Liquid.dialogBoxButtons(messageInfo.parentObj, messageInfo.title, messageInfo.message, messageInfo.buttons); }, (Liquid.curMessageDealyTimeSec > 0 ? Liquid.curMessageDealyTimeSec*1000:1000) );
                }
            }
        }
        glMessageInfoList = glMessageInfoList.filter(function (item) {
            return item !== null;
        });           
    },
    showToast:function(title, message, type) {
        const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if(base64regex.test(message))
            message = atob(message);
        toastr.options = {
          "closeButton": true,
          "debug": false,
          "newestOnTop": true,
          "progressBar": true,
          "positionClass": "toast-bottom-center",
          "preventDuplicates": false,
          "onclick": null,
          "showDuration": "300",
          "hideDuration": "1000",
          "timeOut": "5000",
          "extendedTimeOut": "1000",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        };
        var validatedType = null;
        for(var attrname in toastr.toastType) {
            if(type === attrname) {
                validatedType = attrname;
                break;
            }
        }
        toastr[(validatedType?validatedType:'info')](message, title);
    },
    /**
     * Close a control
     * @param {obj} the control id or the class instance (LiquidCtrl)
     * @return n/d
     */
    close:function(obj) {
        if(!obj) obj = this;
        return Liquid.onClosing(obj);
    },
    onClosing:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.askForSave || liquid.tableJson.askForSave) {
                Liquid.dialogBox(liquid.parentObj ? liquid.parentObj : liquid.outDivObj,
                                Liquid.askForSaveTitle, 
                                Liquid.askForSaveMessage,
                                { text:"Save", func:function() { Liquid.onClosingProcessEvent(obj, true); } }, 
                                { text:"Discharde", func:function() { Liquid.onClosingProcessEvent(obj, false); } } 
                                );
            } else {
                Liquid.onClosingProcessEvent(obj, false);
            }
        }
    },
    onClosingProcessEvent:function(obj, bSave) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(bSave) Liquid.onSaveTo(liquid, true, true);
            Liquid.onEvent(obj, "onClosing", Liquid.onClosingStart, {liquid: liquid, obj: obj, command: null});
            liquid.outDivObj.classList.add('liquidHide');
            setTimeout('Liquid.onClosed("' + liquid.controlId + '")', 500);
        }        
    },
    onClosingStart:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.outDivObj.classList.add('liquidHide');
            setTimeout('Liquid.onClosed("' + liquid.controlId + '")', 500);
            Liquid.onEvent(obj, "onClosed", null, null);
        }
    },
    onClosed:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            delete liquid.modifications;
            if(liquid === glLastFocusedLiquid)
                glLastFocusedLiquid = null;
            if(liquid.outDivObj) {
                liquid.outDivObj.style.display = "none";
                liquid.outDivObj.classList.remove('liquidHide');
            }
            if(liquid.obscuringObj) {
                liquid.obscuringObj.style.display = "none";
                document.body.webkitFilter = liquid.obscuringLastFilter;
            }            
            if(liquid.onPostClosed) {
                Liquid.executeClientSide(liquid, "onPostClosed", liquid.onPostClosed, null, true);
            }
           
            if(!liquid.cache) {
            	try { 
                    if(liquid.obscuringObj)
                        document.body.removeChild(liquid.obscuringObj);
                    liquid.obscuringObj = null;
                    liquid.outDivObj.innerHTML = "";
                    if(liquid.gridOptions) if(liquid.gridOptions.api) liquid.gridOptions.api.setRowData(null); 
                } catch(e) { console.error(e); }
                liquid.lastSelectedId = null;
                Liquid.destroy(liquid);
            } else {
                liquid.modifications = null;
                Liquid.updateSelectionData(liquid);
                var selectionData = Liquid.getSelectedPrimaryKeys(liquid);
                liquid.tableJson.selectionKey = selectionData[0];
                liquid.tableJson.unselectionKey = selectionData[1];
            }
            liquid.status = "closed";
            if(glLiquids.length) {
                for(var i=glLiquids.length-1; i>=0; i--) {
                    if(glLiquids[i].mode === 'popup' || glLiquids[i].mode === 'winX' || glLiquids[i].mode === 'WinX') {
                        if(typeof glLiquids[i].isSystem === 'undefined' && typeof glLiquids[i].tableJson.isSystem === 'undefined') {
                            if(glLiquids[i] !== liquid) {
                                Liquid.setFocus(glLiquids[i]);
                                break;
                            }
                        }
                    }
                }
            }
            Liquid.createNavigatorsBar();
        }
    },
    destroy:function(liquid) {
        if(liquid) {
            if(liquid.linkedLiquids) {
                for(var i=0; i<liquid.linkedLiquids.length; i++) {
                    Liquid.destroy(liquid.linkedLiquids[i]);
                }
            }
            if(liquid.outDivObj)
                liquid.outDivObj.innerHTML='';
            if(liquid.outDivObjCreated) {
                if(liquid.outDivObj) {
                    liquid.outDivObj.parentNode.removeChild(liquid.outDivObj);
                    liquid.outDivObj = null;
                }
            }
            if(liquid===glLastFocusedLiquid) glLastFocusedLiquid = null;
            glLiquids.splice(glLiquids.indexOf(liquid), 1);
            delete liquid;
        }
    },
    onStart:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.absoluteLoadCounter === 0) 
                Liquid.onEvent(obj, "onFirstLoad", null, null);
            Liquid.onEvent(obj, "onLoad", null, null);
            liquid.outDivObj.classList.remove('liquidHide');
            liquid.outDivObj.classList.add('liquidShow');
            setTimeout('Liquid.onStarted(document.getElementById("' + liquid.controlId + '"))', 500);
        }
    },
    onStarted:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.outDivObj.style.display = "";
        }
    },
    startup:function(e) {
        console.log("Wellcome in Liquid version:" + Liquid.version + " - Copyright 2020 Cristian Andreon - https://cristianandreon.eu/Liquid - info@cristianandreon.eu");
        for(var i=0; i<glLiquidStartupTables.length; i++) {
            new LiquidCtrl(glLiquidStartupTables[i].controlId, glLiquidStartupTables[i].controlId, glLiquidStartupTables[i].json);
        }
        for(var i=0; i<glLiquidStartupWinX.length; i++) {
            Liquid.startWinX(glLiquidStartupWinX[i].controlId, glLiquidStartupWinX[i].jsonString, glLiquidStartupWinX[i].parentObjId, glLiquidStartupWinX[i].status);
        }
        for(var i=0; i<glLiquidStartupPopup.length; i++) {
            Liquid.startPopup(glLiquidStartupPopup[i].controlId, glLiquidStartupPopup[i].jsonString);
        }
        for(var i=0; i<glLiquidStartupMenuX.length; i++) {
            Liquid.startWinX(glLiquidStartupMenuX[i].controlId, glLiquidStartupMenuX[i].jsonString, glLiquidStartupMenuX[i].parentObjId, glLiquidStartupMenuX[i].status);
        }
        Liquid.createNavigatorsBar();
        
        // Test long time task
        if(Liquid.debugWorker) {
            Liquid.startWorker(null, { name:"longTimeTask", client:"alert('Long task done')", server:"com.liquid.event.longTimeTaskTest", param:"" }, 777);
            Liquid.startReadWorkers(Liquid.defaultIntervalReadWorkers);
        }
    },
    /**
     * Start a control as Fixed control
     * @param {controlId} the control id
     * @param {jsonString} the control definition json (string)
     * @return {} n/d
     */
    startControl:function(controlId, jsonString) {
        if(!document.body) {
            glLiquidStartupTables.push( { controlId:controlId, json:jsonString } );
            return;
        }
        new LiquidCtrl(controlId, controlId, jsonString);
    },
    /**
     * Start a control as popup
     * @param {controlId} the control id
     * @param {jsonString} the control definition json (string)
     * @return {} n/d
     */
    startPopup:function(controlId, jsonString) {
        if(!document.body) {
            glLiquidStartupPopup.push( { controlId:controlId, jsonString:jsonString } );
            return;
        }
    	var retVal = null;
        var refControlId = controlId.replace(/\./g, "-");
        var liquid = Liquid.getLiquid(refControlId);
        if(!liquid)
            retVal = new LiquidCtrl(refControlId, controlId, jsonString);
        else {
            retVal = liquid;
            Liquid.initializeLiquid(liquid);
            Liquid.onStart(liquid);
            if(liquid.autoLoad !== false)
                Liquid.loadData(liquid, null);
            else if(Liquid.cleanData) { liquid.gridOptions.api.setRowData(null); liquid.gridOptions.api.clearFocusedCell(); liquid.lastSelectedId = null; }
            if(liquid.autoFocus !== false)
                Liquid.setFocus(liquid);
            else if(liquid.tableJson.modeless || liquid.tableJson.modless)
                Liquid.setFocus(liquid);
        }
        Liquid.createNavigatorsBar();
        return retVal;
    },
    /**
     * Start a control as winX
     * @param {controlId} the control id
     * @param {jsonString} the control definition json (string)
     * @param {parentId} the id of the html parent object
     * @param {status} the initial status of the winX (maximized, iconic, restored)
     * @return {} n/d
     */
    startWinX:function(controlId, jsonString, parentId, status) {
        if(!document.body) {
            glLiquidStartupWinX.push( { controlId:controlId, jsonString:jsonString, parentId:parentId, status:status } );
            return;
        }
        var refControlId = controlId.replace(/\./g, "-");
        var liquid = Liquid.getLiquid(refControlId);
        if(!liquid)
            liquid = new LiquidCtrl(refControlId, controlId, jsonString
                                    , null
                                    , "winX", parentId);
        else {
            Liquid.initializeLiquid(liquid);
            Liquid.onStart(liquid);
            if(Liquid.reloadDataOnFocus) Liquid.loadData(liquid, null);
            Liquid.setFocus(liquid);            
        }
        var newLiquid = Liquid.getLiquid(liquid.controlId);
        if(newLiquid) {
            Liquid.setParent(newLiquid, parentId);
            Liquid.setWinXStatus(newLiquid, status);
            Liquid.createNavigatorsBar();
        } else console.error("ERROR: control:"+controlId+" not created");
        Liquid.createNavigatorsBar();
    },
    /**
     * Set the status of a winX control
     * @param {obj} the control id or liquid control (class LiquidCtrl)
     * @param {status} the initial status of the winX (maximized, iconic, restored)
     * @return {} n/d
     */
    setWinXStatus:function(obj, status) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(status === 'iconic' || status === 'minimized') {
                liquid.isIconic = true;
                liquid.isMaximized = false;
            } else if(status === 'maximized') {
                liquid.isIconic = false;
                liquid.isMaximized = true;
            } else if(typeof status === 'undefined' || status === 'restored' || status === '' || !status) {
                liquid.isIconic = false;
                liquid.isMaximized = false;
            } else if(status === 'maximized/minimized') {
                liquid.isIconic = false;
                liquid.isMaximized = !liquid.isMaximized;
            } else if(status === 'iconic/restore') {
                liquid.isMaximized = false;
                liquid.isIconic = !liquid.isIconic;
            } else {
                console.error("ERROR: status not recognized:"+status);
                return;
            }
            Liquid.onResize(liquid);
        }
    },
    transferFeatures:function(sourceObject, targetObject) {
        if(sourceObject) {
            if(targetObject) {
                // options transfer
                if(isDef(sourceObject.options)) {
                    for(var attrname in sourceObject.options) {
                        targetObject[attrname] = sourceObject.options[attrname];
                    }
                }                                        
                // features transfer
                var propsToTransfer = [ "commands", "filters", "preFilters", "grids", "documents", "layouts", "charts", "multipanels", "events", "actions" ];
                for(var ip=0; ip<propsToTransfer.length; ip++) {
                    if(isDef(sourceObject[propsToTransfer[ip]])) {
                        if(typeof targetObject[propsToTransfer[ip]] === 'undefined') {
                            targetObject[propsToTransfer[ip]] = sourceObject[propsToTransfer[ip]];
                        } else {
                            for(var attrname in sourceObject[propsToTransfer[ip]]) {
                                targetObject[propsToTransfer[ip]][attrname] = sourceObject[propsToTransfer[ip]][attrname];
                            }
                        }
                    }
                }
            }
        }
    },
    overlayObjectContent:function( targetObject, sourceObject ) {
        if(isDef(sourceObject))
            for(var attrname in sourceObject)
                targetObject[attrname] = sourceObject[attrname];
    },
    startLookup:function(controlId, containerName, containerObjOrId, json, lookupField, options, linkType, fieldDescription, enviroment) {
        var lookupLiquid = null;
        try {
            if(json) {
                var liquid = Liquid.getLiquid(controlId);
                if(liquid) {
                    var containerObj = null, containerObjId = null;
                    if(typeof enviroment === 'undefined' || enviroment === null) enviroment = window;                    
                    if(typeof containerObjOrId === "object" && containerObjOrId.nodeType === 1) {
                        containerObj = containerObjOrId;
                        containerObjId = containerObj.id;
                    } else {
                        containerObjId = containerObjOrId;
                        containerObj = enviroment.document.getElementById(containerObjId);
                    }
                    if(!containerObj) {
                        console.error("ERROR: startLookup() object '"+containerObjId+"' not found");
                        return;
                    }                    
                    var lookupJson = null;
                    var registerControlId = null;
                    if(typeof json === 'string' && json.trim().startsWith("{")) { // by json content
                        lookupJson = JSON.parse(json);
                        registerControlId = controlId + "_lookup_" + containerName.replace(/\./g, "_");
                    } else {
                        for(var i=0; i<glLiquids.length; i++) { // by json in other control
                            if(glLiquids[i].controlId === json) {
                                // lookupJson = JSON.parse(JSON.stringify(glLiquids[i].tableJson));
                                lookupJson = deepClone(glLiquids[i].tableJson);
                                registerControlId = glLiquids[i].controlId;
                                break;
                            }
                        }
                        if(!lookupJson) { // by json in global var or object
                            var lookupObj = Liquid.getProperty(json);
                            if(lookupObj) {
                                if(isDef(lookupObj.dataset)) if(isDef(lookupObj.dataset.liquid)) { // by other liquid control
                                    for(var i=0; i<glLiquids.length; i++) {
                                        if(glLiquids[i].controlId === lookupObj.dataset.liquid) {
                                            lookupJson = deepClone(glLiquids[i].tableJson);
                                            registerControlId = glLiquids[i].controlId;
                                            break;
                                        }
                                    }
                                }
                            }
                            if(!lookupJson) { // by var or object
                                if(typeof lookupObj === 'string') {
                                    if(document.getElementById(lookupObj)) {                                        
                                        console.error("ERROR : cannot create lookup by HTMLElement ... is should be a liquid control\n Make sure control "+json+" exist and is just registered at this time");
                                        if(containerObj) containerObj.title = containerObj.placeholder = "Lookup error : control " + json + " not found";
                                    }
                                } else {
                                    if(lookupObj instanceof HTMLElement) {
                                        console.error("ERROR : cannot create lookup by HTMLElement ... is should be a liquid control\n Make sure control "+json+" exist and is just registered at this time");
                                         if(containerObj) containerObj.title = containerObj.placeholder = "Lookup error : control " + json + " not found";
                                    }
                                }
                                lookupJson = typeof lookupObj === 'string' ? JSON.parse(lookupObj) : lookupObj;
                                registerControlId = controlId + "_lookup_" + containerName.replace(/\./g, "_");
                            }
                        }
                    }
                    if(lookupJson) {
                        try {
                            lookupJson.mode = "lookup";
                            lookupJson.columnsResolved = false;
                            lookupJson.registerControlId = registerControlId;
                            lookupJson.token = liquid.token;
                            lookupJson.gridLink = (linkType === 'grid' ? containerObjId : null);
                            lookupJson.filtertLink = (linkType === 'filter' ? containerObjId : null);
                            lookupJson.layoutLink = (linkType === 'layout' ? containerObjId : null);
                            if(isDef(json.lookupField))
                                lookupJson.lookupFiled = json.lookupField;
                            if(isDef(lookupField))
                                lookupJson.lookupFiled = lookupField;
                            // options transfer
                            Liquid.overlayObjectContent(lookupJson, options);
                            if(isDef(lookupJson.idColumn) || isDef(lookupJson.targetColumn)) {
                                // Manage idColumn and targetColumn
                                if(linkType === 'grid') {
                                    // Link to tableJson.grid[].columns
                                    if(liquid.tableJson.grids) {
                                        var aliasTargetColumn = liquid.tableJson.table + "." + lookupJson.targetColumn;
                                        var aliasIdColumn = lookupJson.table + "." + lookupJson.idColumn;
                                        for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                                            var grid = liquid.tableJson.grids[ig];
                                            var columns = grid.columns;
                                            for(var ic=0; ic<grid.columns.length; ic++) {
                                                try {
                                                    if(columns[ic].name === aliasTargetColumn || columns[ic].name === lookupJson.TargetColumn || columns[ic].field === lookupJson.targetColumn // link to taget
                                                     || columns[ic].name === aliasIdColumn || columns[ic].name === lookupJson.idColumn || columns[ic].field === lookupJson.idColumn // link to external column
                                                     ) {
                                                        if(typeof lookupJson.idColumnLinkedObjIds === 'undefined' || lookupJson.idColumnLinkedObjIds === null)
                                                            lookupJson.idColumnLinkedObjIds = [];
                                                        lookupJson.idColumnLinkedObjIds.push(columns[ic].linkedObj.id);
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                        }
                                    }
                                }
                                // Link to tableJson.columns
                                if(liquid.tableJson.columns) {
                                    var columns = liquid.tableJson.columns;
                                    var aliasTargetColumn = liquid.tableJson.table + "." + lookupJson.targetColumn;
                                    for(var ic=0; ic<columns.length; ic++) {
                                        try {
                                            var condA = columns[ic].name === lookupJson.idColumn || columns[ic].field === lookupJson.idColumn;
                                            var condB = columns[ic].name === lookupJson.targetColumn || columns[ic].name === aliasTargetColumn || columns[ic].field === lookupJson.targetColumn;
                                            if(condA || condB) {
                                                if(condA)
                                                    liquid.tableJson.columns[ic].isReflected = true;
                                                if(typeof lookupJson.idColumnLinkedFields === 'undefined' || lookupJson.idColumnLinkedFields === null)
                                                    lookupJson.idColumnLinkedFields = [];
                                                lookupJson.idColumnLinkedFields.push({controlId: liquid.controlId, field: columns[ic].field});
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }
                            }
                            var lookupControlId = controlId + "_lookup_" + containerName.replace(/\./g, "_");
                            lookupJson.token = liquid.tableJson.token;
                            lookupLiquid = new LiquidCtrl(  lookupControlId, containerObj, JSON.stringify(lookupJson)
                                                            , null
                                                            , "lookup", null);
                            lookupLiquid.callingLiquid = liquid;
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        console.error("ERROR : unable to find lookup \"" + json + "\" on control:" + controlId + " field:" + containerName + " check:" + fieldDescription);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        return lookupLiquid;
    },
    /**
     * Start a control as menuX
     * @param {outDivObjOrId} the id or html element of the html parent object
     * @param {menuJson} the control definition json (string)
     * @return {} n/d
     */
    startMenuX:function(outDivObjOrId, menuJson, options) {
        if(!document.body) {
            glLiquidStartupMenuX.push( { outDivObjOrId:outDivObjOrId, menuJson:menuJson, options:options } );
            return;
        }
        return new LiquidMenuXCtrl(outDivObjOrId, menuJson, options);
    },    
    buildMenuXAccordion:function(liquid, accordion, parentObj, level) {
        if(liquid) {
            if(accordion) {
                if(parentObj) {
                    var accordionObj = document.createElement('div');
                    accordionObj.id = liquid.controlId+".Accordion."+accordion.name;
                    accordionObj.className = "liquidMenuXAccordion";
                    accordionObj.style.height = accordion.height ? Liquid.getCSSDim(accordion.height) : '';
                    parentObj.appendChild(accordionObj);
                    if(isDef(accordion.sections)) {
                        for(var ia=0; ia<accordion.sections.length; ia++) {
                            var item = accordion.sections[ia];
                            if(item) {
                                var sectionObj = document.createElement('h3');
                                var itemObj = document.createElement('div');
                                var pObj = document.createElement('p');
                                sectionObj.innerHTML = item.name;
                                // commands inside accordion
                                for(var i=0; i<item.commands.length; i++) {
                                    Liquid.buildMenuXCommand(liquid, item.commands[i], pObj, null, level);
                                }
                                itemObj.appendChild(pObj);
                                accordionObj.appendChild(sectionObj);
                                accordionObj.appendChild(itemObj);
                            }
                        }
                    }                    
                    $( accordionObj ).accordion();                    
                    if(accordion.commandsOrder === 'before') {
                        if(isDef(accordion.commands)) {
                            for(var i=0; i<accordion.commands.length; i++) {
                                Liquid.buildMenuXCommand(liquid, accordion.commands[i], accordionObj, null, level);
                            }
                        }
                    }
                    if(isDef(accordion.accordions)) {
                        for(var i=0; i<accordion.accordions.length; i++) {
                            Liquid.buildMenuXAccordion(liquid, accordion.accordion[i], accordionObj, level+1);
                        }
                    }
                    if(accordion.commandsOrder !== 'before') {
                        if(isDef(accordion.commands)) {
                            for(var i=0; i<accordion.commands.length; i++) {
                                Liquid.buildMenuXCommand(liquid, accordion.commands[i], accordionObj, null, level);
                            }
                        }
                    }
                }
            }
        }
    },
    buildMenuXCommand:function(liquid, command, parentObj, parentCommand, level) {
        if(liquid) {
            if(command) {
                if(parentObj) {
                    if(typeof command.text === 'undefined') command.text = command.name;
                    var commandObj = Liquid.createCommandButton(liquid, command, 'liquidMenuX');
                    if(commandObj) {
                        parentObj.appendChild(commandObj);
                    }
                    command.linkedParentObj = parentObj;
                    command.linkedObj = commandObj;
                    command.parentCommand = parentCommand;
                    parentObj.ondrop = function(event) { Liquid.onDrop(event); };
                    parentObj.ondragover = function(event) { Liquid.onAllowDrop(event); };
                    
                    if(liquid.menuCommands)
                        liquid.menuCommands.push(command);
                    if(isDef(command.commands)) {
                        var subCommandsObj = document.createElement('div');
                        subCommandsObj.style.overflow = '';
                        subCommandsObj.style.display = 'none';
                            // commandObj.appendChild(subCommandsObj);
                            if(subCommandsObj) parentObj.appendChild(subCommandsObj);
                        if(liquid.menuJson.type === 'top' || liquid.menuJson.type === 'bottom') {
                            var classStyle = getComputedStyle(liquid.outDivObj);
                            // subCommandsObj.style.backgroundColor = classStyle.backgroundColor;
                        } else {
                        }                        
                        command.commandsContainer = subCommandsObj;
                        command.level = level;
                        if(command.popup === true) {
                            subCommandsObj.className = "liquidMenuXPopup";
                        }                        
                        for(var i=0; i<command.commands.length; i++) {
                            Liquid.buildMenuXCommand(liquid, command.commands[i], subCommandsObj, command, level+1);
                        }
                    }
                }            
            }
        }
    },
    toggleMenu:function(obj) {
        if(obj) {
            var menuX = Liquid.getLiquid(obj);
            var nameItems = obj.id.split(".");
            if(nameItems.length > 0) {
                var menuIconContainer = document.getElementById(nameItems[0]+".menuXIconContainer");
                var menuContainer = document.getElementById(nameItems[0]+".menuXContainer");
                var menuObj = document.getElementById(nameItems[0]+".menuX");
                if(menuContainer) {                    
                    if(!obj.classList.contains("liquidMenuXchange")) {                        
                        menuObj.classList.remove("liquidMenuXClosed");
                        if(menuObj) $( menuObj ).slideDown( "fast", function(){ menuContainer.style.display = menuX.display; Liquid.setMenuIcon(obj, menuX, menuContainer, menuIconContainer, false, true); });
                    } else {
                        Liquid.setMenuIcon(obj, menuX, menuContainer, menuIconContainer, true, true);
                        menuObj.classList.add("liquidMenuXClosed");
                        if(menuObj) $( menuObj ).slideUp( "fast", function(){ menuObj.style.display = menuX.display; menuContainer.style.display = 'none'; });
                    }
                }
            }
        }
    },
    setMenuIcon:function(obj, menuX, menuContainer, menuIconContainer, bClosed, bAnimation) {
        if(menuX) {
            var topPos = 3; // menuX.position.top+3;
            menuX.newState = bClosed;
            if(bClosed) {
                menuX.stateMoving = true;
                if(menuX.menuJson.type === 'left') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ left: 0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.right=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'right') {                            
                    if(menuIconContainer) $( menuIconContainer ).animate({ right: 0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.left=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'top') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'bottom') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                }
            } else {
                if(menuX.menuJson.type === 'left') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ right:0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.left=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'right') {                            
                    if(menuIconContainer) $( menuIconContainer ).animate({ left:0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.right=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'top') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'bottom') {
                    if(menuIconContainer) $( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                }
            }
        }
    },
    changeMenuIcon:function(obj, menuX, bClosed) {
        if(menuX.stateClose !== bClosed) {
            obj.classList.toggle("liquidMenuXchange"); 
            obj.style.visibility = ''; 
            menuX.stateClose = bClosed;
            menuX.stateMoving = false;
        }
    },
    handleResponse:function(liquid, title, resultJson, bShowMessage, hShowConsole, bHandleClientSite) {
        var retVal = true;
        if(resultJson.error) {
            var err = null;
            try { err = atob(resultJson.error); } catch(e) { err = resultJson.error; }
            if(bShowMessage) {
                Liquid.dialogBox(null, resultJson.title ? resultJson.title : "ERROR", err, { text:"OK", func:function() { } }, null);
            }
            if(hShowConsole) {
                console.error("[SERVER] ERROR:" + err);
            }
        } else if(resultJson.warning) {
            var warn = null; 
            try { warn = atob(resultJson.warning); } catch(e) { warn = resultJson.warning; }
            if(bShowMessage) {
                Liquid.dialogBox(null, resultJson.title ? resultJson.title : "WARNING", warn, { text:"OK", func:function() { } }, null);
            }
            if(hShowConsole) {
                console.warn("[SERVER] WSRNING:" + warn);
            }
        } else if(resultJson.message) {
            var msg = null; 
            try { msg = atob(resultJson.message); } catch(e) { msg = resultJson.message; }
            if(bShowMessage) {
                Liquid.dialogBox(null, resultJson.title ? resultJson.title : "MESSAGE", msg, { text:"OK", func:function() { } }, null);
            }
            if(hShowConsole) {
                console.info("[SERVER] MESSAGE:" + msg);
            }
        }
        if(bHandleClientSite) {
            try {
                if(resultJson.client) {
                    retVal = Liquid.executeClientSide(liquid, title, resultJson.client, resultJson.params, true);
                }
            } catch(e) {
                console.error("ERROR:"+e);
            }
        }
        return retVal;
    },            
    /**
     * Start a command al long operation in the server
     * @param {liquid} the calling control
     * @param {command} the command to execute
     * @param {userId} the id for handle the work
     * @param {async} true if you wanto to wait for server to finish (or need to stay connected to get message from server)
     * @return {} n/d
     */
    startWorker:function(liquid, command, userId, sync) {
        if(command) {
            if(!liquid) liquid = {};
            if(command.server) {
                if(userId) {
                    var syncParam = (typeof sync !== 'undefined' ? sync : true);
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command);
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', glLiquidServlet + '?operation=startWorker'
                            +'&userId=' + userId
                            +'&className=' + command.server
                            +'&async=' + syncParam
                            );
                    
                    xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, command, "startWorker", e, command.onUploading, command.onUploadingParam); }, false);
                    xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, command, "startWorker", e, command.onDownloading, command.onDownloadingParam); }, false);
                    xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, command, "startWorker", e, command.onLoad, command.onLoadParam); }, false);
                    xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, command, "startWorker", e, command.onError, command.onErrorParam); }, false);
                    xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, command, "startWorker", e, command.onAbort, command.onAbortParam); }, false);
                    
                    xhr.send(JSON.stringify(liquidCommandParams));
                    xhr.onreadystatechange = function() {
                        if(xhr.readyState === 4) {
                            if(xhr.status === 200) {
                                try {
                                    var status = "0";
                                    var responseText = Liquid.getXHRResponse(xhr.responseText);
                                    if(responseText) {
                                        try {
                                            var resultJson = JSON.parse(responseText);
                                            if(resultJson) {
                                                if(resultJson.userId) {
                                                    if(syncParam !== true) {
                                                        // register worker by userId
                                                        Liquid.addWorker(liquid, command, resultJson.userId, resultJson.status);
                                                    }
                                                }
                                                Liquid.handleResponse(liquid, "startWorker", resultJson, true, true, true);
                                            }
                                        } catch(e) {
                                            console.error("ERROR:"+e+" on:"+responseText);
                                        }
                                    }
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
    getWorker:function(obj, command, userId) {
        var liquid = Liquid.getLiquid(liquid);
        if(command) {
            if(userId) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', glLiquidServlet + '?operation=getWorker&userId=' + userId);
                xhr.send();
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            try {
                                if(xhr.responseText) {
                                    try {
                                        var resultJson = JSON.parse(xhr.responseText);
                                        try {
                                            if(resultJson.result) {
                                                if(resultJson.status === "200") {
                                                    Liquid.handleResponse(liquid, "getWorker result", resultJson, true, true, true);
                                                    if(glLiquidDBEnable) {
                                                        Liquid.getDB();
                                                        if(glLiquidDB) {
                                                            glLiquidDB.transaction(function (tx) {
                                                                tx.executeSql('DELETE FROM WORKERS WHERE userId="'+(userId)+'"', [], function (tx, results) { }, null); 
                                                            }, null);
                                                        } else if (glLiquidIDB) {
                                                            var request = glLiquidIDB.transaction(["WORKERS"], "readwrite").objectStore("data").delete(userId);
                                                            request.onsuccess = function(event) { };
                                                        }
                                                    }
                                                } else {
                                                    console.log("TASK: userId:"+resultJson.userId+" status:"+resultJson.status);
                                                }
                                                // TODO : got it : remove from server
                                            }
                                        } catch(e) {
                                            console.error("ERROR:"+e);
                                        }
                                    } catch(e) {
                                        console.error("ERROR:"+e+" on:"+xhr.responseText);
                                    }
                                }
                            } catch (e) {
                                console.error("ERROR:"+e+" on:"+xhr.responseText);
                            }
                        }
                    }
                };
            }
        }
    },    
    addWorker: function (liquid, command, userId, status) {
        if (glLiquidDBEnable) {
            Liquid.getDB();
            if (glLiquidDB) {
                glLiquidDB.transaction(function (tx) {
                    tx.executeSql("SELECT * FROM WORKERS WHERE userId='" + userId + "'", [], function (tx, results) {
                        var len = results.rows.length;
                        if (len <= 0) {
                            var date = new Date();
                            tx.executeSql("INSERT INTO WORKERS (userId,status,controlId,command,date) VALUES ('" + userId + "','" + status + "','" + (liquid ? liquid.controlId : "") + "','" + (command ? command.name : "") + "','" + date.toISOString() + "')");
                        }
                    }, null);
                });
            } else if (glLiquidIDB) {
                var transaction = glLiquidIDB.transaction(["WORKERS"], "readwrite");
                var objectStore = transaction.objectStore("WORKERS");
                var request = objectStore.getAll();
                if (request.readyState === 'done') {
                    Liquid.addWorkerToIndexDB(request.result, liquid, userId, status, command);
                } else {
                    request.onerror = function (event) {
                        console.error("IndexedDB error:" + event.target.error.message);
                    };
                    request.onsuccess = function (event) {
                        event.target.readyState = 'done';
                    };
                    if (Liquid.wait_for_indexdb_ready(request, "")) {
                        Liquid.addWorkerToIndexDB(request.result, liquid, command, userId, status);
                    }
                }
            } else {
                console.error("addWorker() no localDB media");
            }
        }
    },
    addWorkerToIndexDB:function(result, liquid, command, userId, status ) {
        try {
            var bFoundWorker = false;
            var cursors = result;
            for(var ic=0; ic<cursors.length; ic++) {
                cursor = cursors[ic];
                if (cursor) {
                    if(cursor.userId == userId) {
                        bFoundWorker = true;
                        break;
                    }
                }
            }
            if(!bFoundWorker) {
                var date = new Date();
                var data = { userId:userId, status:status, controlId:(liquid?(liquid.controlId?liquid.controlId:""):""), command:(command?command.name:""), date:date.toISOString() };
                transaction = glLiquidIDB.transaction(["WORKERS"], "readwrite");
                objectStore = transaction.objectStore("WORKERS");
                request = objectStore.add(data);
                if(request.readyState === 'done') {
                } else {
                    request.onerror = function(event) {
                        console.error("IndexedDB error:"+event.target.error.message);
                    };
                    request.onsuccess = function(event) {
                    };
                }
            }
        } catch(e) {
            console.error("addWorkerToIndexDB() error:"+e);
        }
    },
    /**
     * Check all long operations in the server
     * @return {} n/d
     */
    startReadWorkers:function(interval) {
        Liquid.stopReadWorkers();
        if(interval > Liquid.minIntervalReadWorkers) {
            glWorkReaderLooper = setInterval(function() { Liquid.readWorkers(); }, (typeof interval !== 'undefined' && interval > 1 ? interval : 5000) );
        }
    },
    /**
     * Stop Checking long operations in the server
     * @return {} n/d
     */
    stopReadWorkers:function() {
        if(glWorkReaderLooper) {
            clearInterval(glWorkReaderLooper);
            glWorkReaderLooper = null;
        }            
    },
    /**
     * Start long operations in the server
     * @return {} n/d
     */
    readWorkers:function() {
        if(glLiquidDBEnable) {
            Liquid.getDB();
            if(glLiquidDB) {
                glLiquidDB.transaction(function (tx) {                   
                    tx.executeSql('SELECT * FROM WORKERS', [], function (tx, results) {
                        var len = results.rows.length; 
                        for (var i = 0; i<len; i++) { 
                            if(results.rows.item(i).userId) {
                                Liquid.getWorker(results.rows.item(i).liquid, results.rows.item(i).command, results.rows.item(i).userId);
                            }
                        }
                    }, null); 
                });
            }
        } else if(glLiquidIDB) {
            var transaction = glLiquidIDB.transaction(["WORKERS"], "readwrite");
            var objectStore = transaction.objectStore("WORKERS");
            var request = objectStore.getAll();
            if(request.readyState === 'done') {
                Liquid.copyToClipBoradInternal(liquid);
            } else {
                request.onerror = function(event) {
                    console.error("ERROR: readWorkers() : "+event);
                };
                request.onsuccess = function(event) {
                    var cursors = event.target.result;
                    if (cursors) {
                        for(var ic=0; ic<cursors.length; ic++) {
                            cursor = cursors[ic];
                            if (cursor) {
                                if(cursor.userId) {
                                    Liquid.getWorker(cursor.liquid, cursor.command, cursor.userId);
                                }
                            }
                        }
                    }
                };                
            }
        }
    },
    copyToClipBorad:function(liquid) {
        try {
            if(glLiquidDBEnable) {
                Liquid.getDB();
                if(glLiquidDB) {
                    glLiquidDB.transaction(function (tx) {   
                        tx.executeSql("DELETE FROM CLIPBOARD WHERE 1=1", [], function (tx, results) {
                            Liquid.copyToClipBoradInternal(liquid);
                        }, null);
                    });
                } else if(glLiquidIDB) {
                    var transaction = glLiquidIDB.transaction(["CLIPBOARD"], "readwrite");
                    var objectStore = transaction.objectStore("CLIPBOARD");
                    var request = objectStore.clear();
                    if(request.readyState === 'done') {
                        Liquid.copyToClipBoradInternal(liquid);
                    } else {
                        request.onerror = function(event) {
                            console.error("IndexedDB error:"+event.target.error.message);
                        };
                        request.onsuccess = function(event) {
                            Liquid.copyToClipBoradInternal(liquid);
                        };
                    }
                }                
            }
        } catch(e) {
            console.error("copyToClipBorad() error:"+e);
        }
    },
    copyToClipBoradInternal:function(liquid) {
        if(liquid) {
            if(glLiquidDBEnable) {
                var date = new Date();
                Liquid.getDB();
                if(glLiquidDB) {
                    glLiquidDB.transaction(function (tx) {   
                        tx.executeSql("INSERT INTO CLIPBOARD (controlId,columns,rows,date) VALUES ('"+liquid.controlId+"','"+JSON.stringify(liquid.tableJson.columns)+"','"+(Liquid.serializedRow(liquid, true))+"','"+date.toISOString()+"')");
                        Liquid.copyToClipBoradDone(liquid);
                    }, null);
                } else if(glLiquidIDB) {                    
                    var transaction = glLiquidIDB.transaction(["CLIPBOARD"], "readwrite");
                    var objectStore = transaction.objectStore("CLIPBOARD");
                    var data = { controlId:liquid.controlId, columns:JSON.stringify(liquid.tableJson.columns), rows:(Liquid.serializedRow(liquid, true)), date:date.toISOString() };
                    var request = objectStore.add(data);
                    if(request.readyState === 'done') {
                        Liquid.copyToClipBoradDone(liquid);
                    } else {
                        request.onerror = function(event) {
                            console.error("IndexedDB error:"+event.target.error.message);
                        };
                        request.onsuccess = function(event) {
                            Liquid.copyToClipBoradDone(liquid);
                        };
                    }
                }
            }
        }
    },
    copyToClipBoradDone:function(liquid) {
        var selNodes = liquid.gridOptions.api.getSelectedNodes();
        if(selNodes.length>0) {
            var msg = Liquid.lang === 'eng' ? ("Copied "+selNodes.length + "item(s)") : ("Copiat"+(selNodes.length===1?"a":"e")+" "+selNodes.length + " rig"+(selNodes.length===1 ? "a":"he") );
            Liquid.showToast("LIQUID", msg, "success");
        } else {
            var msg = Liquid.lang === 'eng' ? ("No items selected") : ("Nessuna riga selezionata" );
            Liquid.showToast("LIQUID", msg, "warning");
        }
    },
    pasteFromClipBorad:function(liquid) {
        if(liquid) {
            if(glLiquidDBEnable) {
                Liquid.getDB();
                if(glLiquidDB) {
                    glLiquidDB.transaction(function (tx) {   
                        tx.executeSql("SELECT * FROM CLIPBOARD WHERE 1=1", [], function (tx, results) { 
                            for (var i=0; i<results.rows.length; i++) { 
                                Liquid.pasteFromClipBoradExec( liquid, results.rows.item(i).controlId, results.rows.item(i).columns, results.rows.item(i).rows );
                            }
                        }, null);
                    });
                } else if(glLiquidIDB) {                    
                    var transaction = glLiquidIDB.transaction(["CLIPBOARD"], "readwrite");
                    var objectStore = transaction.objectStore("CLIPBOARD");
                    var request = objectStore.getAll();
                    if(request.readyState === 'done') {
                        Liquid.pasteFromClipBoradProcessCursors(liquid, request.result);
                    } else {
                        request.onerror = function(event) {
                            console.error("ERROR: pasteFromClipBorad() error: "+event);
                        };
                        request.onsuccess = function(event) {
                            Liquid.pasteFromClipBoradProcessCursors(liquid, event.target.result);
                        };                
                    }
                }
            }
        }
    },
    pasteFromClipBoradProcessCursors:function(liquid, cursors) {
        for(var ic=0; ic<cursors.length; ic++) {
            cursor = cursors[ic];
            if (cursor) {
                Liquid.pasteFromClipBoradExec( liquid, cursor.controlId, cursor.columns, cursor.rows );
            }
        }
    },
    pasteFromClipBoradExec:function(liquid, controlId, columns, rows) {
        if(liquid) {
            if(controlId) {
                var sourceLiquid = Liquid.getLiquid(controlId);                
                if(columns) {
                    var columnsJson = JSON.parse(columns);
                    if(columnsJson) {
                        var columnsMap1B = new Array(columnsJson.length);
                        for(var ic=0; ic<columnsJson.length; ic++) {
                            for(var ict=0; ict<liquid.tableJson.columns.length; ict++) {
                                if(liquid.tableJson.columns[ict].name === columnsJson[ic].name) {
                                    columnsMap1B[ic] = (ict+1);
                                    break;
                                }
                            }
                        }
                        var rowsJson = JSON.parse(rows);
                        if(rowsJson) {
                            var defaultRow = new Array(liquid.tableJson.columns);
                            for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                defaultRow[ic] = liquid.tableJson.columns[ic].default;
                            }
                            for(var ir=0; ir<rowsJson.length; ir++) {
                                var newRow = new Array(defaultRow);
                                for(var ic=0; ic<columnsJson.length; ic++) {
                                    var targetCol1B = columnsMap1B[ic];
                                    if(targetCol1B) {
                                        newRow[targetCol1B-1] = rowsJson[ir][ic+1];
                                    }
                                }
                                Liquid.addRow(liquid);
                                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                    if(liquid.tableJson.primaryKey !== liquid.tableJson.columns[ic].name) {
                                        if(liquid.addingRow) {
                                            if(newRow[ic]) {
                                                liquid.addingRow[ic+1] = newRow[ic];
                                            }
                                        }
                                    }
                                }
                                if(Liquid.onPreparedRow(liquid, false) > 0) {
                                    // N.B.: onPastedRow is system event
                                    Liquid.onEvent(liquid, "onPastedRow", liquid.addingRow, null, null, false);
                                } else {
                                    // failed
                                    if(liquid.addingRow) {
                                        liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                                    }
                                    liquid.addingRow = null;
                                    liquid.addingNode = null;
                                    delete liquid.modifications;
                                    liquid.modifications = null;
                                }
                            }
                        } else {
                            console.error("ERROR: pasteFromClipBorad(): controlId "+controlId+" has no rows to paste");
                        }
                    }
                } else {
                    console.error("ERROR: pasteFromClipBorad(): controlId "+controlId+" has no columns definition");
                }
            } else {
                console.error("ERROR: pasteFromClipBorad(): controlId "+controlId+" not found");
            }
        }
    },
    getDB:function() {
        if(glLiquidDBEnable) {
            if(!glLiquidDB) {
                if(isDef(window.openDatabase)) {
                    glLiquidDB = window.openDatabase('Liquid', '1.0', 'LiquidDB', Liquid.loadDBInitialSize); 
                    if(glLiquidDB) {
                        glLiquidDB.transaction(function (tx) {
                            tx.executeSql('CREATE TABLE IF NOT EXISTS WORKERS (id INTEGER PRIMARY KEY,userId TEXT,status TEXT,controlId TEXT,command TEXT, date DATETIME)'); 
                            tx.executeSql('CREATE TABLE IF NOT EXISTS CLIPBOARD (id INTEGER PRIMARY KEY,controlId TEXT,columns TEXT, rows TEXT, date DATETIME)'); 
                        }, null);
                    }
                } else {
                    // TODO : localStorage o window.indexedDB
                    if(glLiquidIDB === null) {
                        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
                        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
                        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
                        if(isDef(window.indexedDB)) {
                            // var idbCallback = function (e) { console.load("idbCallback():"+e); }
                            // var request = window.indexedDB.open("LiquidDB", Liquid.loadDBversion, idbCallback);
                            var request = window.indexedDB.open("LiquidDB", Liquid.loadDBversion);
                            request.onerror = function(event) {
                                console.error("IndexedDB not enabled! error:"+event.target.error.message);
                                event.target.readyState = 'done';
                            };
                            request.onsuccess = function(event) { 
                                glLiquidIDB = event.target.result;
                                event.target.readyState = 'done';
                            };
                            request.onupgradeneeded = function(event) {
                                try {
                                    glLiquidIDB = event.target.result;
                                    // var transaction = glLiquidIDB.transaction([],  IDBTransaction.READ_WRITE, 2000);
                                    // transaction.oncomplete = function(){}
                                    if (!glLiquidIDB.objectStoreNames.contains('WORKERS')) {
                                        var objStoreWorker = glLiquidIDB.createObjectStore("WORKERS", { autoIncrement : true } );
                                        objStoreWorker.createIndex('id', 'id', {keyPath: 'id', autoIncrement:true});
                                        objStoreWorker.createIndex("userId", "userId", { unique: false });
                                        objStoreWorker.createIndex("status", "status", { unique: false });
                                        objStoreWorker.createIndex("controlId", "controlId", { unique: false });
                                        objStoreWorker.createIndex("command", "command", { unique: false });
                                        objStoreWorker.createIndex("date", "date", { unique: false });
                                    }
                                    if (!glLiquidIDB.objectStoreNames.contains('CLIPBOARD')) {
                                        var objStoreClipboard = glLiquidIDB.createObjectStore("CLIPBOARD", { autoIncrement : true } );
                                        objStoreClipboard.createIndex('id', 'id', {keyPath: 'id', autoIncrement:true});
                                        objStoreClipboard.createIndex("controlId", "controlId", { unique: false });
                                        objStoreClipboard.createIndex("columns", "command", { unique: false });
                                        objStoreClipboard.createIndex("rows", "rows", { unique: false });
                                        objStoreClipboard.createIndex("date", "date", { unique: false });
                                    }
                                } catch(e) {
                                    console.error("IndexedDB not enabled! error:"+e);                                
                                }
                                event.target.readyState = 'done';
                            };
                            
                            request.onblocked = function(event) {
                                console.log("Please close all other tabs with this site open!");
                            };
                            if(Liquid.wait_for_indexdb_ready(request, "")) {
                                glLiquidIDB = request.result;
                            }
                        } else {
                            alert("This browser desn't support HTML WebDB\n\nUnable to use local database");
                            glLiquidDBEnable = false;
                        }
                    } else {
                        return glLiquidIDB;
                    }
                }
            }
        }
    },
    wait_for_indexdb_ready:function(request, title) {
        if(request.readyState !== 'done') {
            console.log("wait_for_indexdb_ready:"+request.readyState);
            var timeout_msec = 10000;
            const date = Date.now();
            var currentDate = null;
            do {
                currentDate = Date.now();
            } while (request.readyState != 'done' && currentDate - date < timeout_msec)
            if(request.readyState === 'done') {
                return true;
            }
        } else {
            return true;
        }
        return false;
    },
    getHTMLElementOffset:function offset(element) {
        var top = 0, left = 0;
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        do {
            top += element.offsetTop  || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while(element);    
        return { top: top + scrollTop, left: left + scrollLeft };
    },
    getGlobalVarByContent:function(content) {
        for(var prop in window) {
            try {
                if(typeof window[prop] === 'string')
                    if(window[prop] === content)
                        return prop;
            } catch (e) {}
        }
        return null;
    },
    setDraggable:function(obj) {
        obj.draggable = true;
        obj.ondragstart = function(event) { Liquid.onDragStart(event); };
        // obj.style.backgroundColor = 'blue';
    },
    onAllowDrop:function(event) {
        event.preventDefault();
    },
    onDragStart:function(event) {
        if(event.target.id) {
            event.dataTransfer.setData("text", event.target.id);
        } else {
            console.error("ERROR: unable to start drag .. empty id");
        }
    },
    onDrop:function(event) {
        if(event.target) {
            var liquidMenuX = Liquid.getLiquid(event.target.id);
            if(liquidMenuX) {
                if(event.target.classList.contains('liquidMenuX') || event.target.classList.contains('liquidMenuXContainer')) {
                    var sourceObjId = event.dataTransfer.getData("text");
                    var sourceObj = document.getElementById(sourceObjId);
                    if(sourceObj) {
                        var liquid = Liquid.getLiquid(sourceObjId);
                        if(liquid) {
                            var WinXContainer = liquid.parentObjId;
                            var controlId = liquid.controlId;
                            var controlName = liquid.tableJson.name ? liquid.tableJson.name : liquid.tableJson.caption;
                            var winXJsonString = liquid.tableJsonVariableName;
                            var winStatus = "maximized";
                            if(winXJsonString === null) {
                                winXJsonString = controlId.replace(/\ /g, "_").replace(/\-/g, "_").replace(/\./g, "_")+"_JSON";
                                window[winXJsonString] = JSON.stringify(liquid.tableJsonSource);
                                alert("WARNING : adding runtime window : you should store it inside variable : ", winXJsonString);
                            }
                            var clientCmd = "Liquid.startWinX('"+controlId+"', "+winXJsonString+", '"+WinXContainer+"', '"+winStatus+"')";
                            var liquidMenuXJson = liquidMenuX.menuJsonSource;
                            var cmdName = prompt("Enter command name", "Open "+controlName);
                            if(cmdName) {
                                if(typeof liquidMenuXJson.commands === 'undefined' || !liquidMenuXJson.commands)
                                    liquidMenuXJson.commands = [];
                                var newCommand = { name:cmdName, client:clientCmd, server:"" };
                                liquidMenuXJson.commands.push( newCommand );
                                Liquid.rebuild(liquidMenuX, liquidMenuX.outDivObj.id, liquidMenuXJson);
                            }
                        }
                    }
                } else {
                    console.error("ERROR: control type not recognized");
                }
            } else if(event.target.classList.contains('liquidWinXContainer')) {
                if(event.dataTransfer.items) {
                    for (var i = 0; i < event.dataTransfer.items.length; i++) {
                        if(event.dataTransfer.items[i].kind === 'file') {
                            var file = event.dataTransfer.items[i].getAsFile();
                            Liquid.onNewWindowFromFileJson(event.target.id, "winX", event.target.id, file);
                            // console.log('... file[' + i + '].name = ' + file.name);
                        }
                    }
                } else {
                    for (var i = 0; i < event.dataTransfer.files.length; i++) {
                        var file = event.dataTransfer.files[i];
                        Liquid.onNewWindowFromFileJson(event.target.id, "winX", event.target.id, file);
                        // console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
                    }
                }
            }
        }
        event.stopPropagation();
        event.preventDefault();
    },
    rebuild:function(liquid, outDivObjOrId, tableJson) {
        if(liquid){
            if(outDivObjOrId) {
                setTimeout(function(){ Liquid.doRebuild(liquid, outDivObjOrId, tableJson); }, 250);
            }
        }
    },
    doRebuild:function(liquid, outDivObjOrId, tableJson) {
        if(liquid){
            if(outDivObjOrId) {
                var controlId=liquid.controlId;
                var sourceData = { liquidOrId:liquid.srcLiquid, foreignWrk:liquid.srcForeignWrk, foreignTable:liquid.srcForeignTable, foreignColumn:liquid.srcForeignColumn, column:liquid.srcColumn, rootControlId:liquid.rootControlId, isRebuilding:true };
                if(liquid.outDivObj)
                    liquid.outDivObj.innerHTML = "";
                if(liquid instanceof LiquidCtrl) {
                    tableJson.token = liquid.tableJson.token;
                    tableJson.askForSave = liquid.tableJson.askForSave || liquid.askForSave;
                    Liquid.destroy(liquid);                    
                    new LiquidCtrl( controlId, outDivObjOrId, JSON.stringify(tableJson)
                                    , sourceData
                                    , liquid.mode, liquid.parentObjId );
                } else if(liquid instanceof LiquidMenuXCtrl) {
                    tableJson.token = liquid.menuJson.token;
                    tableJson.askForSave = liquid.menuJson.askForSave || liquid.askForSave;
                    Liquid.destroy(liquid);                    
                    new LiquidMenuXCtrl(outDivObjOrId, JSON.stringify(tableJson), liquid.options  );
                }
            }
        }
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
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit by values list:<input readonly=readonly; id=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromValues)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit by codes as values list:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromValuesCodes)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit selecting column:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromColumn)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt4"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Rich text editor:<input readonly=readonly; id=\"opt4\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorRich)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt5"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date editor:<input readonly=readonly; id=\"opt5\" type=\"text\" class=\"liquidSystemDialogInput\" value='"+JSON.stringify(editorDate)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt6"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date/time editor:<input readonly=readonly; id=\"opt6\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorDateTime)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt7"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date/time editor:<input readonly=readonly; id=\"opt6\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorCode)+"'/></p>"
                    ;
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
            dlg.display = 'none';
            dlg.innerHTML = "<div class=\"liquidEditorDialog-content\">"
                    +"<span class=\"liquidContextMenu-close\"></span>"
                    +"Editor:<input id=\""+resultId+"\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+""+"'/>"
                    +"</br>"
                    +"</br>"
                    +"</br>"
                    +"Commom values</br>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by global variable:<input readonly=readonly; id=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupVariable)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by local content:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupContent)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by shared controlId:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupShared)+"'/></p>"
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
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup options:<input readonly=readonly; d=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsFull)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Minimal options:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsMinimal)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"Liquid.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Base options:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsBase)+"'/></p>"
                    ;
        }
        return dlg;
    },
    onSystemEditorClose:function(objId) {
        var liquid = Liquid.getLiquid(objId);
        if(liquid) {
            liquid.gridOptions.api.stopEditing();
        }
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
    createPopup:function( content, img ) {
        var popup = document.getElementById("liquidPopup");
        if(!popup) {
            popup = document.createElement('div');
            popup.id = "liquidPopup";
            popup.className = "liquidContextMenu";            
            document.body.appendChild(popup);
        }
        
        popup.style.display = '';            
        popup.innerHTML = "<div class=\"liquidContextMenu-content\" style=\"position:relative; margin:auto; top:20%; width:270px;\">"
                + "<span class=\"liquidContextMenu-close\"></span>"
                + "<table><tr><td>"
                + (typeof img !== 'undefined' && img ? "<img src=\""+img+"\" width=\"32\" height=\"32\"/>" : "")
                + "</td><td>"
                + content
                + "</td></tr></table>"
                + "</div>";        
        var span = document.getElementsByClassName("liquidContextMenu-close")[0];
        span.onclick = function() { popup.style.display = "none"; };
        window.onclick = function(event) { if(event.target === popup) popup.style.display = "none"; };
        return popup;
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
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var ckeckImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var onCancelCode = "Liquid.onContextMenuClose();";
        
        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        var innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>";
        if(liquid && liquid.controlId) {
            innerHTML += ""
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewGrid('"+liquid.controlId+".newGrid')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Grid"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewForeignTable('"+liquid.controlId+".newForeignTable','')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Foreign Table"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewForeignTable('"+liquid.controlId+".newForeignTable','multipanel')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Multipanel"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewFilters('"+liquid.controlId+".newFilters')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Filters"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewFilters('"+liquid.controlId+".newFilter')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Filter"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewEvent('"+liquid.controlId+".newEvent')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Event"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewCommandBar('"+liquid.controlId+".newActionBar')\" >"+ckeckImg+"<a href=\"javascript:void(0)\" >Add Command Bar"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewActionBar('"+liquid.controlId+".newActionBar')\" >"+ckeckImg+"<a href=\"javascript:void(0)\" >Add Action Bar"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewColumns('"+liquid.controlId+".newColumns')\" >"+addImg+"<a href=\"javascript:void(0)\" >New columns"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onColumnsManager('"+liquid.controlId+".columnsManager')\">"+optImg+"<a href=\"javascript:void(0)\">Columns options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as csv"+"</a></p>"        
                +"</div>";
        }
        menu.innerHTML = innerHTML;
    },
    createOnCommandBarContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewCommand('"+liquid.controlId+".newCommand')\" >"+addImg+"<a href=\"javascript:void(0)\">New Command"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as csv"+"</a></p>"        
                +"</div>";        
    },
    createOnWindowContainerContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        
        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Set Connection\" onclick=\"Liquid.onLiquidConnection(event)\" >"+dbImg+"<a href=\"javascript:void(0)\" >Set Connection"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Current:"+Liquid.curDatabase+"\"onclick=\"Liquid.onSetDatabase(event)\" >"+dbImg+"<a href=\"javascript:void(0)\" >Select database"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Current:"+Liquid.curSchema+"\" onclick=\"Liquid.onSetSchema(event)\" >"+storeImg+"<a href=\"javascript:void(0)\" >Select schema"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSearchDatabase(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on databases"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSearchSchema(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on schemas"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSearchTable(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on table"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewWindow(event, 'winX','"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New window"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onNewWindowFromJson(event, 'winX','"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New window from json"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidAssets()\">"+optImg+"<a href=\"javascript:void(0)\">Manage assets"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidRoles()\">"+optImg+"<a href=\"javascript:void(0)\">Manage roles"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidRolesAssets()\">"+optImg+"<a href=\"javascript:void(0)\">Manage roles's assets"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidUsersRoles()\">"+optImg+"<a href=\"javascript:void(0)\">Manage user's roles"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidUsersAsset()\">"+optImg+"<a href=\"javascript:void(0)\">Manage user's assets"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onLiquidOptions()\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"</div>";        
    },
    createOnFormXContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as csv"+"</a></p>"        
                +"</div>";                
    },
    getCheckedAttr:function( obj, def ) {
        if(typeof obj === 'undefined') { if(def === true) return "checked"; } else { if(obj === true) return "checked"; }
        return "";
    },
    createLiquidOptionsContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = Liquid.createContextMenu();
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>";
        
        var controlId = liquid.controlId;
        var formId = controlId+".optionsForm";

        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "Liquid.onContextMenuClose(); Liquid.onOptionsOk('"+formId+"','"+controlId+"');";
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
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Primary key:"+"<input id=\"primaryKey\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.primaryKey !== 'undefined' ? tagetLiquid.tableJson.primaryKey : '')+"\" list=\"primaryKeyDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"primaryKeyDataliast\"><option></option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Lookup Field:"+"<input id=\"lookupField\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.lookupField !== 'undefined' ? tagetLiquid.tableJson.lookupField : '')+"\" list=\"lookupFieldDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"lookupFieldDataliast\"><option value=\"closed\">closed</option><option value=\"open\">open</option></datalist>"
                +"</td><td>"
                +"</td></tr>"
        
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Mode:"+"<input id=\"status\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.status !== 'undefined' ? tagetLiquid.tableJson.status : '')+"\" list=\"statusDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"statusDataliast\"><option value=\"closed\">closed</option><option value=\"open\">open</option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Modeless:"+"<input id=\"modeless\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.modeless, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Resize:"+"<input id=\"resize\" type=\"text\" value=\"\" list=\"resizeDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"resizeDataliast\"><option value=\"both\">both</option><option value=\" \"></option></datalist>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Left:"+"<input id=\"left\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.left !== 'undefined' ? tagetLiquid.tableJson.left : "")+"\" list=\"leftDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"leftDataliast\"><option value=\"centerLeft\">centerLeft</option><option value=\"\"></option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Top:"+"<input id=\"top\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.top !== 'undefined' ? tagetLiquid.tableJson.top : "")+"\" list=\"topDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"topDataliast\"><option value=\"centerLeft\">centerTop</option><option value=\"\"></option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Width:"+"<input id=\"width\" min=\"0\" type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.width !== 'undefined' ? tagetLiquid.tableJson.width : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Height:"+"<input id=\"height\" min=\"0\" type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.height !== 'undefined' ? tagetLiquid.tableJson.height : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Filter mode:"+"<input id=\"left\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.filterMode !== 'undefined' ? tagetLiquid.tableJson.filterMode : "")+"\" list=\"filterModeDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"filterModeDataliast\"><option value=\"\"></option><option value=\"client\">client</option><option value=\"client\">dynamic</option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Sort mode:"+"<input id=\"top\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.sortMode !== 'undefined' ? tagetLiquid.tableJson.sortMode : "")+"\" list=\"sortModeDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"sortModeDataliast\"><option value=\"\"></option><option value=\"client\">client</option><option value=\"server\">server</option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Navigation bar visible:"+"<input id=\"navVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.navVisible, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Checkbox selection:"+"<input id=\"checkboxSelection\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.checkboxSelection, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row selection:"+"<input id=\"rowSelection\"type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.rowSelection !== 'undefined' ? tagetLiquid.tableJson.rowSelection : "")+"\" list=\"rowSelectionDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"rowSelectionDataliast\"><option value=\"single\">single</option><option value=\"multiple\">multiple</option></datalist>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row multiselect with click:"+"<input id=\"rowMultiSelectWithClick\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.rowMultiSelectWithClick, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Reset selection on row change:"+"<input id=\"resetSelectionOnRowChange\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.resetSelectionOnRowChange, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row deselection:"+"<input id=\"rowDeselection\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.rowDeselection, false)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto select:"+"<input id=\"autoSelect\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.autoSelect, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto load:"+"<input id=\"autoload\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.autoload, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Editable:"+"<input id=\"editable\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.editable, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Edit type:"+"<input id=\"editType\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.editType !== 'undefined' ? tagetLiquid.tableJson.editType : "")+"\" list=\"editTypeDataliast\" onmousedown=\"this.value =''\" "+onKeyPressCode+"/></p>"
                +"<datalist id=\"editTypeDataliast\"><option value=\"\"></option><option value=\"fullRow\">fullRow</option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"single click edit:"+"<input id=\"singleClickEdit\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.singleClickEdit, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Skip header on auto size:"+"<input id=\"skipHeaderOnAutoSize\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.skipHeaderOnAutoSize, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto size columns:"+"<input id=\"autoSizeColumns\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.autoSizeColumns, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto fit columns:"+"<input id=\"autoFitColumns\" type=\"checkbox\" v"+Liquid.getCheckedAttr(tagetLiquid.tableJson.autoFitColumns, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"List Tab title:"+"<input id=\"listTabTitle\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.listTabTitle !== 'undefined' ? tagetLiquid.tableJson.listTabTitle : "Lista")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Loading Message:"+"<input id=\"loadingMessage\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.loadingMessage !== 'undefined' ? tagetLiquid.tableJson.loadingMessage : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Command bar visible:"+"<input id=\"commandBarVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.commandBarVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"List tab visible:"+"<input id=\"listTabVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.listTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Grids tab visible:"+"<input id=\"gridsTabVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.gridsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Layouts tab visible:"+"<input id=\"layoutsTabVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.layoutsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Documents tab visible:"+"<input id=\"documentsTabVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.documentsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Charts tabs visible:"+"<input id=\"chartsTabVisible\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.chartsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"



                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"pageSize:"+"<input id=\"pageSize\" type=\"number\" value=\""+(typeof tagetLiquid.tableJson.pageSize !== 'undefined' ? tagetLiquid.tableJson.pageSize : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Cache:"+"<input id=\"cache\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.cache, true)+""+onKeyPressCode+" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Header menu:"+"<input id=\"headerMenu\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.headerMenu, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"owner:"+"<input id=\"owner\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.owner !== 'undefined' ? tagetLiquid.tableJson.owner : "com.liquid.event")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Create table if missing:"+"<input id=\"createTableIfMissing\" type=\"checkbox\" "+Liquid.getCheckedAttr(tagetLiquid.tableJson.createTableIfMissing, false)+" "+onKeyPressCode+"/></p>"
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
    createGeneralOptionsContextMenu:function( obj ) {
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";
        
        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";

        var formId = "Liquid.options";
        
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidGeneralOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block; position:relative; top:10px;\">"
                +"<tr><td colspan=\"3\"><center>"
                +"<span style=\"font-size:200%\">Liquid Options<span>"
                +"</center></td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Language:"+"<input id=\"lang\" type=\"text\" value=\""+(Liquid.lang ? Liquid.lang : "eng")+"\" list=\"langDataliast\" autocomplete=\"false\" onmousedown=\"this.value =''\" /></p>"
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
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Clean Data:"+"<input id=\"cleanData\" type=\"checkbox\" "+Liquid.getCheckedAttr(Liquid.cleanData, true)+" /></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Date separator:"+"<input id=\"dateSep\" type=\"text\" value=\""+(Liquid.dateSep ? Liquid.dateSep : "")+"\" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Time separator:"+"<input id=\"lang\" type=\"text\" value=\""+(Liquid.timeSep ? Liquid.timeSep : ":")+"\" /></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Project mode:"+"<input id=\"projectMode\" "+"disabled readonly" + " type=\"checkbox\" "+Liquid.getCheckedAttr(Liquid.projectMopde, true)+" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Debug mode:"+"<input id=\"debug\" " + (Liquid.projectMopde ? "" : "disabled readonly") +" type=\"checkbox\" "+Liquid.getCheckedAttr(Liquid.debug, true)+" /></p>"
                +"</td></tr>"


                +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                +"<tr><td style=\"text-align: center;\">"
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose();\">Cancel</button>"
                +"</td><td>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose(); Liquid.onLiquidOptionsOk('"+formId+"')\">Ok</button>"
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
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";

        var onCancelCode = "Liquid.onContextMenuClose();";
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
                +"<p class=\"liquidContextMenu-item\" style=\"width:480px;\">"+optImg+"Driver:"+"<input id=\"curDriver\" type=\"text\" style=\"width:475px; height:32px\" value=\""+(Liquid.curDriver ? Liquid.curDriver : "")+"\" list=\"driverDataliast\" autocomplete=\"false\" onmousedown=\"this.value =''\" /></p>"
                +"<datalist id=\"driverDataliast\"><option value=\"oracle.jdbc.driver.OracleDriver\">Oracle</option>"
                +"<option value=\"com.mysql.jdbc.Driver\">MySQL</option>"
                +"<option value=\"org.postgresql.Driver\">Postgres</option>"
                +"<option value=\"com.microsoft.sqlserver.jdbc.SQLServerDriver\">SqlServer</option></datalist>"
                +"</td></tr>"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:480px;\">"+optImg+"Connection URL:"+"<input id=\"curConnectionURL\" style=\"width:475px; height:32px\" type=\"text\" value=\""+(Liquid.curConnectionURL !== 'undefined' ? Liquid.curConnectionURL : "")+"\" list=\"curConnectionURLDataliast\" autocomplete=\"false\" onmousedown=\"this.value =''\" /></p>"
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
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose();\">Cancel</button>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose(); Liquid.onLiquidConnectionOk('"+formId+"')\">Ok</button>"
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
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";

        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";        
        
        var formId = "Liquid.event";
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidEvent\" style=\"max-height:95%; overflow:auto; display:block; position:relative; top:10px;\">"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:780px;\">"+optImg+"Event:"+"<input id=\"name\" type=\"text\" style=\"width:775px; height:32px\" value=\""+(Liquid.curDriver ? Liquid.curDriver : "")+"\" list=\"nameDataliast\" autocomplete=\"false\" onmousedown=\"this.value =''\" /></p>"
                +"<datalist id=\"nameDataliast\">"
                +"<option value=\"onFirstLoad\">on first time loaded control</option>"
                +"<option value=\"onLoad\">on loaded windows</option>"
                +"<option value=\"onRowSelected\">on row selected</option>"
                +"<option value=\"onRowUnSelected\">on row unselected</option>"
                +"<option value=\"onRowClicked\">on row clicked</option>"        
                +"<option value=\"onRowRendering\">on row rendering</option>"
                +"<option value=\"onCellClicked\">on cell clicked</option>"
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
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose();\">Cancel</button>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"Liquid.onContextMenuClose(); Liquid.onNewEventOk('"+formId+"','"+objId+"')\">Ok</button>"
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
        var menu = Liquid.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var ckeckImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "Liquid.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Sate to server"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"Liquid.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as json"+"</a></p>"
                +"</div>";        
    },
    onContextMenu:function(e) {
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
                Liquid.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidMenuX') || e.target.classList.contains('liquidMenuXContainer')) {
                Liquid.createOnMenuContextMenu(e.target);
            } else if(e.target.classList.contains('liquidCommandBar') || e.target.classList.contains('liquidCommandText') || e.target.classList.contains('liquidCommandImg')) {
                Liquid.createOnCommandBarContextMenu(e.target);
            } else if(e.target.classList.contains('liquidWinXContainer')) {
                Liquid.createOnWindowContainerContextMenu(e.target);
            } else if(e.target.classList.contains('liquidOptions')) {
                Liquid.createLiquidOptionsContextMenu(e.target);
            } else if(e.target.classList.contains('liquidGeneralOptions')) {
                Liquid.createGeneralOptionsContextMenu(e.target);
            } else if(e.target.classList.contains('liquidConnection')) {
                Liquid.createConnectionContextMenu(e.target);
            } else if(e.target.classList.contains('liquidEvent')) {
                Liquid.createEventContextMenu(e.target, e.target.id);
            } else if(e.target.classList.contains('ag-cell')) {
                return true;
            } else if(e.target.classList.contains('ag-header-cell')) {
                return true;
            } else if(e.target.classList.contains('ag-header-cell')) {
                return true;
            } else if(e.target.classList.contains('liquidFilterLabel')) {
                Liquid.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFilterTbl')) {
                Liquid.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFilterInput')) {
                Liquid.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFiltersSpacer')) {
                Liquid.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFormX')) {
                Liquid.createOnFormXContextMenu(e.target);
            } else return;            
            var modal = document.getElementById('liquidContextMenu');
            modal.style.display = "block";
            var modal_content = document.querySelector('.liquidContextMenu-content');
            modal_content.style.left = (e.clientX+5)+'px';
            modal_content.style.top = (e.clientY+5)+'px';
            modal_content.style.position = "relative";
            var span = document.getElementsByClassName("liquidContextMenu-close")[0];
            span.onclick = function() { modal.style.display = "none"; };
            window.onclick = function(event) { if(event.target === modal) modal.style.display = "none"; };
            return true;
        }
        return false;
    },
    onContextMenuClose() {
        var span = document.getElementsByClassName("liquidContextMenu-close")[0];
        if(span) span.click();
    },
    showFrame:function(frameId) {
        if(glLastFrameId) {
            if(glLastFrameId !== frameId) {
                var LastFrameId = glLastFrameId;
                $( "#"+LastFrameId ).slideUp( "fast", function() {
                    $( "#"+LastFrameId ).css("display","none");
                });
            }
        }
        $( "#"+frameId ).css("display","");
        $( "#"+frameId ).css("overflow","visible");
        $( "#"+frameId ).css("visibility","visible");
        $( "#"+frameId ).slideDown( "fast", function() {
            glLastFrameId = frameId;
        });
    },    
    removeRuntimeProps(liquid) {
        return Liquid.removeRuntimeTableJsonProps(liquid.tableJson);
    },
    removeRuntimeTableJsonProps(tableJson) {
        if(isDef(tableJson.columns) && tableJson.columns) {
            for(var ic=0; ic<tableJson.columns.length; ic++) {
                delete tableJson.columns[ic].field;
                if(tableJson.createTableIfMissing !== true) {
                    delete tableJson.columns[ic].default;
                    delete tableJson.columns[ic].size;
                    delete tableJson.columns[ic].nullable;
                    delete tableJson.columns[ic].autoIncString;
                    delete tableJson.columns[ic].type;
                    delete tableJson.columns[ic].typeName;
                    delete tableJson.columns[ic].digits;
                } else {
                    if(isDef(tableJson.columns[ic].default) && tableJson.columns[ic].default)
                        tableJson.columns[ic].default = tableJson.columns[ic].default.replace(/\"/g, "\\\"");
                }
            }
        }
        delete tableJson.askForSave;
        delete tableJson.token;
        delete tableJson.idColumnField;
        delete tableJson.primaryKeyField;
        delete tableJson.columnsResolved;
        delete tableJson.columnsResolvedBy;
        delete tableJson.tableJsonVariableName;
        delete tableJson.selection;
        delete tableJson.selections;
        delete tableJson.sourceFileName;
        return true;
    },
    onSaveToServer(obj) {
        return Liquid.onSaveTo(obj, false, true);
    },
    onSaveToJSON(obj) {
        return Liquid.onSaveTo(obj, true, false);
    },
    onSaveTo(obj, bDownload, bSaveToServer) {
        Liquid.onContextMenuClose();
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var json = null;
            if(liquid instanceof LiquidCtrl) {
                json = JSON.parse(JSON.stringify(liquid.tableJsonSource));
            } else if(liquid instanceof LiquidMenuXCtrl) {
                json = JSON.parse(JSON.stringify(liquid.menuJsonSource));
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
                                    +'&token=' + (typeof json.token !== "undefined" ? json.token : "")
                                    , true);
                            liquid.xhr.send(tableJsonString);
                            liquid.xhr.onreadystatechange = function() {
                                if(liquid.xhr.readyState === 4) {
                                    Liquid.release_xhr(liquid);
                                    Liquid.stopWaiting(liquid);
                                    if(liquid.xhr.status === 200) {
                                        // \b \f \n \r \t
                                        var responseText = liquid.xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
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
                                                liquid.askForSave = false;
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
    onSaveToCSV:function(obj) {
        Liquid.onContextMenuClose();
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.gridOptions.api.exportDataAsCsv();
        }
    }
};
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if(typeof e==="undefined"||typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=t.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in r,a=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},i=/constructor/i.test(e.HTMLElement)||e.safari,f=/CriOS\/[\d]+/.test(navigator.userAgent),u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},s="application/octet-stream",d=1e3*40,c=function(e){var t=function(){if(typeof e==="string"){n().revokeObjectURL(e)}else{e.remove()}};setTimeout(t,d)},l=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var o=e["on"+t[r]];if(typeof o==="function"){try{o.call(e,n||e)}catch(a){u(a)}}}},p=function(e){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)){return new Blob([String.fromCharCode(65279),e],{type:e.type})}return e},v=function(t,u,d){if(!d){t=p(t)}var v=this,w=t.type,m=w===s,y,h=function(){l(v,"writestart progress write writeend".split(" "))},S=function(){if((f||m&&i)&&e.FileReader){var r=new FileReader;r.onloadend=function(){var t=f?r.result:r.result.replace(/^data:[^;]*;/,"data:attachment/file;");var n=e.open(t,"_blank");if(!n)e.location.href=t;t=undefined;v.readyState=v.DONE;h()};r.readAsDataURL(t);v.readyState=v.INIT;return}if(!y){y=n().createObjectURL(t)}if(m){e.location.href=y}else{var o=e.open(y,"_blank");if(!o){e.location.href=y}}v.readyState=v.DONE;h();c(y)};v.readyState=v.INIT;if(o){y=n().createObjectURL(t);setTimeout(function(){r.href=y;r.download=u;a(r);h();c(y);v.readyState=v.DONE});return}S()},w=v.prototype,m=function(e,t,n){return new v(e,t||e.name||"download",n)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(e,t,n){t=t||e.name||"download";if(!n){e=p(e)}return navigator.msSaveOrOpenBlob(e,t)}}w.abort=function(){};w.readyState=w.INIT=0;w.WRITING=1;w.DONE=2;w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null;return m}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!==null){define("FileSaver.js",function(){return saveAs})}



function dragElement(controlId, divObj) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if(divObj.offsetHeight)
        divObj.style.height = divObj.offsetHeight + "px";
    divObj.style.position = "absolute";
    if(document.getElementById(controlId + ".caption_dragger")) {
        document.getElementById(controlId + ".caption_dragger").onmousedown = dragMouseDown;
    } else {
        divObj.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        Liquid.setFocus(controlId);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        divObj.style.top = (divObj.offsetTop - pos2) + "px";
        divObj.style.left = (divObj.offsetLeft - pos1) + "px";
        var controlId = divObj.getAttribute('liquid');
        if(controlId) {
            var liquid = Liquid.getLiquid(controlId);
            if(liquid) {
                if(liquid.isIconic)  {
                    if(liquid.iconicPos) {                            
                        liquid.iconicPos.top = (divObj.offsetTop - pos2);
                        liquid.iconicPos.left = (divObj.offsetLeft - pos1);
                    }
                }
            }
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

String.prototype.toCamelCase = function() {
    return this
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
};

const capitalizeFirstLetter = (s) => {
    if(typeof s !== 'string')
        return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/ /g, "");
};

// Editors
function IntegerEditor() {}
IntegerEditor.prototype.init = function(params) {
    this.eInput = document.createElement('input');
    this.eInput.type = "number";
    this.eInput.step = 1;
    this.eInput.onkeypress = function(event) {
        return (event.charCode === 8 || event.charCode === 0 || event.charCode === 13) ? null : event.charCode >= 48 && event.charCode <= 57;
    };
    this.eInput.value = params.value;
    this.eInput.style.zIndex = 30000;
};
IntegerEditor.prototype.getGui = function() {
    return this.eInput;
};
IntegerEditor.prototype.afterGuiAttached = function() {
    this.eInput.focus();
    this.eInput.select();
};
IntegerEditor.prototype.getValue = function() { return this.eInput.value; };
IntegerEditor.prototype.destroy = function() {};
IntegerEditor.prototype.isPopup = function() {
    return false;
};


function FloatEditor() {}
FloatEditor.prototype.init = function(params) {
    this.eInput = document.createElement('input');
    this.eInput.type = "number";
    this.eInput.value = params.value;
    this.eInput.style.zIndex = 30000;
};
FloatEditor.prototype.getGui = function() {
    return this.eInput;
};
FloatEditor.prototype.afterGuiAttached = function() {
    this.eInput.focus();
    this.eInput.select();
};
FloatEditor.prototype.getValue = function() { return this.eInput.value; };
FloatEditor.prototype.destroy = function() {};
FloatEditor.prototype.isPopup = function() {
    return false;
};


function DateEditor() {}
DateEditor.prototype.init = function(params) {
    this.col = Liquid.getColumn(params.liquid, params.colDef.field);
    this.format = (this.col.format !== 'undefined' ? this.col.format : 'dd'+Liquid.dateSep+'mm'+Liquid.dateSep+'yy');
    this.params = params;

    this.eInput = document.createElement('div');
    this.eInput.style.width = '250px';
    // this.eInput.style.height = '280px';
    this.eInput.style.border = '0px solid red';
    this.eInput.style.display = 'block';
    document.body.appendChild(this.eInput);

    this.eInputX = document.createElement('input');
    this.eInputX.id = 'LiquidDatepicker.' + params.liquid.controlId+"."+this.col.name+"";
    this.eInputX.value = params.value;
    this.eInputX.style.zIndex = 30000;
    this.eInputX.style.width = '100%';
    this.eInputX.style.height = '25px';
    this.eInput.appendChild(this.eInputX);
    
    this.controlName = Liquid.createDateTimePicker(this.col, this.eInputX, false, this.params.liquid, this.params );
};
DateEditor.prototype.getGui = function() { return this.eInput; };
DateEditor.prototype.afterGuiAttached = function() {    
    this.eInputX.parentNode.parentNode.style.zIndex = 50000;
    this.dp = this.getControlObj(this.controlName, this.eInputX);
    if(this.dp) {
        // $(this.eInput).append(this.dp);
        // $(this.dp).css('position', 'unset');
        // $(this.dp).css('display', 'block');
        // $(this.dp).css('width', '100%');
        // $(this.dp).css('height', '100%');
        // $(this.dp).css('top', '0');
        // $(this.dp).css('left', '0');
    }
    this.eInputX.focus();
    this.eInputX.select();
};
DateEditor.prototype.getValue = function() { return this.eInputX.value; };
DateEditor.prototype.destroy = function() { /*this.dp.parentNode.removeChild(this.dp);*/ };
DateEditor.prototype.isPopup = function() { return true; };
DateEditor.prototype.getControlObj = function(controlName, linkedObj) {
    var dpList = $(this.controlName);
    return dpList && dpList.length ? dpList[0] : null;
};


function SelectEditor() {}
SelectEditor.prototype.init = function(params) {
    this.eInput = document.createElement('select');
    this.eInput.style.width = '100%';
    this.eInput.style.height = '100%';
    this.rowIndex = params.rowIndex;
    this.iCol = params.iCol;
    this.table = params.table;
    this.column = params.column;
    this.idColumn = params.idColumn;
    this.targetColumn = params.targetColumn;
    this.cellEditorParams = params.colDef.cellEditorParams;
    this.liquid = params.colDef.cellEditorParams.liquid;
    this.node = params.node;
    
    Liquid.solveExpressionField(this, "table", this.liquid);
    Liquid.solveExpressionField(this, "column", this.liquid);
    Liquid.solveExpressionField(this, "idColumn", this.liquid);
    Liquid.solveExpressionField(this, "targetColumn", this.liquid);
    
    var xhr = new XMLHttpRequest();
    if(params.colDef.cellEditorParams.cache === false || typeof params.colDef.cellEditorParams.values === 'undefined' || params.colDef.cellEditorParams.values === null) {
        xhr.open('POST', glLiquidServlet + '?operation=get&controlId=' + this.liquid.controlId + (typeof this.liquid.srcForeignWrk !== "undefined" && this.liquid.srcForeignWrk ? '&tblWrk=' + this.liquid.srcForeignWrk : '')
                + (this.table ? '&targetTable=' + this.table : "")
                + '&targetColumn=' + this.column
                + (this.idColumn ? '&idColumn=' + this.idColumn : '')
                + '&targetMode=' + params.colDef.cellEditorParams.editor, false);
        xhr.send();
        if(xhr.status === 200) {
            try {
                var resultJson = JSON.parse(xhr.responseText);
                if(isDef(resultJson.values)) {
                    params.colDef.cellEditorParams.values = resultJson.values;
                    params.colDef.cellEditorParams.codes = resultJson.codes;
                } else if(isDef(resultJson.resultSet)) {
                    params.colDef.cellEditorParams.values = [];
                    params.colDef.cellEditorParams.codes = [];
                    for(var i=0; i<resultJson.resultSet.length; i++) {
                        var rs = resultJson.resultSet[i];
                        if(rs) {
                            params.colDef.cellEditorParams.values.push(rs[params.colDef.cellEditorParams.column]);
                            if(isDef(params.colDef.cellEditorParams.idColumn))
                                params.colDef.cellEditorParams.codes.push(rs[params.colDef.cellEditorParams.idColumn]);
                        }
                    }
                } else {
                    console.error("ERROR : Undetected result in SelectEditor()...");
                }
                if(params.showToast) {
                    var values = params.colDef.cellEditorParams.values
                    if(values.length>0) {
                        var msg = Liquid.lang === 'eng' ? ("Reading "+this.liquid.tableJson.table+"."+this.column+" done</br></br>Found "+values.length + "item(s)") : ("Lettura "+this.liquid.tableJson.table+"."+this.column+" completata</br></br>Trovat"+(values.length===1?"a":"e")+" "+values.length + " rig"+(values.length===1 ? "a":"he") );
                        Liquid.showToast("LIQUID", msg, "success");
                    } else {
                        var msg = Liquid.lang === 'eng' ? ("Reading "+this.liquid.tableJson.table+"."+this.column+" done</br></br>No items found") : ("Lettura "+this.liquid.tableJson.table+"."+this.column+" completata</br></br>Nessuna riga trovata" );
                        Liquid.showToast("LIQUID", msg, "warning");
                    }
                }
                
                if(resultJson.error) {
                    console.error("Error reading data: " + resultJson.error);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    if(typeof params.headless === 'undefined' || !params.headless) {
        var values = (params.colDef.cellEditorParams ? params.colDef.cellEditorParams.values : null);
        var codes = (params.colDef.cellEditorParams ? params.colDef.cellEditorParams.codes : null);
        if(values) {
            for(var i=0; i<values.length; i++) {
                var opt = document.createElement('option');
                opt.text = values[i];
                if(codes)
                    opt.value = codes[i];
                if(params.data[params.colDef.cellEditorParams.iCol + 1] === opt.text)
                    opt.selected = 'selected';
                this.eInput.add(opt);
            }
        }
    }
};
SelectEditor.prototype.getGui = function() { return this.eInput; };
SelectEditor.prototype.afterGuiAttached = function() { this.eInput.focus(); };
SelectEditor.prototype.getValue = function() {
    if(this.cellEditorParams.idColumn && this.cellEditorParams.targetColumn) {
        var fullTargetColumn = this.liquid.tableJson.table + "." + this.cellEditorParams.targetColumn;
        for(var i=0; i<this.liquid.tableJson.columns.length; i++) {
            if(this.liquid.tableJson.columns[i].name === this.cellEditorParams.targetColumn || this.liquid.tableJson.columns[i].name === fullTargetColumn) {
                this.targetColumnIndex = this.liquid.tableJson.columns[i].field;
                break;
            }
        }
        if(this.targetColumnIndex) {
            if(isDef(this.iCol)) {
                this.liquid.tableJson.columns[this.iCol].isReflected = true;
            }
            var selNodes = [this.node];
            if(selNodes && selNodes.length > 0) {
                for(var node=0; node<selNodes.length; node++) {
                    if(selNodes[node].data[this.targetColumnIndex] !== this.eInput.value) {
                        var validateResult = Liquid.validateField(this.liquid, this.liquid.tableJson.columns[this.iCol], this.eInput.value);
                        if(validateResult !== null) {
                            if(validateResult[0] >= 0) {
                                this.eInput.value = validateResult[1];
                                selNodes[node].data[this.targetColumnIndex] = this.eInput.value;
                                Liquid.registerFieldChange(this.liquid, null, selNodes[node].data[ this.liquid.tableJson.primaryKeyField ? this.liquid.tableJson.primaryKeyField : "1" ], String(this.iCol + 1), null, this.eInput.value);
                                Liquid.updateDependencies(this.liquid, this.liquid.tableJson.columns[this.iCol], null, null);
                            }
                        }
                    }
                }
            }
        }
    }
    var retVal = "";
    try { 
        retVal = typeof this.eInput.selectedIndex !== 'undefined' ? this.eInput.options[this.eInput.selectedIndex].text : null;
    } catch (e) {}
    return retVal;
};
SelectEditor.prototype.destroy = function() {
};
SelectEditor.prototype.isPopup = function() {
    return false;
};


function SunEditor() {}
SunEditor.prototype.init = function(params) {
    this.eInput = document.createElement('textarea');
    this.eInput.id = "sunEditorPopup";
    this.eInput.style.width = (params.options.width !== 'undefined' ? Liquid.getCSSDim(params.options.width) : '100%');
    this.eInput.style.height = (params.options.height !== 'undefined' ? Liquid.getCSSDim(params.options.height) : '100%');
    this.rowIndex = params.rowIndex;
    this.iCol = params.iCol;
    this.column = params.column;
    this.cellEditorParams = params.colDef.cellEditorParams;
    this.liquid = params.colDef.cellEditorParams.liquid;
    this.node = params.node;
    this.options = params.options;
    if(this.liquid.outDivObj) {
        this.lastOverflow = this.liquid.outDivObj.style.overflow;
        this.liquid.outDivObj.style.overflow = 'unset';
    }
    var selNodes = Liquid.getCurNodes(this.liquid);
    if(selNodes && selNodes.length > 0) {
        for(var node=0; node<selNodes.length; node++) {
            this.targetField = params ? (params.column ? params.column.field : "") : "";
            if(this.targetField)
                this.eInput.value = selNodes[node].data[this.targetField];
        }
    }
};
SunEditor.prototype.getGui = function() {
    return this.eInput;
};
SunEditor.prototype.afterGuiAttached = function() {
    if(!this.liquid.popSuneditor) {
        this.liquid.popSuneditor = window.SUNEDITOR.create((document.getElementById('sunEditorPopup')), {
             minHeight: '200px'
            ,minWidth: '300px'
            ,lang: window.SUNEDITOR.SUNEDITOR_LANG['en']
        });
    }
    this.liquid.popSuneditor.setContents(this.eInput.value);
    // this.suneditor.insertHTML(this.eInput.value);
    // this.suneditor.noticeOpen('In edit ');
    this.eInput.focus();
    this.eInput.parentNode.style.zIndex = 30000;
};
SunEditor.prototype.getValue = function() {
    if(this.liquid.popSuneditor) {
        this.liquid.popSuneditor.save();
        var selNodes = Liquid.getCurNodes(this.liquid);
        if(selNodes && selNodes.length > 0) {
            for(var node=0; node<selNodes.length; node++) {
                if(selNodes[node].data[this.targetField] !== this.eInput.value) {
                    var validateResult = Liquid.validateField(this.liquid, this.liquid.tableJson.columns[this.targetField], this.eInput.value);
                    if(validateResult !== null) {
                        if(validateResult[0] >= 0) {
                            this.eInput.value = validateResult[1];
                            selNodes[node].data[this.targetField] = this.eInput.value;
                            Liquid.registerFieldChange(this.liquid, null, selNodes[node].data[ this.liquid.tableJson.primaryKeyField ? this.liquid.tableJson.primaryKeyField : "1" ], this.targetField, null, this.eInput.value);
                            Liquid.updateDependencies(this.liquid, this.liquid.tableJson.columns[this.iCol], null, null);
                        }
                    }
                }
            }
        }
    }
    return this.eInput.value;
};
SunEditor.prototype.destroy = function() {
    var obj = document.getElementById("suneditor_sunEditorPopup");
    if(obj)
        obj.parentNode.removeChild(obj);
    if(this.liquid.popSuneditor)
        this.liquid.popSuneditor.destroy();
    this.liquid.popSuneditor = null;
    if(this.liquid.outDivObj) {
        this.liquid.outDivObj.style.overflow = this.lastOverflow;
    }
};
SunEditor.prototype.isPopup = function() {
    return true;
};

function SystemEditor() {}
SystemEditor.prototype.init = function(params) {
    this.liquid = params.colDef.cellEditorParams.liquid;
    this.dlg = null;
    this.eInput = null;
    this.resultId = this.liquid.controlId+".systemEditors.result";
    if(params.colDef.cellEditorParams.type === "systemEditors") {
        this.dlg = Liquid.createSystemEditorsDialog(this.liquid, this.resultId);
    } else if(params.colDef.cellEditorParams.type === "systemLookups") {
        this.dlg = Liquid.createSystemLookupDialog(this.liquid, this.resultId);
    } else if(params.colDef.cellEditorParams.type === "systemOptions") {
        this.dlg = Liquid.createSystemOptionsDialog(this.liquid, this.resultId);
    } else {
        console.error("ERROR: unknown system editor:"+params.colDef.cellEditorParams.type);
        return;
    }    
    
    document.body.appendChild(this.dlg);
    this.dlgContent = document.querySelector(".liquidEditorDialog-content");
    if(this.dlgContent) {
        this.dlgContent.style.top = this.dlg.parentNode.offsetTop + this.dlg.parentNode.clientHeight/2 - (this.dlgContent.clientHeight > 0 ? this.dlgContent.clientHeight:250)/2;
        this.dlgContent.style.left = this.dlg.parentNode.offsetLeft + this.dlg.parentNode.clientWidth/2 - (this.dlgContent.clientWidth > 0 ? this.dlgContent.clientWidth:200)/2;
        this.dlgContent.style.position='absolute';
    }
    
    var selNodes = Liquid.getCurNodes(this.liquid);
    if(selNodes && selNodes.length > 0) {
        for(var node=0; node<selNodes.length; node++) {
            this.targetField = params ? (params.column ? params.column.field : "") : "";
            if(this.targetField)
                this.value = selNodes[node].data[this.targetField];
        }
    }
};
SystemEditor.prototype.getGui = function() { return this.dlg; };
SystemEditor.prototype.afterGuiAttached = function() { this.eInput = document.getElementById(this.resultId); this.eInput.value = this.value; this.eInput.focus(); this.dlg.parentNode.style.zIndex = 150; };
SystemEditor.prototype.getValue = function() { return this.eInput.value; };
SystemEditor.prototype.destroy = function() {};
SystemEditor.prototype.isPopup = function() { return true; };






function LiquidGridHeader() {}
LiquidGridHeader.prototype.init = function (agParams) {
    var style = '' + (typeof agParams.menuIconSize !== 'undefined' ? 'font-size:'+agParams.menuIconSize+'px' : '')+'';
    var labelStyle = agParams.column.field === String(agParams.liquidLink.lastSearchCol+1) ? "color:red;" : "";
    var itemId = agParams.liquidLink.controlId + ".header_label."+agParams.column.colId;
    var ic = Number(agParams.column.field)-1;
    var tooltipField = "";
    var liquid = agParams.liquidLink;
    if(liquid) {
        if(ic < liquid.tableJson.columns.length) {
            tooltipField = liquid.tableJson.columns[ic].tooltipField ? liquid.tableJson.columns[ic].field : "";
        }
    }
    if(tooltipField === null || typeof tooltipField === 'undefined')
        tooltipField = "";
    
    if(Liquid.projectMode) {
        if(tooltipField) {
            tooltipField += "\n\n";
        }    
        if(ic < liquid.tableJson.columns.length) {
            var col = liquid.tableJson.columns[ic];
            tooltipField += Liquid.getColumnTooltip(liquid, col);
        }
    }
    
    this.agParams = agParams;
    this.eGui = document.createElement('div');
    this.eGui.style.display = "inline-flex";
    this.eGui.innerHTML = ''
        +'<div style=\"display:inline-flex\">'
        +(agParams.enableMenu ? '<div class="customHeaderMenuButton" style=\"'+style+'\">' + this.agParams.menuIcon + '</div>' : "")
        +'<div id=\"'+itemId+'\" title="'+tooltipField+'" class="customHeaderLabel" style=\"'+labelStyle+'\">' + this.agParams.displayName + '</div>'
        // +'<div class="customSortDownLabel inactive">&#x25BC;</div>'
        // +'<div class="customSortUpLabel inactive">&#x25B2;</div>'
        // +'<div class="customSortRemoveLabel inactive"></div>'
        +'</div>'
        ;
    this.eMenuButton = this.eGui.querySelector(".customHeaderMenuButton");
    this.eSortLabelButton = this.eGui.querySelector(".customHeaderLabel");
    this.eSortDownButton = this.eGui.querySelector(".customSortDownLabel");
    this.eSortUpButton = this.eGui.querySelector(".customSortUpLabel");
    this.eSortRemoveButton = this.eGui.querySelector(".customSortRemoveLabel");

    if(this.agParams.enableMenu) {
        this.onMenuClickListener = this.onMenuClick.bind(this);
        this.eMenuButton.addEventListener('click', this.onMenuClickListener);
    } else {
        if(this.eMenuButton) this.eGui.removeChild(this.eMenuButton);
        this.eMenuButton = null;
    }

    if(this.agParams.enableSorting) {
        if(this.eSortLabelButton) {
            this.onSortAutoRequestedListener = this.onSortRequested.bind(this, 'auto');
            this.eSortLabelButton.addEventListener('click', this.onSortAutoRequestedListener);
        }
        if(this.eSortDownButton) {
            this.onSortAscRequestedListener = this.onSortRequested.bind(this, 'asc');
            this.eSortDownButton.addEventListener('click', this.onSortAscRequestedListener);
        }
        if(this.eSortUpButton) {
            this.onSortDescRequestedListener = this.onSortRequested.bind(this, 'desc');
            this.eSortUpButton.addEventListener('click', this.onSortDescRequestedListener);
        }
        if(this.eSortRemoveButton) {
            this.onRemoveSortListener = this.onSortRequested.bind(this, '');
            this.eSortRemoveButton.addEventListener('click', this.onRemoveSortListener);
        }
        this.onSortChangedListener = this.onSortChanged.bind(this);
        this.agParams.column.addEventListener('sortChanged', this.onSortChangedListener);
        this.onSortChanged();
    } else {
        this.eGui.removeChild(this.eSortDownButton);
        this.eGui.removeChild(this.eSortUpButton);
        this.eGui.removeChild(this.eSortRemoveButton);
    }
};

LiquidGridHeader.prototype.onSortChanged = function () {
    function deactivate(toDeactivateItems) {
        toDeactivateItems.forEach(function (toDeactivate) {
            if(toDeactivate) toDeactivate.className = toDeactivate.className.split(' ')[0];
        });
    }
    function activate(toActivate) { toActivate.className = toActivate.className + " active"; }
    if(this.agParams.column.isSortAscending()) {
        if(this.eSortUpButton) deactivate([this.eSortUpButton, this.eSortRemoveButton]);
        if(this.eSortDownButton) activate(this.eSortDownButton);
    } else if(this.agParams.column.isSortDescending()) {
        if(this.eSortDownButton) deactivate([this.eSortDownButton, this.eSortRemoveButton]);
        if(this.eSortUpButton) if(this.eSortUpButton) activate(this.eSortUpButton);
    } else {
        if(this.eSortUpButton) deactivate([this.eSortUpButton, this.eSortDownButton]);
        if(this.eSortDownButton) activate(this.eSortRemoveButton);
    }
};
LiquidGridHeader.prototype.getGui = function () { return this.eGui; };
LiquidGridHeader.prototype.onMenuClick = function () { this.agParams.showColumnMenu(this.eMenuButton); };
LiquidGridHeader.prototype.onSortRequested = function (order, event) {
    try { 
        var retVal = Liquid.onEvent(this.agParams.liquidLink, "onSorting", null, null, null, true).result; 
    } catch(e) { console.error(e); }
    var sortServer = '';
    if(this.agParams.liquidLink)
        if(this.agParams.liquidLink.nPages > 1) sortServer = 'server';
            else if(isDef(this.agParams.liquidLink.tableJson.sortMode)) sortServer = this.agParams.liquidLink.tableJson.sortMode;
    if(sortServer === 'server') {
        if(typeof this.agParams.liquidLink.sortColumns === 'undefined' || !this.agParams.liquidLink.sortColumns)
            this.agParams.liquidLink.sortColumns = [];
        var colIndex1B = Number(this.agParams.column.colDef.field);
        var columnName = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].name : "";
        var sortColumnsMode = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode : "asc";
        if(columnName) {
            if(sortColumnsMode === "asc") this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "desc";
            else this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "asc";
            if(event.shiftKey || event.ctrlKey) {
                if(this.agParams.liquidLink.sortColumns.indexOf(columnName) < 0) 
                    this.agParams.liquidLink.sortColumns.push(columnName);
            } else {
                this.agParams.liquidLink.sortColumns = [ columnName ];
            }
            this.agParams.liquidLink.sortColumnsMode = this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode;
        }
        Liquid.loadData(this.agParams.liquidLink, null);
    } else {
        if(order==='auto') {
            if(this.agParams.column.isSortAscending()) {
                this.agParams.setSort('desc', event.shiftKey || event.ctrlKey);
            } else {
                this.agParams.setSort('asc', event.shiftKey || event.ctrlKey);
            }
        } else {
            this.agParams.setSort(order, event.shiftKey || event.ctrlKey);
        }
    }
};
LiquidGridHeader.prototype.destroy = function () {
    if(this.onMenuClickListener) { this.eMenuButton.removeEventListener('click', this.onMenuClickListener); }
    if(this.eSortLabelButton) this.eSortLabelButton.removeEventListener('click', this.onSortAutoRequestedListener);
    if(this.eSortDownButton) this.eSortDownButton.removeEventListener('click', this.onSortRequestedListener);
    if(this.eSortUpButton) this.eSortUpButton.removeEventListener('click', this.onSortRequestedListener);
    if(this.eSortRemoveButton) this.eSortRemoveButton.removeEventListener('click', this.onSortRequestedListener);
    this.agParams.column.removeEventListener('sortChanged', this.onSortChangedListener);
};

function isDef(__var) {
    return (typeof __var !== 'undefined' && __var !== null) ? true : false;
}

if(window.addEventListener) { window.addEventListener('click', Liquid.onClick); } else { window.attachEvent('onclick', Liquid.onClick); }
if(window.addEventListener) { window.addEventListener('load', Liquid.startup); } else { window.attachEvent('onload', Liquid.Startup); }
if(window.addEventListener) { window.addEventListener('keydown', Liquid.onWindowKeyDown); } else { window.attachEvent('onkeydown', Liquid.onWindowKeyDown); }
if(document.addEventListener) { document.addEventListener('contextmenu', function(e) { if(Liquid.onContextMenu(e)) e.preventDefault(); }, false ); } else { document.attachEvent('contextmenu', function() { if(Liquid.onContextMenu(window.event)) window.event.returnValue = false; }); }



// window.addEventListener("dragover",function(e){ e = e || event; e.preventDefault(); },false);
// window.addEventListener("drop",function(e){ e = e || event; e.preventDefault(); },false);

Array.prototype.contains = function(searchElement) { 'use strict';
    if(this === null) throw new TypeError('Array.prototype.contains called on null or undefined');
    for(var i=0; i<this.length; i++) 
        if(searchElement === this[i])return true;
    return false;
};


//LZW Compression/Decompression for Strings
var LZW = {
    compress: function (uncompressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }
 
        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            //Do not use dictionary[wc] because javascript arrays 
            //will return values for array['pop'], array['push'] etc
           // if (dictionary[wc]) {
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                // Add wc to the dictionary.
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }
 
        // Output the code for w.
        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result;
    },
 
 
    decompress: function (compressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = [],
            w,
            result,
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }
 
        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
 
            result += entry;
 
            // Add w+entry[0] to the dictionary.
            dictionary[dictSize++] = w + entry.charAt(0);
 
            w = entry;
        }
        return result;
    }
};

function deepClone(obj, hash = new WeakMap()) {
    if (Object(obj) !== obj || obj instanceof Function) return obj;
    if (hash.has(obj)) return hash.get(obj); // Cyclic reference
    try {
        var result = new obj.constructor();
    } catch(e) { // Constructor failed, create object without running the constructor
        result = Object.create(Object.getPrototypeOf(obj));
    }
    if (obj instanceof Map)
        Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), 
                                                   deepClone(val, hash)) );
    else if (obj instanceof Set)
        Array.from(obj, (key) => result.add(deepClone(key, hash)) );
    hash.set(obj, result);
    return Object.assign(result, ...Object.keys(obj).map (key => ( { [key]: ( key === 'linkedLabelObj' || key === 'linkedObj' || key === 'linkedCmd' ? null : deepClone(obj[key], hash)) }) ));
}