/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

// mnemonics flags
// requireSelected selection of row is required, don't consider caret as current row

// N.B.: Link to external control by : @controlId o url( controlId )
// N.B.: foreigTable controls default name : ForeignTable$ForeignColumn@controlId



/* */

//
// Liquid ver.1.64
//
//  First update 04-01-2020 - Last update  24-08-2021
//
//  TODO : see trello.com
//
// *** File internal priority ***
//
//  1°  project LiquidX (DEVELOPING)
//  2°  project Liquid  (inside JAR)
//  3°  project LiquidD (BACKUP)
//
//
//
// *** Automatic event firing ***
//
//      suppose a command named "my_command", the event's processor strip underline and make first char to uppercase :
//
//      call beforeMyCommand() event before executing "my_command"
//      call afterMyCommand()  event after executed "my_command"
//
//  in other words add "before" / "after" and then make toCamelCase()
//


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
var glLiquidDB = null;
var glLiquidIDB = null;
var glLiquidDBEnable = true;
var glWorkReaderLooper = null;
var glFlashingTimer = null;
var glFlashingTimerMsec = 100;
var glLookupScrollTop = 0;
var glLookupScrollLeft = 0;

if(!isDef(glLiquidGenesisToken))
    var glLiquidGenesisToken = null;

//
// start point of servlet ... the bridge to server
//
if(!isDef(glLiquidRoot))
    var glLiquidRoot = ".";
if(!isDef(glLiquidServlet))
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

        // help debugger
        this.AAA = controlId + " - mode:" + mode + " - div:"+this.outDivId+"";

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
        
        // not here
        // this.parentObjId = parentObjId;
        
        if(isDef(sourceData)) {
            if(isDef(sourceData.liquidOrId)) {
                if(typeof sourceData.liquidOrId === 'string') this.srcLiquidControlId = sourceData.liquidOrId;
                else if(sourceData.liquidOrId instanceof LiquidCtrl) this.srcLiquidControlId = sourceData.liquidOrId.controlId;
                this.srcLiquid = Liquid.getLiquid(sourceData.liquidOrId);
            }
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
        this.resizeCounter = 0;

        
        if(!isDef(sourceData)) { // root control : default api manager
            this.columnsApiParams = null;
            this.columnsApi = Liquid.columnsApi;
            this.gridsApiParams = null;
            this.gridsApi = Liquid.gridsApi;
        } else { // nested control : given apis..
            this.columnsApiParams = sourceData.columnsApiParams;
            this.columnsApi = sourceData.columnsApi;
            this.gridsApiParams = sourceData.gridsApiParams;
            this.gridsApi = sourceData.gridsApi;            
        }
 

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
                                            Liquid.transferFeatures(this, responseJSON, restOfTableSON);
                                            responseText = JSON.stringify(responseJSON);
                                        }
                                    } catch (e) {
                                        console.error("ERROR: creating control "+this.controlId+":"+e);
                                    }
                                }
                                newLiquid = new LiquidCtrl( controlId, outDivObjOrId, responseText
                                                            ,sourceData
                                                            ,mode, parentObjId );
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

            //
            // overlay options ...
            //
            if(isDef(sourceData)) {
                if(isDef(sourceData.options)) {
                    Liquid.transferFeatures(this, sourceData, this.tableJson);
                }
                if(isDef(sourceData.askForSave)) {
                    this.askForSave = sourceData.askForSave;
                }
            }
            
            if(typeof this.tableJson.mode === 'undefined') {
                this.tableJson.mode = this.mode;
            }
            if(typeof this.mode === 'undefined') {
                this.mode = this.tableJson.mode;
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
            this.gridLoadCounter = 0;
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
            this.tableJson.idColumnField = null;
            this.navObj = null;
            
            this.enableOverscroll = false;
            this.autoLoad = this.tableJson.autoLoad;
            this.autoFocus = this.tableJson.autoFocus;
            this.lastSelectedId = null;
            this.selection = { all:false, include:[], includeObjectId:[], exclude:[], excludeObjectId:[]};
            
            this.xhr = null;
            this.xhrDescription = null;
            this.xhrBusy = false;
            this.xhrCount = 0;

            this.sortColumns = isDef(this.tableJson.sortColumns) ? this.tableJson.sortColumns : null;
            if(this.sortColumns) {
                if(!Array.isArray(this.sortColumns)) {
                    this.sortColumns = [ this.sortColumns ];
                }
            }
            this.sortColumnsMode = isDef(this.tableJson.sortColumnsMode) ? this.tableJson.sortColumnsMode : null;



            var isDialogX = Liquid.isDialogX(this);
            var isFormX = Liquid.isFormX(this);
            var isWinX = Liquid.isWinX(this);

            this.bRegisterControl = true;

            if(typeof this.tableJson.tableJsonVariableName !== 'undefined')
                this.tableJsonVariableName = this.tableJson.tableJsonVariableName;
            else
                if(tableJsonString)
                    if(tableJsonString.charAt(0) != "{")
                        this.tableJsonVariableName = Liquid.getGlobalVarByContent(tableJsonString);

            // Runtime mode (no db) ?
            if(!isDef(this.tableJson.query)) {
                if(typeof this.tableJson.table === 'undefined' || !this.tableJson.table) {
                    if(isFormX || isDialogX) { // Runtime mode allowed
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

                Liquid.registerOnUnloadPage();
                
                try {

                    // if(typeof this.tableJson.schema === 'undefined') if(this.tableJson.isSystem !== true) debugger;

                    if(this.tableJson.mode === "auto") { // async
                        this.isAsyncResolve = true;
                        Liquid.sendRequest(
                          this
                        , null
                        , 'POST'
                        , glLiquidServlet + "?operation=auto"
                                + "&controlId=" + this.controlId
                                + "&table=" + (typeof this.tableJson.table !== 'undefined' ? this.tableJson.table : "")
                                + "&schema=" + (typeof this.tableJson.schema !== 'undefined' ? this.tableJson.schema : "")
                                + "&database=" + (typeof this.tableJson.database !== 'undefined' ? this.tableJson.database : "")
                                + "&parentControlId=" + Liquid.getRootSourceControlId(this)
                        , true
                        , JSON.stringify(this.tableJson)
                        , function(liquid, xhr) {
                            if(xhr.readyState === 4) {
                                // Liquid.release_xhr(liquid);
                                if(xhr.status === 200) {
                                    liquid.isAsyncResolveDone = true;
                                    liquid.promise = new Promise((param) => {
                                        retVal = Liquid.onProcessServerResult(liquid, xhr);
                                    });
                                }
                            }
                        }
                        ,"register control "+this.controlId
                        , null
                        , null
                        , null
                        , null
                        , null
                                );
                        /// this.xhr.send(JSON.stringify(this.tableJson));
                    } else if(this.tableJson.mode === "autoSync") { // sync

                        retVal = Liquid.sendRequest(
                          this
                        , null
                        , 'POST'
                        , glLiquidServlet + "?operation=auto"
                                + "&controlId=" + this.controlId
                                + "&table=" + this.tableJson.table
                                + "&schema=" + (typeof this.tableJson.schema !== 'undefined' ? this.tableJson.schema : "")
                                + "&database=" + (typeof this.tableJson.database !== 'undefined' ? this.tableJson.database : "")
                                + "&parentControlId=" + Liquid.getRootSourceControlId(this)
                        , false
                        , tableJsonString
                        , Liquid.onProcessServerResult
                        ,"register control "+this.controlId
                        , null
                        , null
                        , null
                        , null
                        , null
                                );

                    } else if(!this.tableJson.columnsResolved) { // sync

                        retVal = Liquid.sendRequest(
                          this
                        , null
                        , 'POST'
                        , glLiquidServlet + '?operation=registerControl'
                                +'&controlId=' + (typeof this.tableJson.registerControlId !== "undefined" ? this.tableJson.registerControlId : this.controlId)
                                +'&token=' + (typeof this.tableJson.token !== "undefined" ? this.tableJson.token : "")
                        , false                            
                        , tableJsonString
                        , Liquid.onProcessServerResult
                        ,"register control "+this.controlId
                        , null
                        , null
                        , null
                        , null
                        , null
                                );
                    }
                } catch (e) {
                    console.error(e);
                }
                    
                this.bRegisterControl = false;
            }


            if(this.bRegisterControl) {

                var controlDetected = false;
                for(var i=0; i<glLiquids.length; i++) {
                    if(glLiquids[i].controlId == controlId) {
                        delete glLiquids[i];
                        if(!controlDetected) {
                            glLiquids[i] = this;
                            controlDetected = true;
                        }
                    }
                }
                if(!controlDetected)
                    glLiquids.push(this);

                // Add links
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

                // link on the source columns (ex. lookup control linked to source column)
                if(isDef(this.sourceData)) {
                    if(isDef(this.sourceData.parentLiquidId)) {
                        if(isDef(this.sourceData.parentColumn)) {
                            var sourceCol = Liquid.getColumn(this.sourceData.parentLiquidId, this.sourceData.parentColumn);
                            if(sourceCol) {
                                if(!isDef(sourceCol.linkedLiquidIds)) sourceCol.linkedLiquidIds = [];
                                sourceCol.linkedLiquidIds.push( this.controlId );
                            }
                        }
                    }
                }

                this.isAsyncResolve = true;
                this.isAsyncResolveDone = true;
                
                // solve source col (foreignTable, etc...)
                Liquid.solveSourceColumn(this, null, null);

                Liquid.initializeLiquid(this);
                
                
                // solving idColumn (lookuops)
                if(isDef(this.tableJson.idColumn)) {
                    this.tableJson.idColumnField = Liquid.getColumnsField(this, this.tableJson.idColumn);
                    if(!this.tableJson.idColumnField) {
                        console.error("ERROR: idColumn '"+this.tableJson.idColumn+"' not found on controlId:" + controlId);
                    }
                }
                
                
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
                    rowSelection: (isDef(this.tableJson.rowSelection) && this.tableJson.rowSelection ? this.tableJson.rowSelection : "single"),
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

                    columnTypes: {
                        'nonEditableColumn': { editable: false },
                        'dateColumn': {
                            // filter: 'agDateColumnFilter',
                            // filterParams: { comparator: myDateComparator },
                            suppressMenu: false
                        },
                        'numericColumn': {
                            // filter: 'agDateColumnFilter',
                            // filterParams: { comparator: myDateComparator },
                            suppressMenu: false
                        },
                        'stringColumn': {
                            // filter: 'agDateColumnFilter',
                            // filterParams: { comparator: myDateComparator },
                            suppressMenu: false
                        }
                    },
                    
                    onRowSelected:function(event) {
                        if(event.type === "rowSelected") {
                            var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                            var isPhantomNode = false;
                            if(event.node.isSelected()) {
                                if(event.node.id !== liquid.lastSelectedId) {
                                    try {
                                        if(liquid.addingNode) {
                                            if(liquid.addingNode.id === event.node.id)
                                                isPhantomNode = true;
                                        }
                                        if(liquid.mode === "lookup") {
                                            if(liquid.status === "open") {
                                                if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                                    // avoid lookup set when filter reload content
                                                    Liquid.onSetLookup(liquid, event);
                                                }
                                            }
                                            if(liquid.gridOptions.rowSelection !== "multiple")
                                                if(event.node.selected) {
                                                    if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                                        // avoid lookup close when filter reload content
                                                        Liquid.onCloseLookup(liquid, event);
                                                    }
                                                }
                                        }
                                        if(liquid.cRow !== event.node.rowIndex) {
                                            if(!isPhantomNode) {
                                                if(liquid.modifications) {
                                                    if(liquid.modifications.length>0) {
                                                        if(!liquid.tableJson.multilineEdit === true) {
                                                            Liquid.onCommand(liquid, "update");
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if(!isPhantomNode) {
                                            // Disable all tabs, avoiding to see invalidated data
                                            Liquid.setForeignTablesDisableCascade(liquid);
                                            Liquid.refreshLinkedLiquids(liquid);
                                        }
                                        // update current position
                                        liquid.cRow = event.node.rowIndex;
                                        if(isDef(liquid.tableJson.layouts)) {
                                            for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                                                var layout = liquid.tableJson.layouts[il];
                                                layout.currentRow1B = event.node.rowIndex+1
                                            }
                                        }
                                        Liquid.updateStatusBar(liquid);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                } else {
                                    // reseletion the previouse selected
                                    if(liquid.mode === "lookup") {
                                        if(liquid.status === "open") {
                                            if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                                // avoid lookup set when filter reload content
                                                Liquid.onSetLookup(liquid, event);
                                                if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                                    Liquid.onCloseLookup(liquid, event);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                // Unselect item on lookup
                                if(liquid.mode === "lookup") {
                                    if(liquid.status === "open") {
                                        // Why to close the lookup ???
                                        // Liquid.onSetLookup(liquid, event);
                                    }
                                }
                            }
                                                        
                            if(event.node.isSelected()) {
                                if(event.node.id !== liquid.lastSelectedId) {
                                    if(!isPhantomNode) {
                                        Liquid.processNodeSelected(liquid, event.node, event.node.isSelected());
                                    }                                    
                                    Liquid.updateSelectionData(liquid);
                                    if(!isDef(liquid.addingNode)) {
                                        // not adding row ...
                                        Liquid.setForeignTablesModeCascade(liquid);
                                    }
                                    Liquid.refreshAll(liquid, event, "selectionChange");
                                }
                                if(event.node.id !== liquid.lastSelectedId) {
                                    Liquid.onEvent(liquid, "onRowSelected", event.data);
                                }
                                liquid.lastSelectedId = event.node.id;
                            } else {
                                // deselection event
                                if(!isPhantomNode) {
                                    Liquid.processNodeSelected(liquid, event.node, event.node.isSelected());
                                }                                    
                                if(liquid.tableJson.rowDeselection === true || liquid.gridOptions.rowSelection === "multiple") {
                                    Liquid.onEvent(liquid, "onRowUnSelected", event.data);
                                    liquid.lastSelectedId = null;
                                } else {
                                    // not sended : onRowSelected in single select mode means row change
                                    if(liquid.mode === "lookup") {
                                        if(liquid.status === "open") {
                                            if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                                // if(liquid.cRow === event.node.rowIndex) {
                                                // Liquid.onSetLookup(liquid, event);
                                                Liquid.onCloseLookup(liquid);
                                            }
                                        }
                                    }
                                }
                            }
                            Liquid.updateCaption(liquid);
                        }
                    },                    
                    onCellContextMenu:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.onEvent(liquid, "onCellContextMenu", event.data);
                    },
                    onCellDoubleClicked:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.onEvent(liquid, "onRowDoubleClicked", event.data);
                    },
                    onRowClicked:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        liquid.lastRowClickedNode = event.node;
                        Liquid.onEvent(liquid, "onRowClicked", event.data);
                    },
                    onCellClicked:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        liquid.lastCellCickedEvent = event;
                        Liquid.onEvent(liquid, "onCellClicked", event.data);
                    },
                    onSelectionChanged:function(event) {
                        if(event) {
                            var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                            var nodes = event.api.getSelectedNodes();
                            var rowsData = [];
                            for(var i=0; i<nodes.length; i++) {
                                rowsData.push( Liquid.getFullRecordData(liquid, nodes[i]) );
                            }
                            Liquid.onEvent(liquid, "onSelectionChanged", rowsData);
                        }
                    },
                    onGetSelection:function(event) { 
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.onEvent(liquid, "onGetSelection", event); 
                    },
                    // getRowNodeId :function( data ) { return data.id; },
                    onDeselectAll:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.onSelectAll(this.liquidLink, event);
                    },                    
                    onSelectAll:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.onSelectAll(this.liquidLink, event);
                    },                    
                    isRowSelectable:function(event) {
                        if(this) {
                            var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                            return Liquid.onEvent(liquid, "isRowSelectable", event.data).result;
                        }
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
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        if(event.oldValue !== event.newValue) {
                            Liquid.onEvent(liquid, "onCellValueChanged", event.node);
                            var iCol = Number(event.column.colId) - 1;
                            if(iCol >= 0) {
                                if(liquid.tableJson.columns[iCol].isReflected === true)
                                    return;
                                var validateResult = Liquid.validateField(liquid, liquid.tableJson.columns[event.column.colId], event.newValue);
                                if(validateResult !== null) {
                                    if(validateResult[0] >= 0) {
                                        if(!Liquid.isMirrorEvent(liquid, event.node) ) {
                                            event.newValue = validateResult[1];
                                            Liquid.registerFieldChange(liquid, event.node.id, event.node.data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], event.column.colId, event.oldValue, event.newValue);
                                            Liquid.updateDependencies(liquid, liquid.tableJson.columns[iCol], null, event);
                                        }
                                    }
                                }
                            }
                        }
                        if(typeof liquid.pendingCommand !== 'undefined' && liquid.pendingCommand) {
                            Liquid.onCommandBarClick.call(liquid.pendingCommand.obj);
                            liquid.pendingCommand = null;
                        }
                        if(event.node.isSelected()) {
                            Liquid.updateSelectionData(liquid);
                        }
                    },
                    onRowValueChanged:function(event) {
                        var data = event.data;
                        // console.log('onRowVa    lueChanged: (' + data.make + ', ' + data.model + ', ' + data.price + ', ' + data.field5 + ')');
                    },onFirstDataRendered:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        Liquid.setAutoresizeColumn(liquid, false);
                    },onGridReady:function(event) {
                    }
                    ,postSort:function(rowNodes) {
                        try { 
                            return Liquid.onEvent(this.gridOptionsWrapper.gridOptions.api.context.contextParams.seed.eGridDiv, "onSorted", rowNodes, null, null, true).result; 
                        } catch(e) { console.error(e); }
                    },
                    onGridSizeChanged:function(params) {
                        var liquid = Liquid.getLiquid(params.api.gridOptionsWrapper.gridOptions.liquidLink);
                        Liquid.onGridContainerSizeChanged(liquid, params);
                    },
                    onBodyScroll:function(event) {
                        var liquid = Liquid.getLiquid(this.liquidLink.controlId);
                        if(liquid) {
                            if(event.direction === "vertical") {
                                var gridScroller = liquid.aggridContainerObj.querySelector(".ag-body-viewport");
                                if(gridScroller) {
                                    var scrollSize = gridScroller.scrollHeight - gridScroller.offsetHeight;
                                    if(event.top === scrollSize) {
                                        if(liquid.enableOverscroll !== false) {
                                            if(liquid.nPages > liquid.cPage+1)
                                                Liquid.onBtNext(liquid.controlId);
                                                liquid.enableOverscroll = null;
                                        } else {
                                            liquid.enableOverscroll = true;
                                        }
                                    }
                                    if(event.top === 0) {
                                        if(liquid.enableOverscroll !== false) {
                                            if(liquid.cPage > 0)
                                                Liquid.onBtPrevious(liquid.controlId);
                                        } else {
                                            liquid.enableOverscroll = true;
                                        }
                                    }
                                } else console.error("ERROR : unable to get scrolller");
                            }
                        }
                    }
                };


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
                    if(isWinX || isFormX || isDialogX) {
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
                            } else if(isDialogX) {
                            	this.outDivObj.style.position = 'fixed';
                                this.outDivObj.className += " liquidDialogX";
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
                        if(this.tableJson.top === "center" || this.tableJson.position === "center" || this.tableJson.centered === true) {
                            this.outDivObj.style.top = (scrollTop + winHeight/2.0 - (this.outDivObj.clientHeight > 0 ? this.outDivObj.clientHeight:this.tableJson.height.replace("px",""))/2)+'px';
                        } else {
                            this.outDivObj.style.top = ((this.tableJson.top ? this.tableJson.top : Liquid.defaultWinXTop) + scrollTop) + 'px';
                        }                        
                        if(this.tableJson.left === "center" || this.tableJson.position === "center" || this.tableJson.centered === true) {
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
                        // console.warn("WARNING : Changed position atttrib on HTML element :" + this.parentObjId+" on control:"+this.controlId);
                        // this.outDivObj.style.position = 'relative';
                    }

                    if(isDef(this.tableJson.class)) {
                        var classes = null;
                        if(this.tableJson.class.indexOf(",") > 0) {
                            classes = this.tableJson.class.split(",");
                        } else {
                            classes = this.tableJson.class.split(" ");
                        }
                        if(classes) {
                            for(var ic=0; ic<classes.length; ic++) {
                                this.outDivObj.classList.add(classes[ic]);
                            }
                        }
                    }

                    if(this.mode !== "lookup") {
                        this.outDivObj.style.minWidth = Liquid.iconincSize.wx+"px";
                        if(this.tableJson.overflow === 'hidden')
                            this.outDivObj.style.overflow = 'hidden';
                        else if(this.tableJson.overflow === 'auto' || this.tableJson.overflow === 'overlay')
                            this.outDivObj.style.overflow = 'auto';
                    }
                    
                    // set the root container for list/grids/layouts/etc
                    this.rootObj = this.outDivObj;
                    
                    if(this.mode == "lookup") {
                        this.outDivObj.className += " liquidLookupTheme";
                    } else if(this.mode == "popup") {
                        this.outDivObj.className += " liquidPopupTheme";
                    } else if(isWinX) {
                        this.outDivObj.className += " liquidWinXTheme";
                    } else if(isFormX) {
                        this.outDivObj.className += " liquidFormXTheme";
                    } else if(isDialogX) {
                        this.outDivObj.className += " liquidDialogXTheme";
                    }

                    // link for lookup and others
                    try {
                        this.outDivObj.setAttribute('controlId', controlId);
                    } catch (e) {
                        console.error('ERROR : Control ' + this.outDivId + " not found.." + e);
                    }




                    
                    // popup
                    if(this.mode === "combo") {
                        if(!isDef(this.tableJson.combo)) {
                            this.tableJson.combo = { open:true };
                        } else {
                            this.tableJson.combo.open = true;
                        }
                        this.comboModeObj = document.createElement("div");
                        this.comboModeObj.className = "liquidCombo";
                        this.comboModeObj.style = "width:100%; height:30px; -moz-user-select: none; -webkit-user-select: none; -ms-user-select:none; user-select:none;-o-user-select:none;";
                        this.comboModeObj.id = this.controlId+".comnbo";
                        this.comboModeObj.onclick = function(e) { Liquid.switchCombo( this ); };

                        this.comboModeText = document.createElement("div");
                        this.comboModeText.id = this.controlId+".comnbo.text";
                        this.comboModeText.style = "float:left; width:calc(100% - 48px); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;";

                        this.comboModeObj.onclick = function(e) { Liquid.switchCombo( this ); };

                        this.comboModeOpenIcon = document.createElement("div");
                        this.comboModeOpenIcon.style.display = "none";
                        this.comboModeOpenIcon.style.float = "right";
                        this.comboModeOpenIcon.style.width = "24px";
                        
                        this.comboModeCloseIcon = document.createElement("div");
                        this.comboModeCloseIcon.style.display = "none";
                        this.comboModeCloseIcon.style.float = "right";
                        this.comboModeCloseIcon.style.width = "24px";
                        
                        this.comboModeObj.appendChild(this.comboModeText);
                        this.comboModeObj.appendChild(this.comboModeOpenIcon);
                        this.comboModeObj.appendChild(this.comboModeCloseIcon);

                        this.outDivObj.appendChild(this.comboModeObj);

                        this.comboModeOpenIcon.innerHTML = "<img id=\""+this.controlId+".comnbo.opener\" src=\""+Liquid.getImagePath("down.png")+"\" width=\"16\" height=\"16\" style=\"padding-top:1; cursor:pointer\" onclick=\"Liquid.setControlAsCombo( this, false ); \" />";
                        this.comboModeCloseIcon.innerHTML = "<img id=\""+this.controlId+".comnbo.closer\" src=\""+Liquid.getImagePath("up.png")+"\" width=\"16\" height=\"16\" style=\"padding-top:1; cursor:pointer\" onclick=\"Liquid.setControlAsCombo( this, true ); \" />";
                        
                    }                    
                    

                    // popup
                    if(this.mode === "popup" || isWinX) {
                        var title = (isDef(this.tableJson.title) ? this.tableJson.title : (isDef(this.tableJson.caption) ? this.tableJson.caption : ''));
                        this.popupCaptionObj = document.createElement("div");
                        var captionButtonsHTML = "<table><tr><td style=\"height:100%\"><div id=\"" + controlId + ".caption\" style=\"width:100%\"><br/></td>";
                        if(isWinX) {
                            if(this.tableJson.captionButtons === 'undefined' || !this.tableJson.captionButtons) {
                                var filter = "";
                                if(isDef(Liquid.captionIconFilter)) {
                                    filter += Liquid.captionIconFilter;
                                } else {
                                    filter += "opacity(0.5)";
                                }                                
                                if(!isDef(Liquid.captionIconSize)) {
                                    Liquid.captionIconSize = 12;
                                }
                                this.tableJson.captionButtons = [
                                     { width:Liquid.captionIconSize, height:Liquid.captionIconSize, background:"", title:(Liquid.lang === 'ita'?"riduci ad icona":"iconize"), image:"minimized.png", client:"Liquid.setWinXStatus(this, 'iconic/restore')", filter:filter, padding:"3px" }
                                    ,{ width:Liquid.captionIconSize, height:Liquid.captionIconSize, background:"", title:(Liquid.lang === 'ita'?"ripristina/massimizza":"restore/maximize"), image:"restored.png", client:"Liquid.setWinXStatus(this, 'maximized/minimized')", filter:filter, padding:"3px" }
                                    ,{ width:Liquid.captionIconSize, height:Liquid.captionIconSize, background:"", title:(Liquid.lang === 'ita'?"chiudi":"close"), image:"multiply.png", client:"Liquid.close(this)", filter:filter, padding:"3px" }
                                ];
                            }
                        }
                        var captionId = controlId + ".caption_title";
                        var captionTitleHTML = "<div class=\"liquidPopupTitle\" id=\""+captionId+"\" style=\"pointer-events:none;\" title=\""+title+"\">" + title + "</div>";
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
                        // if(Liquid.projectMode) Liquid.setDraggable(this.popupCaptionObj);
                        if(this.tableJson.captionVisible === false) {
                            this.popupCaptionObj.style.display = 'none';
                        }
                        this.rootObj.insertBefore(this.popupCaptionObj, this.outDivObj.firstChild);
                    }

                    // lookup
                    if(this.mode === "lookup") {
                        // if(isDef(this.tableJson.query)) debugger;
                        this.isLookupShared = Liquid.createLookupObjects(this, this.rootObj, this.rootObj.id);
                    }
                    
                    if(!isDef(this.rootObj)) {
                        console.error("ERROR : control:" + this.controlId + " Failed set/create rootObj");    
                    }


                    if(this.tableJson.resize === true || this.tableJson.resize === 'both' || this.tableJson.resize === 'linked') {
                        if(this.tableJson.resize === true || this.tableJson.resize === 'both') {
                            if(this.outDivObj) {
                                this.outDivObj.style.resize = this.tableJson.resize;
                                if(this.mode !== "lookup") {
                                    this.outDivObj.style.overflow = 'hidden';
                                }
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


                    // Foreign table
                    this.lastForeignTabSelected = null;
                    this.lastForeignTabObjSelected = null;
                    this.foreignTables = null;
                    this.FTTabList = [ {} ];
                    
                    // Solving
                    if(isDef(this.tableJson.foreignTables)) {
                        if(Array.isArray(this.tableJson.foreignTables)) {
                            for(var i=0; i<this.tableJson.foreignTables.length; i++) {
                                Liquid.addForeignTable(this, this.tableJson.foreignTables[i], null, null, [ i+1 ] );
                            }
                        }
                    }
                    // Creating Foreign table
                    if(isDef(this.foreignTables)) {
                        if(Array.isArray(this.tableJson.foreignTables)) {
                            this.foreignTablesVisible = typeof this.tableJson.foreignTablesVisible !== "undefined" ? this.tableJson.foreignTablesVisible : true;
                            if(this.foreignTablesVisible) {
                                this.foreignTablesObj = document.createElement("div");
                                this.foreignTablesObj.id = controlId + ".foreignTable.tabs";
                                this.foreignTablesObj.className = "liquidForeignTables";
                                if(Liquid.projectMode) Liquid.setDraggable(this.foreignTablesObj);
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
                                                var contentId = this.controlId + ".foreignTable." + ftId + ".content";
                                                var addingCode = "";
                                                if(Liquid.projectMode) addingCode = "<img src=\""+Liquid.getImagePath("add.png")+"\" id=\""+tabId+".adder"+"\" onClick=\"LiquidEditing.onNewForeignTable(event)\" style=\"width:12px; height:12px; padding-left:10px; filter:grayscale(0.7); cursor:pointer\" />";
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
                                                this.foreignTables[ic].contentObj.id = contentId;
                                                this.foreignTables[ic].contentObj.className = "liquidForeignTablesContent";
                                                this.foreignTables[ic].controlObjectId = this.controlId + ".foreignTable." + ftId + ".content";
                                                this.foreignTables[ic].json = { table: this.foreignTables[ic].foreignTable, mode:"auto" };
                                                // set api manager
                                                this.foreignTables[ic].columnsApiParams = { liquid:this, index:ic, sourceForeignTablesIndexes1B:this.foreignTables[ic].sourceForeignTablesIndexes1B };
                                                this.foreignTables[ic].columnsApi = Liquid.foreignTablesColumnsApi;
                                                this.foreignTables[ic].gridsApiParams = { liquid:this, index:ic, sourceForeignTablesIndexes1B:this.foreignTables[ic].sourceForeignTablesIndexes1B };
                                                this.foreignTables[ic].gridsApi = Liquid.foreignTablesGridsApi;
                                                this.foreignTables[ic].contentObj.setAttribute('foreignTable1B', ic+1);
                                                this.foreignTables[ic].contentObj.setAttribute('foreignTableIndex', this.FTTabList.length);

                                                this.FTTabList.push( { name:ftName, tabId:tabId, contentId:contentId, controlId:this.foreignTables[ic].controlId, parentControlId:this.controlId } );
                                            }
                                        }
                                    }
                                }
                                if(Liquid.projectMode) {
                                    // New tab
                                    ftHTML += "<li><a href=\"javascript:void(0)\" style=\"\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"LiquidEditing.onNewForeignTable(event)\">" + "<img id=\"" + controlId + ".newForeignTable" + "\" src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; filter:grayscale(0.7); cursor:pointer\" />" + "</a></li>";
                                }
                                // tabs
                                this.homeTabId = controlId + ".homeTable." + this.tableJson.table;
                                this.homeName = (isDef(this.tableJson.name) ? (this.tableJson.name ? this.tableJson.name : this.tableJson.table ) : this.tableJson.table);
                                var homeHTML = "<li><a href=\"javascript:void(0)\" id=\"" + this.homeTabId + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onForeignTable(this)\">" + this.homeName + "</a></li>";
                                this.foreignTablesObj.innerHTML = ""
                                        + "<div style=\"float:left; width:100%; text-align:center;\" id=\""+controlId+".foreignTable.container\" class=\"liquidForeignTablesContainer\"><ul>"
                                        + homeHTML
                                        + ftHTML
                                        + "</ul></div>";
                                this.rootObj.appendChild(this.foreignTablesObj);                          
                                Liquid.setTooltip(this.homeTabId, "Liquid.onHomeTooltip('"+this.homeTabId+"')");
                                this.FTTabList[0].name = this.homeName;
                                this.FTTabList[0].tabId = this.homeTabId;
                                this.FTTabList[0].controlId = this;
                                this.FTTabList[0].parentControlId = null;
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
                                // set the root container for list/grids/layouts/etc
                                this.rootObj = this.homeTablesGridContainerObj;
                            }
                            for(var ic=0; ic<this.foreignTables.length; ic++) {
                                if(this.foreignTables[ic].foreignTable) {
                                    if(this.foreignTables[ic].foreignColumn) {
                                        if(this.foreignTables[ic].column) {
                                            Liquid.transferFeatures(this, this.foreignTables[ic], this.foreignTables[ic].json);
                                            var srcLiquidOrId = this;
                                            var srcControlId = this.controlId;
                                            if(this.foreignTables[ic].sourceLiquidControlId !== 'undefined' && this.foreignTables[ic].sourceLiquidControlId)
                                                srcLiquidOrId = this.foreignTables[ic].sourceLiquidControlId;

                                            if(typeof this.foreignTables[ic].json['database'] === 'undefined' || !this.foreignTables[ic].json['database']) {
                                                this.foreignTables[ic].json['database'] = this.tableJson.database;
                                            }                                            
                                            if(typeof this.foreignTables[ic].json['schema'] === 'undefined' || !this.foreignTables[ic].json['schema']) {
                                                this.foreignTables[ic].json['schema'] = this.tableJson.schema;
                                            }                                            
                                            if(typeof this.tableJson.resize !== 'undefined')
                                                this.foreignTables[ic].json['resize'] = 'linked';

                                            this.foreignTables[ic].json['token'] = this.tableJson.token;
                                            
                                            this.foreignTables[ic].json['autoLoad'] = false;


                                            var waiterId = this.foreignTables[ic].tabId+".waiter";
                                            this.foreignTables[ic].json.waitersId = [ waiterId ];

                                            // this.foreignTables[ic].liquid = ... Need sync exec
                                            new LiquidCtrl( this.foreignTables[ic].controlId, this.foreignTables[ic].controlObjectId, JSON.stringify(this.foreignTables[ic].json)
                                                            ,{ 
                                                                 liquidOrId:srcLiquidOrId
                                                                ,foreignWrk:this.foreignTables[ic].foreignWrk
                                                                ,foreignTable:this.foreignTables[ic].foreignTable
                                                                ,foreignColumn:this.foreignTables[ic].foreignColumn
                                                                ,column:this.foreignTables[ic].column
                                                                ,rootControlId:(this.rootControlId ? this.rootControlId : this.controlId)
                                                                ,sourceForeignTablesIndexes1B:this.foreignTables[ic].sourceForeignTablesIndexes1B
                                                                ,columnsApiParams:this.foreignTables[ic].columnsApiParams
                                                                ,columnsApi:this.foreignTables[ic].columnsApi
                                                                ,gridsApiParams:this.foreignTables[ic].gridsApiParams
                                                                ,gridsApi:this.foreignTables[ic].gridsApi
                                                            }
                                                            ,this.foreignTables[ic].json.mode, null);                                                        
                                        }
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
                            if(Liquid.projectMode) Liquid.setDraggable(this.commandsObj);
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
                    
                    this.dockerTbl = document.createElement("table");
                    this.dockerTbl.className = "liquidDocker";
                    this.dockerTbl.cellPadding = 0;
                    this.dockerTbl.cellSpacing = 0;
                    this.dockerTbl.id = controlId + ".docker";
                    this.dockerTbl.className = "liquidDocker";
                    // this.dockerTbl.style.height = "100%";
                    
                    var tbody = document.createElement("tbody");
                    var tr = document.createElement("tr");
                    var td = document.createElement("td");
                    var content_div = document.createElement("div");

                    tbody.className = "liquidDockerChild";

                    content_div.id = controlId + ".docker.top";
                    content_div.className = "liquidDockerHContainer";
                    td.colSpan = 3;
                    td.className = "liquidDockerChild";
                    tr.className = "liquidDockerChild";
                    td.appendChild(content_div);
                    tr.appendChild(td);
                    tbody.appendChild(tr);



                    tr = document.createElement("tr");
                    td = document.createElement("td");
                    td.colSpan = 3;
                    td.style.display = "flex";
                    content_div = document.createElement("div");
                    content_div.id = controlId + ".docker.left";
                    content_div.className = "liquidDockerVContainer";
                    content_div.style.width = "1px";
                    content_div.style.display = "none";
                    // content_div.style.resize = "horizontal";
                    content_div.style.overflow = "hidden";
                    this.dockerTblLeft = content_div;
                    td.appendChild(content_div);
                    // tr.appendChild(td);
                    
                    // td = document.createElement("td");
                    content_div = document.createElement("div");
                    content_div.id = controlId + ".docker.center";
                    content_div.className = "liquidDockerVContainer";
                    content_div.style.width = "calc(100% - 0px)";
                    content_div.style.overflow = "hidden";
                    this.dockerTblCenter = content_div;
                    this.dockerRoot = content_div;
                    td.appendChild(content_div);
                    // tr.appendChild(td);                    
                    
                    // td = document.createElement("td");                    
                    content_div = document.createElement("div");
                    content_div.id = controlId + ".docker.right";
                    content_div.className = "liquidDockerVContainer";
                    content_div.style.width = "1px";
                    content_div.style.display = "none";
                    // content_div.style.resize = "horizontal";
                    content_div.style.overflow = "hidden";
                    this.dockerTblRight = content_div;
                    td.className = "liquidDockerChild";
                    tr.className = "liquidDockerChild";

                    td.appendChild(content_div);
                    tr.appendChild(td);
                    tbody.appendChild(tr);

                    tr = document.createElement("tr");
                    td = document.createElement("td");
                    content_div = document.createElement("div");
                    content_div.id = controlId + ".docker.bottom";
                    content_div.className = "liquidDockerHContainer";
                    td.colSpan = 3;
                    td.className = "liquidDockerChild";
                    tr.className = "liquidDockerChild";
                    
                    td.appendChild(content_div);
                    tr.appendChild(td);
                    tbody.appendChild(tr);

                    this.dockerTbl.appendChild(tbody);
                        
                    this.rootObj.appendChild(this.dockerTbl);

                    // set the resizer
                    var thisLiquid = this;
                    if(thisLiquid.dockerTblLeft) {
                        jQ1124( this.dockerTblLeft ).resizable( {
                            handles:'e'
                            ,animate: false
                            ,ghost: true 
                            ,resize: function( event, ui ) {
                                thisLiquid.dockerTblLeft.style.width = ui.size.width + "px";
                                thisLiquid.dockerTblCenter.style.width = (thisLiquid.outDivObj.offsetWidth - thisLiquid.dockerTblRight.offsetWidth - thisLiquid.dockerTblLeft.offsetWidth) + "px";
                                // thisLiquid.dockerTblCenter.style.height = Math.max(thisLiquid.dockerTblLeft.clientHeight, thisLiquid.dockerTblRight.clientHeight) + "px";
                            }
                            ,stop: function( event, ui ) {
                                if(thisLiquid.dockerTblLeft.offsetWidth <= 10) thisLiquid.dockerTblLeft.style.width = "2px";
                                thisLiquid.dockerTblCenter.style.width = (thisLiquid.outDivObj.offsetWidth - thisLiquid.dockerTblRight.offsetWidth - thisLiquid.dockerTblLeft.offsetWidth) + "px";
                                // thisLiquid.dockerTblCenter.style.height = Math.max(thisLiquid.dockerTblLeft.clientHeight, thisLiquid.dockerTblRight.clientHeight) + "px";
                            }
                        } );
                    }
                    if(thisLiquid.dockerTblRight) {
                        jQ1124( this.dockerTblRight ).resizable( { 
                            handles:'w'
                            ,animate: false
                            ,ghost: true 
                            ,resize: function( event, ui ) {
                                thisLiquid.dockerTblRight.style.width = ui.size.width + "px";
                                thisLiquid.dockerTblCenter.style.width = (thisLiquid.outDivObj.offsetWidth - thisLiquid.dockerTblRight.offsetWidth - thisLiquid.dockerTblLeft.offsetWidth) + "px";
                                // thisLiquid.dockerTblCenter.style.height = Math.min(thisLiquid.dockerTblLeft.clientHeight, thisLiquid.dockerTblRight.clientHeight) + "px";
                            }
                            ,stop: function( event, ui ) {
                                if(thisLiquid.dockerTblRight.offsetWidth <= 10) thisLiquid.dockerTblRight.style.width = "2px";
                                thisLiquid.dockerTblRight.style.left = '';
                                thisLiquid.dockerTblCenter.style.width = (thisLiquid.outDivObj.offsetWidth - liquid.dockerTblRight.offsetWidth - thisLiquid.dockerTblLeft.offsetWidth) + "px";
                                // thisLiquid.dockerTblCenter.style.height = Math.min(thisLiquid.dockerTblLeft.clientHeight, thisLiquid.dockerTblRight.clientHeight) + "px";
                            }
                        } );
                    }
                    
                    this.tabList = [];
                    
                    if( (this.tableJson.grids && this.tableJson.grids.length > 0)
                     || (this.tableJson.layouts && this.tableJson.layouts.length > 0)
                     || (this.tableJson.documents && this.tableJson.documents.length > 0)
                     || (this.tableJson.charts && this.tableJson.charts.length > 0)
                     ) {                     
                        this.gridTabsObj = document.createElement("div");
                        this.gridTabsObj.style.display="";
                        this.gridTabsObj.className = "liquidGridTables";
                        this.gridTabsObj.id = controlId + ".grid_tabs";
                        
                        // this.rootObj.appendChild(this.gridTabsObj);
                        this.dockerRoot.appendChild(this.gridTabsObj);
                        
                        if(this.tableJson.listTabVisible === false) listTabStyle = "style=\"display:none\"";
                        var gIdLast = controlId + ".grid_tab.0";
                        var gtName = isDef(this.tableJson.listTabTitle) ? this.tableJson.listTabTitle : "List";
                        listTabHTML = "<li class=\"liquidTabSel\" "+listTabStyle+"><a href=\"javascript:void(0)\" id=\"" + gIdLast + "\" class=\"liquidTab liquidForeignTableEnabled\" onClick=\"Liquid.onGridTab(this)\">" + gtName + "</a></li>";
                        this.gridsFirstId = null;
                        this.tabList.push( { name:gtName, caption:gtName, id:this.gIdLast });
                    }
                            
                    if(this.tableJson.grids) {
                        if(this.tableJson.grids.length > 0) {
                            for(var ig = 0; ig < this.tableJson.grids.length; ig++) {
                                var grid = this.tableJson.grids[ig];
                                if(grid) {
                                    grid.resizeCounter = 0;
                                    grid.containerObj = document.createElement("div");
                                    grid.containerObj.className = "liquidGridContainer";
                                    grid.containerObj.id = controlId + ".grid_tab." + (ig+1) + ".content";
                                    grid.containerObj.style.display = "none";                               

                                    grid.gridObj = Liquid.createGrid(this, grid, ig + 1, grid.containerObj);

                                    grid.containerObj.appendChild(grid.gridObj);                                
                                    if(this.tableJson.gridsTabVisible === false || grid.tabVisible === false) gridsTabStyle = "style=\"display:none\"";

                                    if(isDef(grid.columns)) {
                                        var gId = controlId + ".grid_tab." + (ig + 1);
                                        var gtName = grid.title ? grid.title : grid.name;
                                        gridTabHTML += "<li "+gridsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + gId + "\" class=\"liquidTab liquidGridTab liquidForeignTableEnabled\" onClick=\"Liquid.onGridTab(this)\">" + gtName + "</a></li>";
                                        this.tabList.push( { name:grid.name, caption:grid.title, id:gId });
                                    }
                                }
                            }

                            if(Liquid.projectMode) {
                                // New tab
                                var title = (Liquid.lang === 'eng' ? "Add a grid" : "Aggiungi una griglia");
                                newTabHTML += "<li><a href=\"javascript:void(0)\" class=\"liquidTab liquidForeignTableEnabled\" title=\""+title+"\" onClick=\"LiquidEditing.onNewGrid(event)\">" + "<img id=\"" + controlId + ".newGrid" + "\" src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:12px; height:12px; filter:grayscale(0.7); cursor:pointer\" />" + "</a></li>";
                                title = (Liquid.lang === 'eng' ? "Add a layout" : "Aggiungi un layout");
                                newTabHTML += "<li><a href=\"javascript:void(0)\" class=\"liquidTab liquidForeignTableEnabled\" title=\""+title+"\" onClick=\"LiquidEditing.onNewLayout(event)\">" + "<img id=\"" + controlId + ".neLayout" + "\" src=\""+Liquid.getImagePath("forms2.png")+"\" style=\"width:12px; height:12px; filter:grayscale(0.7); cursor:pointer\" />" + "</a></li>";
                            }
                            // Append grid object and link to fields
                            for(var ig = 0; ig < this.tableJson.grids.length; ig++) {
                                var grid = this.tableJson.grids[ig];
                                if(grid) {
                                    this.dockerRoot.appendChild(grid.containerObj);
                                    if(isDef(grid.columns)) {
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
                                        for(var ic=0; ic<grid.columns.length; ic++) { 
                                            if(!isDef(grid.columns[ic].colLink1B)) { 
                                                if(!isDef(grid.columns[ic].query)) { 
                                                    console.error("ERROR : control:" + this.controlId + " grid:" + grid.name + " columns:" + grid.columns[ic].name + " NOT Resolved"); 
                                                }
                                            } 
                                        }
                                    }
                                }
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
                                    layout.resizeCounter = 0;
                                    layout.pageLoaded = false;
                                    layout.pendingLink = true;
                                    layout.currentRow1B = 0;
                                    layout.currentAbsoluteRow1B = 0;
                                    layout.containerObj = document.createElement("div");
                                    layout.containerObj.className = "liquidLayoutContainer";
                                    layout.containerObj.id = controlId + ".layout_tab." + (il+1) + ".content";
                                    layout.containerObj.style.display = "none";
                                    
                                    jQ1124(layout.containerObj).on("visibilityChanged", function(event) {
                                        Liquid.onLayoutShow(event);
                                    });
                                    
                                    if(layout.containerObj.addEventListener) { layout.containerObj.addEventListener('scroll', Liquid.onLayoutContainerScroll); } else { document.body.attachEvent('scroll', Liquid.onLayoutContainerScroll); }
                                    if(isDef(layout.backgroundColor)) layout.containerObj.style.backgroundColor = layout.backgroundColor;
                                    this.dockerRoot.appendChild(layout.containerObj);
                                    if(this.tableJson.layoutsTabVisible === false || layout.tabVisible === false) layoutsTabStyle = "style=\"display:none\"";
                                    var layoutId = controlId + ".layout_tab." + (il + 1);
                                    var layoutName = layout.title ? layout.title : layout.name ? layout.name : "Layout";
                                    if(this.tableJson.listTabVisible === false) listTabStyle = "style=\"display:none\"";
                                    layoutTabHTML += "<li "+layoutsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + layoutId + "\" class=\"liquidTab liquidLayoutTab liquidForeignTableEnabled\" onClick=\"Liquid.onLayoutTab(this)\">" + layoutName + "</a></li>";
                                    this.tabList.push( { name:layoutName, id:layoutId });
                                }
                            }
                        }
                    }
                    if(this.tableJson.documents) {
                        if(this.tableJson.documents.length > 0) {
                            for(var id = 0; id < this.tableJson.documents.length; id++) {
                                var doc = this.tableJson.documents[id];
                                if(doc) {
                                    doc.resizeCounter = 0;
                                    doc.pageLoaded = false;
                                    doc.useIframe = true;
                                    if(doc.useIframe) doc.containerObj = document.createElement("iframe");
                                    else doc.containerObj = document.createElement("div");
                                    doc.containerObj.className = "liquidDocumentContainer";
                                    doc.containerObj.id = controlId + ".document_tab." + (id+1) + ".content";
                                    doc.containerObj.style.display = "none";
                                    this.dockerRoot.appendChild(doc.containerObj);
                                    if(this.tableJson.documentsTabVisible === false || doc.tabVisible === false) documentsTabStyle = "style=\"display:none\"";
                                    var docId = controlId + ".document_tab." + (id + 1);
                                    var docName = doc.title ? doc.title : doc.name ? doc.name : "Documents";
                                    documentTabHTML += "<li"+documentsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + docId + "\" class=\"liquidTab liquidDocuemntTab liquidForeignTableEnabled\" onClick=\"Liquid.onDocumentTab(this)\">" + docName + "</a></li>";
                                    this.tabList.push( { name:docName, id:docId });
                                }
                            }
                        }
                    }                       
                    if(this.tableJson.charts) {
                        if(this.tableJson.charts.length > 0) {
                            for(var ic=0; ic<this.tableJson.charts.length; ic++) {
                                var chart = this.tableJson.charts[ic];
                                if(chart) {
                                    chart.resizeCounter = 0;
                                    chart.pageLoaded = false;
                                    chart.useIframe = true;
                                    if(chart.useIframe) chart.containerObj = document.createElement("iframe");
                                    else chart.containerObj = document.createElement("div");
                                    chart.containerObj.className = "liquidChartContainer";
                                    chart.containerObj.id = controlId + ".chart_tab." + (ic+1) + ".content";
                                    chart.containerObj.style.display = "none";
                                    this.dockerRoot.appendChild(chart.containerObj);
                                    if(this.tableJson.chartsTabVisible === false || chart.tabVisible === false) chartsTabStyle = "style=\"display:none\"";
                                    var chartId = controlId + ".chart_tab." + (ic + 1);
                                    var chartName = chart.title ? chart.title : chart.name ? chart.name : "Layout";
                                    chartTabHTML += "<li "+chartsTabStyle+"><a href=\"javascript:void(0)\" id=\"" + chartId + "\" class=\"liquidTab liquidChartTab liquidForeignTableEnabled\" onClick=\"Liquid.onChartTab(this)\">" + chartName + "</a></li>";
                                    this.tabList.push( { name:chartName, id:chartId });
                                }
                            }
                        }
                    }
                    // list/grids/layout/document tabs   
                    if(this.gridTabsObj) {
                        this.gridTabsObj.innerHTML = ""
                                + "<div style=\"display:block\" id=\""+controlId + ".gridTableTabs"+"\" class=\"liquidGridTablesTabs\" ><ul>"
                                + listTabHTML
                                + gridTabHTML
                                + layoutTabHTML
                                + documentTabHTML
                                + chartTabHTML
                                + newTabHTML
                                + "</ul></div>";
                        this.listGridTabObj = this.lastGridTabObj = document.getElementById(gIdLast);
                        if(Liquid.projectMode) Liquid.setDraggable(this.gridTabsObj);
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
                    this.listRootObj = document.createElement("div");
                    this.listRootObj.id = controlId + ".grid_tab.0.content";
                    this.listRootObj.style.width = "100%";
                    this.listRootObj.className = "liquidContainer";
                    this.listRootObj.style.overflow = "auto";
                    this.dockerRoot.appendChild(this.listRootObj);

                    this.listObj = document.createElement("div");
                    this.listObj.id = controlId + ".aggrid_contanier";
                    this.listObj.className = "liquidGridContainer";
                    this.listObj.style.overflow = "auto";
                    this.listObj.style.width = "100%";
                    // if(Liquid.projectMode) this.listObj.draggable = true;
                    this.listObj.className += " ag-theme-balham liquidContainer";
                    this.listRootObj.appendChild(this.listObj);
                    
                    var oldWarn = console.warn; console.warn = function() {}; 
                    try { this.grid = new window.agGrid.Grid(this.listObj, this.gridOptions); } catch(e) { console.error(e); }
                    console.warn = oldWarn;
                    if(this.listObj) {
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
                                if(typeof this.tableJson.width !== 'undefined') {
                                    this.lookupContainerComboContent.style.width = Liquid.getCSSDim(this.tableJson.width);
                                } else {                                    
                                }
                                if(typeof this.tableJson.height !== 'undefined') {
                                    this.aggridContainerObj.style.height = Liquid.getCSSDim(this.tableJson.height);
                                } else {
                                    if(this.outDivObj) this.aggridContainerObj.style.height = this.outDivObj.offsetWidth / 2.0;
                                }                                
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
                                + "<div id=\"" + this.controlId + ".error\" style=\"float:left; user-select:text; cursor:pointer\" class=\"liquidError\" onclick=\"Liquid.onErrorClick(this)\"></div>"
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
                        if(Liquid.projectMode) Liquid.setDraggable(this.navObj);
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
                                this.tableJson.multipanels[ic].json = { table: this.tableJson.multipanels[ic].foreignTable, mode:"auto" };

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
                                            Liquid.transferFeatures(this, this.tableJson.multipanels[ic], this.tableJson.multipanels[ic].json);
                                            
                                            if(typeof this.tableJson.multipanels[ic].json['driver'] === 'undefined' || !this.tableJson.multipanels[ic].json['driver']) {
                                                this.tableJson.multipanels[ic].json['driver'] = this.tableJson.driver;
                                            }                                            
                                            if(typeof this.tableJson.multipanels[ic].json['database'] === 'undefined' || !this.tableJson.multipanels[ic].json['database']) {
                                                this.tableJson.multipanels[ic].json['database'] = this.tableJson.database;
                                            }                                            
                                            if(typeof this.tableJson.multipanels[ic].json['schema'] === 'undefined' || !this.tableJson.multipanels[ic].json['schema']) {
                                                this.tableJson.multipanels[ic].json['schema'] = this.tableJson.schema;
                                            }
                                            this.tableJson.multipanels[ic].json['token'] = this.tableJson.token;
                                            
                                            new LiquidCtrl( this.tableJson.multipanels[ic].controlId, this.tableJson.multipanels[ic].controlObjectId, JSON.stringify(this.tableJson.multipanels[ic].json)
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
                        tbl.cellPadding = 0;
                        tbl.cellSpacing = 0;
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
                            bt.onclick = Liquid.onCommandBarClickDeferred;
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
                        if(Liquid.projectMode) Liquid.setDraggable(this.actionsObj);
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
                    
                    
                    this.outDivObj.style.filter = "grayscale(.5) opacity(0.3) blur(5px)";
                                        
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

                    // current tab
                    var currentTab = this.tableJson.currentTab;
                    if(isDef(this.sourceData)) {
                        if(isDef(this.sourceData.tempCurrentTab)) { // overlapped
                            currentTab = this.sourceData.tempCurrentTab;
                            delete this.sourceData.tempCurrentTab;
                        }
                    }
                    
                    // set current tab
                    this.gridLoadCounter++;
                    if(isDef(currentTab)) {
                        if(!isNaN(currentTab)) currentTab = Number(currentTab);
                        Liquid.setCurrentTab(this, currentTab);
                    }
                    
                    // set current foreign table
                    if(isDef(this.tableJson.currentForeignTable) && this.tableJson.currentForeignTable) {
                        if(!isNaN(this.tableJson.currentForeignTable)) this.tableJson.currentForeignTable = Number(this.tableJson.currentForeignTable);
                        Liquid.setCurrentForeignTable(this, this.tableJson.currentForeignTable);
                    } else {
                        if(this.homeTablesObj) {
                            Liquid.onForeignTable(document.getElementById(this.homeTabId));
                        }
                    }

                    if(this.mode === "lookup") {
                        if(this.status !== "open") { // initial closed
                            if(this.tableJson.keepOpen !== true) {
                                Liquid.onCloseLookup(this);
                            }
                        } else {
                            var liquid = this;
                            // setTimeout( function() { Liquid.onBringLookup(liquid, true); }, 3000 );
                            Liquid.onBringLookup(document.getElementById(this.linkedInputId), true);
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
                    var hasLoadedData = false;
                    
                    if(this.tableJson) {
                        if(this.tableJson.autoLoad !== false || isRebuilding === true) {
                            if(isFormX) { 
                                // no data to load
                            } else {
                                Liquid.loadData(this, null, "start");
                                hasLoadedData = true;
                            }
                        } else if(Liquid.cleanData) { this.gridOptions.api.setRowData(null); this.gridOptions.api.clearFocusedCell(); this.lastSelectedId = null; }
                    }
                    
                    // need to build params map
                    if(isDef(this.tableJson.query)) {
                        if(!hasLoadedData) {
                            this.tableJson.queryParamsMap = Liquid.buildQueryParam(this, this.tableJson.queryParams);
                        }
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
                    if(this.tableJson.autoLoad !== false || isRebuilding === true || this.tableJson.isSystem === true) { // action onload disabled or rebuilding or system
                        var isAutoInsert = Liquid.isAutoInsert(this);
                        if(isFormX || isAutoInsert === true) {
                            Liquid.autoInsert(this);
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


                    // combo mode
                    if(this.mode === "combo") {
                        if(this.tableJson.combo) {
                            if(this.tableJson.combo.status === 'open' || this.tableJson.combo.status === 'openen') {
                                Liquid.setControlAsCombo( this, false );
                            } else {
                                Liquid.setControlAsCombo( this, true );
                            }
                        } else {
                            Liquid.setControlAsCombo( this, true );
                        }
                        this.outDivObj.style.filter = "grayscale(.0) opacity(1.0) blur(0px)";
                        
                    } else {

                        if(this.outDivObj.style.display !== "none") {
                            // show animating
                            try {
                                this.outDivObj.style.display = "none";
                                var liquid = this;
                                liquid.isResizing = true;
                                jQ1124( liquid.outDivObj ).slideDown( "fast", 
                                function() { 
                                    liquid.isResizing = false;
                                    Liquid.onResize(liquid);
                                    liquid.outDivObj.style.filter = "grayscale(.0) opacity(1.0) blur(0px)"; 
                                } 
                                        );
                            } catch (e) { 
                                console.error(e);
                                this.outDivObj.style.filter = "grayscale(.0) opacity(1.0) blur(0px)";
                            }
                        } else {
                            this.outDivObj.style.filter = "grayscale(.0) opacity(1.0) blur(0px)";
                        }
                    }
                        
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
        if(typeof this.onLoadedOnce !== 'undefined' && this.onLoadedOnce) {
            for (var ie=0; ie<this.onLoadedOnce.length; ie++) {
                var eventFunc = this.onLoadedOnce[ie];
                if(eventFunc) {
                    try {
                        var result = eventFunc();
                    } catch(e) { console.error("ERROR: on event onLoadedOnce:"+e); }
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
                
            var filter = "";
            if(isDef(Liquid.captionIconFilter)) {
                filter += Liquid.captionIconFilter;
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
                this.menuIconObj.style.filter = filter;
                this.outDivObj.appendChild( this.menuIconObj );
            }
            
            if(this.menuJson.type === 'left') {
                if(this.menuJson.resize === true) {
                    this.menuContainerObj.style.resize = "horizontal";
                    this.menuContainerObj.style.overflow = 'visible';
                    this.outDivObj.style.overflow = "visible";
                    jQ1124( this.menuContainerObj ).resizable({handles:'e, w'});
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
                    jQ1124( this.menuContainerObj ).resizable({handles:'e, w'});
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
                    jQ1124( this.menuContainerObj ).resizable({handles:'n, s'});
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
                    jQ1124( this.menuContainerObj ).resizable({handles:'n, s'});
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
                    jQ1124( this.menuContainerObj ).resizable({handles:'e, w'});
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

    version: 1.47,
    appTitle:"LIQUID",
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
    loadingMessage:"",
    noRowsMessage:"",
    iconincSize: { wx:175, wy:26 },
    paginationTitleGoTo:"",
    paginationTitleFirst:"",
    paginationTitlePrevious:"",
    paginationTitleNext:"",
    paginationTitleLast:"",
    askForSaveTitle:"",
    askForSaveMessage:"",
    foundText:"",
    defaultWinXLeft:10,
    defaultWinXTop:10,
    defaultMultipanelHeight:50,
    defaultLookupHeight:200,
    NoSelectedFileMessage:"",
    FileTooBigMessage:"",
    Save:"",
    Discharge:"",
    minIntervalReadWorkers:250,
    defaultIntervalReadWorkers:15000,
    reloadDataOnFocus:false,
    statusBarHeight:30,
    statusMessagePersistMsec:5000,
    curMessageBusy:false,
    curMessageDealyTimeSec:10,
    registeredOnUnloadPage:false,
    onClosePageReturn:null,
    dynamicFilterMinTimeMS:500,
    userConnectionList:[],
    loadDBInitialSize: (2 * 1024 * 1024),
    loadDBversion:2,
    swapCellsMessage:"Do you want to swap the cells ?",
    moveCellsMessage:"Do you want to move the the cell ?",
    flashingPersistTimeMsec:5000,
    captionIconFilter:null,
    captionIconSize:12,
    mirrorEventIntervalNs: 500*1000,
    lookupIconSize:12,
    filterIconSize:16,
    setLanguage:function(language) {
        var lang_list = language.split(';');
        for(var il=0; il<lang_list.length; il++) {
            var lang = lang_list[il].split('-')[0];
            if(lang === 'it' || lang === 'ita') {
                Liquid.lang = 'ita';
                Liquid.loadingMessage = "<span class=\"ag-overlay-loading-center\">Caricamento dati...</span>";
                Liquid.noRowsMessage = "<span class=\"ag-overlay-loading-center\">Nessun dato trovato...</span>";
                Liquid.paginationTitleGoTo = "digita la pagina a cui andare ... poi premi enter";
                Liquid.paginationTitleFirst = "vai alla prima pagina";
                Liquid.paginationTitlePrevious = "vai alla pagina precedente";
                Liquid.paginationTitleNext = "vai alla pagina seguente";
                Liquid.paginationTitleLast = "vai all'ultima";
                Liquid.askForSaveTitle = "DOMANDA";
                Liquid.askForSaveMessage = "Salvare la configurazione del controllo ?";
                Liquid.foundText = "Trovato a R:${rec} - C:${col}";
                Liquid.NoSelectedFileMessage = "File non selezionato";
                Liquid.FileTooBigMessage = "File troppo grande";
                Liquid.Save = "Salva";
                Liquid.Discharge = "scarta";
                Liquid.swapCellsMessage = "Confermi lo scambio delle celle ?";
                Liquid.moveCellsMessage = "Confermi lo spostamento della cella ?";
                return;
            } else if(lang === 'en' || lang === 'eng') {
                Liquid.lang = 'eng';
                Liquid.loadingMessage = "<span class=\"ag-overlay-loading-center\">Loading data...</span>";
                Liquid.noRowsMessage = "<span class=\"ag-overlay-loading-center\">No data to show...</span>";
                Liquid.paginationTitleGoTo = "type page to go to ... then press enter";
                Liquid.paginationTitleFirst = "go to first page";
                Liquid.paginationTitlePrevious = "go to previous page";
                Liquid.paginationTitleNext = "go to next page";
                Liquid.paginationTitleLast = "go to last page";
                Liquid.askForSaveTitle = "QUESTION";
                Liquid.askForSaveMessage = "Save control's configuration ?";
                Liquid.foundText = "Found at R:${rec} - C:${col}";
                Liquid.NoSelectedFileMessage = "File not selected";
                Liquid.FileTooBigMessage = "File too big";
                Liquid.Save = "Save";
                Liquid.Discharge = "Discharge";
                Liquid.swapCellsMessage = "Do you want to swap the cells ?";
                Liquid.moveCellsMessage = "Do you want to move the cell ?";
                return;
            }
        }
        console.warn("WARNING : language not recorgnized:"+lang);
        Liquid.setLanguage('eng');
    },
    searchLiquid:function(searchingNameOrObject) {
        for(var prop in window) {
            try {
                if(typeof window[prop] === 'object') {
                    if(isDef(window[prop].controlId)) {
                        if(window[prop].controlId === searchingNameOrObject) {
                            return window[prop];
                        }
                    }
                }
            } catch(e) {                
            }
        }
        return null;
    },
    getLiquid:function(searchingNameOrObject) {
        try {
            if(searchingNameOrObject) {
                var searchingNames = null;
                var searchingNameOrObjectBk = searchingNameOrObject;
                if(searchingNameOrObject instanceof LiquidCtrl) {
                    return searchingNameOrObject;
                } else if(searchingNameOrObject instanceof LiquidMenuXCtrl) {
                    return searchingNameOrObject;
                } else if(typeof searchingNameOrObject === "object") {
                    if(isDef(searchingNameOrObject.controlId)) {
                        searchingNames = [ searchingNameOrObject.controlId ];
                    } else {
                        if(isDef(searchingNameOrObject.id)) {
                            if(!searchingNameOrObject.id) {
                                while(!searchingNameOrObject.id && searchingNameOrObject) {
                                    searchingNameOrObject = searchingNameOrObject.parentNode;
                                }
                            }
                            if(isDef(searchingNameOrObject.id)) {
                                searchingNames = searchingNameOrObject.id.split(".");
                                if(!searchingNames) {
                                    while(!searchingNameOrObject.id) searchingNameOrObject = searchingNameOrObject.parentNode
                                    searchingNames = searchingNameOrObject.id.split(".");
                                }
                            }
                        }
                    }
                    if(!searchingNames) return null;
                } else if(typeof searchingNameOrObject === "string") {
                    searchingNames = searchingNameOrObject.split(".");
                    if(typeof searchingNames === "undefined")
                        searchingNames = [searchingNameOrObject];
                } else {
                    console.error("getLiquid:undetected type of search:" + (typeof searchingNameOrObject));
                }
                if(Liquid.projectMode) {
                    var count = 0;
                    for(var i=0; i<glLiquids.length; i++) if(glLiquids[i].controlId === searchingNames[0]) count++;
                    if(count>1) alert("ERROR: duplicate control : "+searchingNames[0]);
                }
                // searching for controlId
                for(var i=0; i<glLiquids.length; i++) {
                    if(glLiquids[i].controlId === searchingNames[0]) return glLiquids[i];
                }
                // searching for table
                for(var i=0; i<glLiquids.length; i++) {
                    if(isDef(glLiquids[i].tableJson)) {
                        if(glLiquids[i].tableJson.table === searchingNames[0]) return glLiquids[i];
                    }
                }
                // is a layout fields ?
                if(searchingNameOrObjectBk instanceof HTMLElement) {
                    var linkedRow1B = searchingNameOrObjectBk.getAttribute('linkedrow1b');
                    var linkedId = searchingNameOrObjectBk.getAttribute('linkedid');
                    if(linkedId) {
                        searchingNames = linkedId.split(".");
                        var controlId = searchingNames[0];
                        for(var i=0; i<glLiquids.length; i++) {
                            if(glLiquids[i].controlId === controlId) return glLiquids[i];
                        }
                    }
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
    columnsApi:function(liquid, operation, new_col, params) { // general column manager
        if(operation === 'add') {
            // target identification
            liquid.tableJsonSource.columns.push(new_col);
            liquid.tableJsonSource.columnsResolved = false;
            Liquid.setAskForSave(liquid, true);
            var rootLiquid = Liquid.getRootLiquid(liquid);
            // ...
        } else if(operation === 'delete') {
            for(var index=0; index<liquid.tableJsonSource.columns.length; index++) {
                if(liquid.tableJsonSource.columns[index].name === new_col.name) {
                    liquid.tableJsonSource.columns.splice(index, 1);
                }
            }
        } else if(operation === 'update') {
            for(var index=0; index<liquid.tableJsonSource.columns.length; index++) {
                if(liquid.tableJsonSource.columns[index].name === new_col.name) {
                    liquid.tableJsonSource.columns[index] = new_col;
                }
            }
        }
    },
    gridsApi:function(liquid, operation, gridIndex, itemIndex, new_grid_tem, params) { // general grid column manager
        var retVal = null;
        if(operation === 'add') {
        } else if(operation === 'delete') {
        } else if(operation === 'update') {
            retVal = liquid.tableJsonSource.grids[gridIndex];
            liquid.tableJsonSource.grids[gridIndex].columns[itemIndex].name = new_grid_tem.name;
            liquid.tableJsonSource.grids[gridIndex].columns[itemIndex].label = new_grid_tem.label;
        }
        return retVal;
    },    
    foreignTablesColumnsApi:function(liquid, operation, new_col, params) { // foreign table general column manager
        if(operation === 'add') {
            try {
                var level = 0;
                var targetLiquid = params.liquid;
                var sourceForeignTablesIndexes1B = params.sourceForeignTablesIndexes1B;
                if(targetLiquid) {
                    var ift = sourceForeignTablesIndexes1B[level] - 1;
                    var foreignTable = targetLiquid.tableJsonSource.foreignTables[ift];
                    if(isDef(foreignTable.options)) {
                        if(!isDef(foreignTable.options.additionalColumns)) { // istantiate columns solved by auto mode ...
                            // foreignTable.options.columns = JSON.parse(JSON.stringify(liquid.tableJson.columns));
                            foreignTable.options.additionalColumns = [];
                        }
                        foreignTable.options.additionalColumns.push(new_col);
                        Liquid.setAskForSave(targetLiquid, true);
                    } else {
                        console.error("ERROR: options property not defined");
                    }
                } else {
                    var msg = "unsupported condition : you should add manually the column in the foreign table definition of "+params;
                    console.error("ERROR: "+msg);
                    alert(msg);
                }
            } catch (e) {}
        } else if(operation === 'delete') {
        } else if(operation === 'update') {
        }
    },
    foreignTablesGridsApi:function(liquid, operation, gridIndex, itemIndex, new_grid_tem, params) { // foreign table grid column manager
        var retVal = null;
        if(operation === 'add') {
        } else if(operation === 'delete') {
        } else if(operation === 'update') {
            try {
                var level = 0;
                var targetLiquid = params.liquid;
                var sourceForeignTablesIndexes1B = params.sourceForeignTablesIndexes1B;
                if(targetLiquid) {
                    var ift = sourceForeignTablesIndexes1B[level] - 1;
                    var foreignTable = targetLiquid.tableJsonSource.foreignTables[ift];
                    if(isDef(foreignTable.options)) {
                        if(!isDef(foreignTable.options.grids[gridIndex])) { // istantiate columns solved by auto mode ...
                            foreignTable.options.grids[gridIndex] = JSON.parse(JSON.stringify(liquid.tableJson.grids[gridIndex]));
                        }
                        retVal = foreignTable.options.grids[gridIndex];
                        foreignTable.options.grids[gridIndex].columns[itemIndex].name = new_grid_tem.name;
                        foreignTable.options.grids[gridIndex].columns[itemIndex].label = new_grid_tem.label;
                        Liquid.setAskForSave(targetLiquid, true);
                    } else {
                        console.error("ERROR: options property not defined");
                    }
                } else {
                    var msg = "unsupported condition : you should add manually the column in the foreign table definition of "+ic;
                    console.error("ERROR: "+msg);
                }
            } catch (e) {}
        }
        return retVal;
    },    
    buildCommandParams:function(liquid, command, obj) {
        if(liquid || command) {
            // command.name, command.params, command.server, command.client, command.isNative
            var controlIdList = command.params;
            var liquidProcessed = false;
            var liquidCommandParams = {
                liquid: ( liquid ? liquid : { xhr: null, controlId:null, command: command, outDivObj:obj } ),
                obj: obj,
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
                                if(paramObj.nodeName.toUpperCase() === 'FORM' || paramObj.nodeName.toUpperCase() === 'DIV' || paramObj.nodeName.toUpperCase() === 'INPUT') {
                                    var frm_elements = [];
                                    if(paramObj.nodeName.toUpperCase() === 'FORM') {
                                        frm_elements = paramObj.elements;
                                    } else if(paramObj.nodeName.toUpperCase() === 'DIV') {
                                        frm_elements = [ paramObj ];
                                    } else if(paramObj.nodeName.toUpperCase() === 'INPUT') {
                                        frm_elements = [ paramObj ];
                                    }                                    
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
                                    jQ1124(document).on('submit', '#'+paramObj.id, function() { // avoid page reload
                                        return false;
                                    });                            
                                    if(paramObj.nodeName.toUpperCase() === 'FORM') {
                                        // form collection
                                        liquidCommandParams.params.push(JSON.parse("{\"form\":\"" + (paramObj.id ? paramObj.id : paramObj.name) + "\"" +",\"data\":{" + dataList + "}" + "}"));
                                    } else {
                                        // single item
                                        liquidCommandParams.params.push(JSON.parse("{\"name\":\"" + (paramObj.id ? paramObj.id : paramObj.name) + "\"" +",\"data\":\"" + field_value + "\"" + "}"));
                                    }
                                } else {                                    
                                }
                            }
                        }
                    }
                }
            }
            if(liquid) {
                var isFormX = Liquid.isFormX(liquid);
                if(isFormX) {                    
                    // var formX = isFormX ? Liquid.getAddingRowAsString(liquid, liquid.addingRow) : "";
                    var formXObj = isFormX ? Liquid.getNamedRowData(liquid, liquid.addingRow) : "";                    
                    var formX = JSON.stringify(formXObj);
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
    buildQueryParam:function(liquid, queryParams) {
        if(isDef(queryParams)) {
            var status = 'ready';
            var pendingControlIds = [];
            for(var i=0; i<queryParams.length; i++) {
                var name = queryParams[i].name;
                var result = Liquid.solveExpressionFieldOnRow(name, null, liquid, liquid.cRow);
                if(result[0] === 'ready') {
                    queryParams[i].value = result[1];
                    queryParams[i].types = result[3];
                } else if(result[0] === 'pending') {
                    status = 'pending';
                    queryParams[i].value = result[1];
                    queryParams[i].types = result[3];
                    pendingControlIds.push( result[2] );
                }
            }
            return { queryParams:queryParams, status:status, pendingControlIds:pendingControlIds };
        }
        return { queryParams:null, status:"ready" };
    },
    checkColumns:function(liquid, tableJson) {
        if(isDef(tableJson.columns)) {
            for(var i=0; i<tableJson.columns.length; i++) {
                for(var j=i+1; j<tableJson.columns.length; j++) {
                    var duplicateFound = false;
                    if(tableJson.columns[i].name.toLowerCase() === tableJson.columns[j].name.toLowerCase()) {
                        if(isDef(tableJson.columns[i].label) && isDef(tableJson.columns[j].label)) {
                            if(tableJson.columns[i].label.toLowerCase() === tableJson.columns[j].label.toLowerCase()) {
                                duplicateFound = true;
                            }
                        } else {
                            duplicateFound = true;
                        }
                    }
                    if(duplicateFound) {
                        var msg = "duplicate column "+tableJson.columns[j].name+" (label:"+tableJson.columns[j].label+") on control : "+liquid.controlId;
                        alert("ERROR Detected :\n\n"+msg);
                        console.error("ERROR : "+msg);
                        return false;
                    }
                }
            }            
        }
    },
    solveExpressionField:function(obj, propName, liquid) {
        return Liquid.solveExpressionFieldOnRow(obj, propName, liquid, null);
    },
    solveExpressionFieldOnRow: function (obj, propName, liquid, iRow) {
        var pendingControlId = null;
        var status = "ready";
        var types = [];
        var retVal = [ status, null, pendingControlId, types ];
        var currentRow = iRow;
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
                            retVal = Liquid.getObjectProperty(targetObj, obj[propName].substring(1 + nameItems[0].length + 1));
                            if(!isDef(retVal)) { // in the name of flexibility :
                                // extracting property "table" of @contol.table fail because .table il already explicitated in source expression
                                retVal = targetObj;
                                obj[propName] = targetObj;
                                types.push("liquid");
                            }
                        }
                    }
                }
            } else if(typeof obj === 'string') {
                // replace values by search in dataset or in globar var
                retVal = "";
                for (var ic = 0; ic < obj.length; ic++) {
                    var s = ic;
                    var e = ic;
                    if(obj[ic] === '@' || obj[ic] === '$') {
                        ic++;
                        if(obj[ic] === '{') {
                            // in dataset
                            s = ic + 1;
                            while (obj[ic] !== '}' && ic < obj.length)
                                ic++;
                            e = ic;
                            var searchingProp = obj.substring(s, e);
                            if(searchingProp) {
                                var typeVar = "liquid.field";
                                var keyItems = searchingProp.split(",");
                                if(keyItems.length > 1) {
                                    searchingProp = keyItems[0];
                                    typeVar = keyItems[1];
                                }
                                var nameItems = searchingProp.split(".");
                                var searchingLiquid = liquid;
                                if(nameItems.length > 1) {
                                    if(nameItems[0] !== 'this') searchingLiquid = Liquid.getLiquid(nameItems[0]);
                                    searchingProp = nameItems[1];
                                    // ahaaa ... currentRow is relative to searchingLiquid
                                    currentRow = searchingLiquid.cRow;                                    
                                }
                                var value = "";
                                var col = Liquid.getColumn(searchingLiquid, searchingProp);
                                if(col) {
                                    var isFormX = Liquid.isFormX(searchingLiquid);
                                    var nodes = null;
                                    if(isDef(searchingLiquid.gridOptions)) {
                                        if(isDef(searchingLiquid.gridOptions.api)) {
                                            if(searchingLiquid.absoluteLoadCounter > 0) {
                                                nodes = searchingLiquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                            }
                                        }
                                    }
                                    if(!nodes) {
                                        status = "pending";
                                        pendingControlId = searchingLiquid.controlId;
                                    }
                                    
                                    types.push(typeVar);
                                    if(nodes && iRow !== null && typeof iRow !== 'undefined') {
                                        value = nodes[currentRow].data[col.field];                                        
                                    } else {
                                        if(isFormX) {
                                            if(searchingLiquid.addingRow) {
                                                value = searchingLiquid.addingRow[col.field];
                                            }
                                        }
                                    }
                                } else {
                                    if(isDef(searchingLiquid.tableJson[searchingProp])) {
                                        value = searchingLiquid.tableJson[searchingProp];
                                        types.push(typeVar);
                                    }
                                }
                                retVal += value ? value : "";
                            }
                        } else {
                            // in global var
                            var targetObj = Liquid.getObjectByName(liquid, obj.substring(ic));
                            if(targetObj) {
                                retVal += Liquid.getObjectProperty(targetObj, obj.substring(ic));
                                types.push("globalVar");
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
        return [ status, retVal, pendingControlId, types ];
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
        for(var i=1; i<nameItems.length; i++) {
            targetObj = isDef(targetObj[nameItems[i]]) ? targetObj[nameItems[i]] : targetObj;
            if(typeof targetObj === 'string') {
                if(targetObj.trim().startsWith("{")) {
                    try {
                        targetObj = JSON.parse(targetObj);
                    } catch (e) { console.error(e); }
                }
            }
        }
        return targetObj;
    },
    setAddingField: function (liquid, name, value) {
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
    startFlashingFields:function() {
        if(!isDef(glFlashingTimer)) {
            glFlashingTimer = setInterval( function () { 
                for(var i=0; i<glLiquids.length; i++) {
                    if(isDef(glLiquids[i].flashingFields)) {
                        Liquid.processFlasingFields(glLiquids[i], false);
                    }
                }
            }, glFlashingTimerMsec);
        }
    },
    stopFlashingFields:function() {
        if(isDef(glFlashingTimer)) {
            glFlashingTimer = clearInterval( glFlashingTimer );
            glFlashingTimer = null;
            for(var i=0; i<glLiquids.length; i++) {
                if(isDef(glLiquids[i].flashingFields)) {
                    Liquid.processFlasingFields(glLiquids[i], true);
                }
            }
        }
    },
    processFlasingFields:function(liquid, reset) {
        if(liquid) {
            if(isDef(liquid.flashingFields)) {
                for(var i=0; i<liquid.flashingFields.length; i++) {
                    if(liquid.flashingFields[i]) {
                        Liquid.processFlasingField(liquid, liquid.flashingFields[i], reset);
                        if(reset || liquid.flashingFields[i].finish === true) {
                            delete liquid.flashingFields[i];
                            liquid.flashingFields[i] = null;
                        }
                    }
                }
                // cleaning
                var alive = false;
                for(var i=0; i<liquid.flashingFields.length; i++) {
                    if(liquid.flashingFields[i] != null) {
                        alive = true;
                        break;
                    }
                }
                if(!alive) {
                    delete liquid.flashingFields;
                    liquid.flashingFields = null;
                }
            }
        }       
    },
    processFlasingField:function(liquid, flashingField, reset) {
        if(liquid) {
            if(isDef(flashingField)) {
                if(!isDef(flashingField.steps)) flashingField.steps = 6;
                if(!isDef(flashingField.step)) {
                    flashingField.step = 0;
                    flashingField.seq = 0;
                    flashingField.c_time = 0;
                    flashingField.finish = false;
                } else {
                    if(!isDef(flashingField.id)) { // invalid
                        console.error("ERROR: flashing item id not found");
                        flashingField = null;
                        return;
                    }
                    if(!isDef(flashingField.color)) {
                        flashingField.color = [ 250, 0, 0 ];
                    }
                    if(!isDef(flashingField.fontSize)) {
                        flashingField.fontSize = 30;
                    }
                    if(!isDef(flashingField.curColor)) {
                        flashingField.curColor = flashingField.color;
                    }
                    if(!isDef(flashingField.curFontSize)) {
                        flashingField.curFontSize = flashingField.fontSize;
                    }
                    if(!isDef(flashingField.endColor)) {
                        flashingField.endColor = [ 20, 20, 20 ];
                    }
                    if(!isDef(flashingField.endFontSize)) {
                        flashingField.endFontSize = 12;
                    }
                    if(!isDef(flashingField.stepColor)) {
                        var steps = flashingField.steps;
                        flashingField.stepColor = [ (flashingField.endColor[0]-flashingField.color[0])/steps, (flashingField.endColor[1]-flashingField.color[1])/steps, (flashingField.endColor[2]-flashingField.color[2])/steps ];
                    }
                    if(!isDef(flashingField.stepFontSize)) {
                        var steps = flashingField.steps;
                        flashingField.stepFontSize = (flashingField.endFontSize - flashingField.fontSize)/steps;
                    }
                    if(!isDef(flashingField.obj)) {
                        flashingField.obj = document.getElementById(flashingField.id);
                        if(!flashingField.obj) {
                            console.error("ERROR: flashing item not found");
                            flashingField = null;
                            return;
                        }
                    }                            
                    if(reset === true) {
                        flashingField.obj.style.color = ""
                        flashingField.obj.style.fontSize = "";
                        return;
                    }                            
                    var setFormat = false;                            
                    if(flashingField.seq == 0) {
                        setFormat = true;
                        flashingField.seq = 1;
                    } else if(flashingField.seq == 1) {
                        flashingField.c_time += glFlashingTimerMsec;
                        if(flashingField.c_time >= flashingField.wait_msecs)
                            flashingField.seq = 2;
                    } else if(flashingField.seq == 2) {
                        setFormat = true;
                        if(flashingField.step >= flashingField.steps) { // ended
                            flashingField.obj.style.color = ""
                            flashingField.obj.style.fontSize = "";
                            flashingField.finish = true;
                        } else {
                            flashingField.step++;
                            flashingField.curColor[0] += flashingField.stepColor[0];
                            flashingField.curColor[1] += flashingField.stepColor[1];
                            flashingField.curColor[2] += flashingField.stepColor[2];
                            flashingField.curFontSize += flashingField.stepFontSize;
                            setFormat = true;
                        }
                    }
                    if(setFormat) {
                        if(flashingField.obj) {
                            flashingField.obj.style.color = "rgb("+flashingField.curColor[0]+","+flashingField.curColor[1]+","+flashingField.curColor[2]+")";
                            flashingField.obj.style.fontSize = flashingField.curFontSize + "px";
                            if(isDef(flashingField.value)) {                                        
                                Liquid.setHTMLElementValue(flashingField.obj, flashingField.value);
                                delete flashingField.value;
                            }
                        }
                    }
                }
            }
        }       
    },
    addFlashingField:function(liquid, col, currentRow, newRow ) {
        var retVal = false;
        if(liquid) {
            if(currentRow && newRow) {
                if(currentRow[col.field] !== newRow[col.field]) {
                    retVal = true;
                    if(liquid.lastGridTabObj) {
                        var grid_coords = Liquid.getGridCoords(liquid, liquid.lastGridTabObj.id);
                        if(grid_coords) {
                            if(isDef(grid_coords.grid)) {
                                var cellIndex1B = Liquid.searchGridCell( liquid, liquid.tableJson.grids[grid_coords.gridIndex], col.name );
                                if(cellIndex1B) {
                                    var gridCell = liquid.tableJson.grids[grid_coords.gridIndex].columns[cellIndex1B-1];
                                    if(gridCell) {
                                        if(gridCell.field === col.field) {
                                            var obj = Liquid.getItemObj(gridCell);
                                            flashingField = { id: obj.id, color:[255, 0, 0], fontSize:20, steps:8, value:newRow[col.field], wait_msecs:Liquid.flashingPersistTimeMsec };
                                            if(!isDef(liquid.flashingFields)) liquid.flashingFields = [];
                                            liquid.flashingFields.push(flashingField);
                                            Liquid.startFlashingFields();
                                        }
                                    }
                                }
                            } else if(isDef(grid_coords.layout)) {
                                var lay_coords = Liquid.getLayoutCoords(liquid, liquid.lastGridTabObj.id);
                                if(isDef(lay_coords)) {
                                    // TODO : higllight all layout field linked to col.name
                                }
                            }
                        }
                    }
                }
            }
        }
        return retVal;
    },
    applyPendingFieldsChange:function(liquid, node) {
        if(liquid) {
            if(node) {
                if(isDef(liquid.modifications)) {
                    var newNode = { data:deepClone(node.data), id:node.id, selectable: node.selectable, selected:node.selected, uiLevel:node.uiLevel, __objectId:node.__objectId };
                    for(var im = 0; im < liquid.modifications.length; im++) {
                        var modification = liquid.modifications[im];
                        if(modification) {
                            if(modification.nodeId === node.id) {
                                if(modification.fields) {
                                    for(var iF = 0; iF < modification.fields.length; iF++) {
                                        var mField = modification.fields[iF];
                                        if(mField.field) {
                                            newNode.data[mField.field] = mField.value;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return newNode;
                }
            }
        }
        return node;
    },
    registerFieldChange:function(liquid, nodeId, rowId, field, oldValue, newValue) {
        if(liquid) {
            var isFormX = Liquid.isFormX(liquid);
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
                    if(rowId !== null && rowId !== '' && nodeId != null && nodeId !='') { // Verify primary key exist
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
                    /*
                    for(var r = 0; r < liquid.modifications.length; r++) {
                        for(var c = 0; c < liquid.modifications[r].fields.length; c++) {
                            console.warn(liquid.tableJson.table + " rowId:" + liquid.modifications[r].rowId + " field:" + liquid.modifications[r].fields[c].field + " value:" + liquid.modifications[r].fields[c].value);
                        }
                    }
                    */
                }
                if(rowId === '' || rowId === null || isFormX) {
                    // N.B.: formX work always on addingRow/addingNode
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
                // fire event
                var col = Liquid.getColumnByField(liquid, field);
                if(col) {
                    if(isDef(col.onCellChanged)) {
                        var eventData = { column_name:col.name, value:newValue };
                        var event = { name:"onCellChanged", client:col.onCellChanged.client, server:col.onCellChanged.server };
                        eventParams = Liquid.buildCommandParams(liquid, event, null);
                        Liquid.onEventProcess(liquid, event, null, "onCellChanged", eventParams.params, eventData, null, null, null);
                        Liquid.addMirrorEvent(liquid, { id:nodeId } );
                    }
                }
            }
        }
    },   
    resetMofifications:function(liquid) {
        if(isDef(liquid.modifications)) {
            if(liquid.modifications.length>1) console.warn("WARNING: dischanging "+liquid.modifications.length+" modifications...");
            delete liquid.modifications;
            liquid.modifications = null;
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
    processXHRMessagesFromServer:function( liquid, obj, commandOrEvent, showErrors, showWarnings, showMessages ) {
        if(isDef(obj.error)) {
            var err = "";
            try { err = atob(obj.error); } catch(e) { err = obj.error; }
            console.error("[SERVER] ERROR:" + err + " on "+commandOrEvent.name+" on control "+liquid.controlId);
            if(showErrors) Liquid.setErrorDiv(liquid, obj.error);
            if(isDef(obj.query)) {
                console.error("[SERVER] QUERY:\n\n" + atob(obj.query));
            }
        }
        if(isDef(obj.warning)) {
            var wrn = "";
            try { wrn = atob(obj.warning); } catch(e) { wrn = obj.warning; }
            console.warn("[SERVER] WARNING:" + wrn + " on "+commandOrEvent.name+" on control "+liquid.controlId);
            if(showWarnings) Liquid.setErrorDiv(liquid, obj.warning);
        }
        if(isDef(obj.message)) {
            var msg = "";
            try { msg = atob(obj.message); } catch(e) { msg = obj.message; }
            console.log("[SERVER] MESSAGE:" + msg + " on "+commandOrEvent.name+" on control "+liquid.controlId);
            if(showMessages) Liquid.setErrorDiv(liquid, obj.message);
        }
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
                            // jQ1124("#divLinearLoaderContent").css("width", perc+"%");
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
            if(event) {
                if(event.lengthComputable && event.total) {
                var percentage = Math.round((event.loaded * 100) / event.total);
                    outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent)+" download in progress (" + percentage + "%)";
                } else {
                    outDiv.innerHTML = runningImg+"[ "+liquid.controlId+" ] " + handlerName + " " + Liquid.getCommandOrEventName(commandOrEvent)+" downloading...";
                }
            }
        }
        if(isDef(liquid.stackDownloading)) {
            if(liquid.stackDownloading.lastResponseLen === liquid.lastResponseLen && liquid.stackDownloading.responseLen === event.currentTarget.response.length) {
                // duplicate callback
                return;
            }
        }
        liquid.stackDownloading = { 
            lastResponseLen:liquid.lastResponseLen
            , responseLen:event ? event.currentTarget.response.length : 0
            , loaded:event ? event.loaded : true, total:event ? event.total : 0
            , timeStamp:event ? event.timeStamp : 0
            , eventPhase:event ? event.eventPhase : 0
        };
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
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command, null);
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
                        fullData[liquid.tableJson.columns[ic].name] = data[(ic+1).toString()];
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
    getFullSelectedRecordsData:function(liquid, purge) {
        if(liquid) {
            var selNodes = liquid.gridOptions.api.getSelectedNodes();
            var transacted = true;
            if(isDef(selNodes) && selNodes.length) {
                var rowsData = [];                
                for(var i=0; i<selNodes.length; i++) {
                    // var curNode = isDef(transacted) ? Liquid.applyPendingFieldsChange( liquid, selNodes[i] ) : selNodes[i];
                    var curNode = selNodes[i];
                    rowsData.push( Liquid.getFullRecordData(liquid, curNode, true) );
                }
                return rowsData;
            } else {
                console.warn("WARNING: on control '"+liquid.controlId+"' current row is not defined");
            }
        }
        return null;
    },
    getFullRecordData:function(liquid, node, purge) {
        if(liquid) {
            if(node) {
                var result = {};
                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                    if(!purge) result[liquid.tableJson.columns[ic].field] = node.data[liquid.tableJson.columns[ic].field];
                    result[liquid.tableJson.columns[ic].name] = node.data[liquid.tableJson.columns[ic].field];
                }
                return result;
            }
        }
        return null;
    },
    getRecordsKey:function(liquid, node) {
        if(liquid) {
            if(node) {
                var result = {};
                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                    result[liquid.tableJson.columns[ic].primaryKey] = node.data[liquid.tableJson.columns[ic].primaryKeyField];
                }
                return result;
            }
        }
        return null;
    },
    getRecordsField:function(liquid, nodes, fields, colSep, rowSep) {
        if(liquid) {
            if(nodes) {
                var result = "";
                for(var ir=0; ir<nodes.length; ir++) {
                    if(Array.isArray(fields)) {
                        var fieldsValue = "";
                        for(var ic=0; ic<fields.length; ic++) {
                            var col = Liquid.getColumn(liquid, fields[ic]);
                            if(col) {
                                if(isDef(col.field)) {
                                    fieldsValue += (fieldsValue.length>0?(colSep?colSep:"."):"") + nodes[ir].data[col.field];
                                }
                            }
                        }
                    } else {
                        var col = Liquid.getColumn(liquid, fields);
                        if(col) {
                            if(isDef(col.field)) {
                                fieldsValue = nodes[ir].data[col.field];
                            }
                        }
                    }
                    result += (ir>0?(rowSep?rowSep:" - "):"") + fieldsValue;
                }
                return "<div class=\"liquidBadge\">"+nodes.length+"</div> "+result;
            }
        }
        return "";
    },
    setControlAsCombo( obj, bClosed ) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(!liquid.pendingLoad) {
                Liquid.setComboTitle( obj );
            }
            if(bClosed) {
                liquid.comboModeObj.style.display = "";
                liquid.comboModeOpenIcon.style.display = "";
                liquid.comboModeCloseIcon.style.display = "none";
            } else {
                liquid.comboModeObj.style.display = "";
                liquid.comboModeText.innerHTML = "";
                liquid.comboModeOpenIcon.style.display = "none";
                liquid.comboModeCloseIcon.style.display = "";
            }
            
            if(bClosed) {
                var height = 30;
                if(!isDef(liquid.tableJson.combo)) {
                    liquid.tableJson.combo = {};
                }
                if(isDef(liquid.tableJson.combo.height)) {
                    height = liquid.tableJson.combo.height;
                }
                liquid.comboModeObj.style.height = height+"px";

                // .visibility = "hidden";
                liquid.comboModeObj.classList.add("liquidComboClosed");
                liquid.comboModeObj.classList.remove("liquidComboOpened");

                liquid.tableJson.combo.prevHeight = liquid.outDivObj.style.height;
                liquid.tableJson.combo.prevOverflow = liquid.outDivObj.style.overflow;

                liquid.outDivObj.style.overflow = "hidden";

                jQ1124( liquid.outDivObj ).animate( { 
                    height: height+"px"
                }, 200, function(){ 
                    liquid.tableJson.combo.open = false;
                } );

            } else {
                liquid.comboModeObj.classList.add("liquidComboOpened");
                liquid.comboModeObj.classList.remove("liquidComboClosed");
                liquid.comboModeObj.style.height = height+"px";
                liquid.outDivObj.style.overflow = liquid.tableJson.combo.prevOverflow;
                jQ1124( liquid.outDivObj ).animate( { 
                    height: liquid.tableJson.combo.prevHeight
                }, 500, function(){ 
                    Liquid.onResize(liquid);
                    liquid.tableJson.combo.open = true;
                } );
            }
        }
    },
    switchCombo:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            Liquid.setControlAsCombo(liquid, liquid.tableJson.combo.open); 
        }
    },
    setComboTitle:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var names = liquid.tableJson.columns ? [ liquid.tableJson.columns[0].name ] : null;
            if(isDef(liquid.tableJson.primaryKeyField)) names = [ liquid.tableJson.primaryKey ];
            if(isDef(liquid.tableJson.combo)) if(isDef(liquid.tableJson.combo.field)) {
                if(Array.isArray(liquid.tableJson.combo.field)) {
                    names = liquid.tableJson.combo.field;
                } else {
                    names = [ liquid.tableJson.combo.field ];
                }
            }
            var values = Liquid.getRecordsField(liquid, liquid.gridOptions.api.rowModel.rootNode.allLeafChildren, names, liquid.tableJson.combo.fieldSep, liquid.tableJson.rowSep);
            liquid.comboModeText.innerHTML = values;
        }
    },
    initializeLiquid:function(liquid) {
        
        Liquid.checkColumns(liquid, liquid.tableJson);
        
        // solving external link ( "table":"@control.property" )
        Liquid.solveExpressionField(liquid.tableJson, "schema", liquid);
        Liquid.solveExpressionField(liquid.tableJson, "table", liquid);
        
        if(isDef(liquid.tableJson.rowSelection)) {
            if(liquid.tableJson.rowSelection.toLowerCase() === "multiple") {
                liquid.tableJson.checkboxSelection = true;
            }
            
            
            if(!isDef(liquid.tableJson.columns)) {
                liquid.tableJson.columns = [];
            }

            /* Keep field column map 1:1
            var loop = 0;
            while(loop<liquid.tableJson.columns.length) {
                if(liquid.tableJson.columns[0].visible === false) {
                    liquid.tableJson.columns[liquid.tableJson.columns.length] = liquid.tableJson.columns[0];
                    liquid.tableJson.columns.splice(0, 1);
                } else {
                    break;
                }
                loop++;
            }
            */
        }

        if(!isDef(liquid.tableJson.primaryKeyField)) {
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
        if(isDef(liquid.tableJson.columns)) {
            if(isDef(liquid.tableJson)) {
                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                    
                    if(liquid.tableJson.columns[ic].name.toUpperCase() === 'DEFAULT') {
                        var err = "LIQUID: Please avod to user default as field in control:"+liquid.controlId;
                        alert(err);
                        console.error(err);
                    }
                    
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
                            
                            var values = null;
                            if(isDef(liquid.tableJson.columns[ic].editorValues))
                                values = liquid.tableJson.columns[ic].editorValues;
                            if(isDef(liquid.tableJson.columns[ic].editor.values))
                                values = liquid.tableJson.columns[ic].editor.values;

                            var codes = null;
                            if(isDef(liquid.tableJson.columns[ic].editorCodes))
                                codes = liquid.tableJson.columns[ic].editorCodes;
                            if(isDef(liquid.tableJson.columns[ic].editor.codes))
                                codes = liquid.tableJson.columns[ic].editor.codes;
                                
                            if(liquid.tableJson.columns[ic].editor === 'values' || liquid.tableJson.columns[ic].editor === 'list')
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
                                    ,codes: codes
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
                    editable = (editable && ( (liquid.tableJson.editable === true ? true : false) || (liquid.tableJson.editable === 'true' ? true : false) )) ? true : false;
                    editable = (editable && ( isDef(liquid.tableJson.columns[ic].lookup) ? false : true )); // N.B.: lookup cannot be changed directly referenced id will be wrong
                    var col = liquid.tableJson.columns[ic];
                    var sortComparator = null;
                    var typeColumn = null;                    
                    if(!editable) {
                        if(Liquid.debug) {
                            console.warn("LIQUID: "+liquid.controlId+"."+liquid.tableJson.columns[ic].name+" is not editable");
                        }
                    }                    
                    if(Liquid.isFloat(col.type)) {
                        sortComparator = function(a, b) { a=a.replace(",","."); b=b.replace(",","."); return (Number(a) > Number(b) ? 1 : (Number(a) < Number(b) ? -1 : 0)); };
                        typeColumn = "numericColumn";
                    } else if(Liquid.isNumeric(col.type)) {
                        sortComparator = function(a, b) { return (Number(a) > Number(b) ? 1 : (Number(a) < Number(b) ? -1 : 0)); };
                        typeColumn = "numericColumn";
                    } else if(Liquid.isDate(col.type)) {
                        sortComparator = function(a, b) { 
                            var dateA = Liquid.toDate(a); 
                            var dateB = Liquid.toDate(b); 
                            return (dateA > dateB ? 1 : (dateA < dateB ? -1 : 0)); 
                        };
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
                        ,headerCheckboxSelection: (ic === 0 ? isDef(liquid.tableJson.rowSelection) && liquid.tableJson.rowSelection === "multiple" ? (isDef(liquid.tableJson.headerCheckboxSelection) ? liquid.tableJson.headerCheckboxSelection : true) : (isDef(liquid.tableJson.headerCheckboxSelection) ? liquid.tableJson.headerCheckboxSelection : false) : false)
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
            }
        }
    },
    /**
     * Show or hide the waiter on the foreign tables tabs
     * @param liquid the calling control
     * @param bShow show(true) or hide(true)
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
    downloadProgress:function(event, liquid) {
        // console.log("WARNING: controlId:"+liquid.controlId+" progress..."+event);
    },    
    transferComplete:function(event, liquid) {
        // console.log("WARNING: controlId:"+liquid.controlId+" completed..."+event);
        if(isDef(liquid.onTransferCompleted)) {
            try {
                liquid.onTransferCompleted(liquid);
            } catch(e) {}
            liquid.onTransferCompleted = null;
        }
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
    
    //
    // Server Register Conponent callback
    //
    onProcessServerResult:function(liquid, xhr) {
        if(xhr.status === 200) {
            try {
                if(xhr.responseText) {
                    var resultTableJson = JSON.parse(JSON.stringify(liquid.tableJson));
                    var registeredTableJson = JSON.parse(xhr.responseText);
                    if(registeredTableJson.error) {
                        Liquid.handleResponse(liquid, "Registering component", registeredTableJson, true, true, true, true);
                    } else {
                        resultTableJson.mode = liquid.tableJson.mode !== 'auto' && liquid.tableJson.mode !== 'Sync' ? liquid.tableJson.mode : "";
                        resultTableJson.database = registeredTableJson.database;
                        resultTableJson.schema = registeredTableJson.schema;
                        resultTableJson.columns = registeredTableJson.columns;
                        resultTableJson.primaryKeyField = registeredTableJson.primaryKeyField;
                        resultTableJson.primaryKey = registeredTableJson.primaryKey;
                        resultTableJson.columnsResolved = registeredTableJson.columnsResolved;
                        resultTableJson.columnsResolvedBy = registeredTableJson.columnsResolvedBy;
                        if(typeof registeredTableJson.grids !== 'undefined') resultTableJson.grids = registeredTableJson.grids;
                        if(typeof registeredTableJson.events !== 'undefined') resultTableJson.events = registeredTableJson.events;
                        if(typeof registeredTableJson.commands !== 'undefined') resultTableJson.commands = registeredTableJson.commands;
                        resultTableJson.tableJsonVariableName = liquid.tableJsonVariableName;
                        resultTableJson.columnsResolved = true;
                        resultTableJson.token = isDef(registeredTableJson.token) ? registeredTableJson.token : liquid.tableJson.token;
                        resultTableJson.queryParams = isDef(registeredTableJson.queryParams) ? registeredTableJson.queryParams : liquid.tableJson.queryParams;
                        if(liquid.tableJson.mode === 'auto') {
                            resultTableJson.autoSizeColumns = false;
                            resultTableJson.autoFitColumns = true;
                            resultTableJson.autoSelect = true;
                        }
                        // Adding additional columns
                        if(isDef(registeredTableJson.additionalColumns)) {
                            for(var iac=0; iac<registeredTableJson.additionalColumns; iac) {
                                resultTableJson.columns.push( registeredTableJson.additionalColumns[iac] );
                            }
                        }
                        if(liquid.mode === 'winX' || liquid.mode === 'WinX') {
                            liquid.tableJson.mode = liquid.mode;
                            if(liquid.tableJson.resize !== false)
                                resultTableJson.resize = 'both';
                        }
                        return new LiquidCtrl(  liquid.controlId, liquid.outDivObjOrId, JSON.stringify(resultTableJson)
                                                ,liquid.sourceData
                                                ,liquid.tableJson.mode, liquid.parentObjId);
                    }
                    if(registeredTableJson.warning)
                        console.warn(registeredTableJson.warning);
                } else {
                    console.error(xhr.responseText);
                    console.error("ERROR: controlId:"+liquid.controlId+" mode:"+this.tableJson.mode+", ibvalid respons...check server log");
                }
            } catch (e) {
                console.error(xhr.responseText);
                console.error("ERROR: controlId:"+liquid.controlId+" mode:"+(typeof liquid.tableJson !== 'undefined' ? liquid.tableJson.mode : "unknown")+", error in response process:" + e);
            }
        } else {
            console.error("ERROR: controlId:"+liquid.controlId+" mode :"+(typeof this.tableJson !== 'undefined' ? this.tableJson.mode : "unknown")+", wrong response:" + xhr.status);
        }
    },

    //
    // loadData callback
    //
    onLoadDataOnReadyStateChange:function(liquid, xhr) {
        if(xhr.readyState === 4) { // loadData callback
            Liquid.release_xhr(liquid);
            liquid.gridOptions.api.hideOverlay();
            if(xhr.status === 200) {
                var result = { retVal:0, selectionChanged:false };
                var bFoundSelection = false;
                var bFirstTimeLoad = false;
                var disableLinkedControlRefresh = false;
                try {
                    // \b \f \n \r \t
                    var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                    responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);


                    // Initially selected by server
                    if(liquid.absoluteLoadCounter === 0) {
                        bFirstTimeLoad = true;
                    }

                    liquid.loadCounter++;
                    liquid.absoluteLoadCounter++;

                    if(responseText) {
                        var httpResultJson = JSON.parse(responseText);
                        if(!xhr.params.ids) { // set data as partial
                            liquid.nRows = httpResultJson.nRows;
                        }

                        // columns redifined by server
                        if(isDef(httpResultJson.columns)) {
                            if(Liquid.compareColumns(liquid, httpResultJson.columns)) {
                                Liquid.updateColumns(liquid, httpResultJson.columns, true, true);
                            }
                        }

                        // any changes
                        var anyFieldsChange = false;

                        // current selection
                        var selNodes = liquid.gridOptions.api.getSelectedNodes();

                        if(xhr.params.ids) { // set data as partial
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
                                                if(Liquid.addFlashingField(liquid, col, data, httpResultJson.resultSet[ir])) {
                                                    anyFieldsChange = true;
                                                }
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

                        if(liquid.nRows <= 0) {
                            // server didn't compute ?
                            var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                            if(nodes) {
                                liquid.nRows = nodes.length;
                            }
                        }
                        liquid.nPages = liquid.gridOptions.paginationPageSize > 0 ? Number(Math.ceil(liquid.nRows / liquid.gridOptions.paginationPageSize)) : 1;


                        // Initially selected ...
                        if(bFirstTimeLoad) {
                            if(liquid.tableJson.checkboxSelection) {
                                try {
                                    liquid.gridOptions.onGetSelection();
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            selNodes = liquid.gridOptions.api.getSelectedNodes();
                            if(!selNodes || selNodes.length === 0) {                                                
                                if(isDef(liquid.tableJson.autoSelect) || isDef(liquid.tableJson.tempAutoSelect)) {
                                    if(Liquid.setNodesSelectedDefault(liquid)) { // no other refresh actions needed
                                        disableLinkedControlRefresh = true;
                                    }
                                    if(isDef(liquid.tableJson.tempAutoSelect)) delete liquid.tableJson.tempAutoSelect;
                                }
                            }
                        }

                        // restore previous selection
                        bFoundSelection = Liquid.setSelctions(liquid, selNodes);
                        if((!bFoundSelection && selNodes && selNodes.length > 0) || (anyFieldsChange) ) {
                            var refreshReason = "";
                            if(!bFoundSelection && selNodes && selNodes.length > 0) {
                                reason = "unselect";
                            } else if(anyFieldsChange) {
                                reason = "reload";
                            }
                            result.selectionChanged = true;
                            if(!disableLinkedControlRefresh) {
                                Liquid.refreshGrids(liquid, null, refreshReason);
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
                        if(xhr.params.sFiltersJson && liquid.absoluteLoadCounter > 0 && liquid.ids)
                            Liquid.setNodesSelected(liquid, liquid.ids);

                        if(httpResultJson.debug) {
                            try {
                                console.debug("[SERVER] QUERY:" + atob(httpResultJson.query));
                                console.debug("[SERVER] QUERY-TIME:" + httpResultJson.queryTime);
                                console.debug("[SERVER] TOTAL-TIME:" + httpResultJson.totalTime);
                            } catch(e) { debugger; }
                        }
                        if(httpResultJson.error) {
                            try { console.error("[SERVER] ERROR:" + atob(httpResultJson.error) + " on loadData() on control "+liquid.controlId); } catch(e) { debugger; }
                            Liquid.setErrorDiv(liquid, httpResultJson.error);
                        } else {
                            Liquid.setErrorDiv(liquid, "");
                        }
                        if(httpResultJson.warning) {
                            try { console.warn("[SERVER] WARNING:" + atob(httpResultJson.warning));  } catch(e) { debugger; }
                        }
                        if(httpResultJson.message) {
                            try {
                                var msg = atob(httpResultJson.message);
                                var title = (typeof httpResultJson.title !== 'undefined' && httpResultJson.title ? atob(httpResultJson.title) : (Liquid.lang === 'eng' ? "SERVER MESSAGE" : "MESSAGGIO DAL SERVER" ));
                                console.info("[SERVER] MESSAGE:" + msg);
                                Liquid.dialogBox(null, title, msg, { text:"OK", func:function() { } }, null);
                            } catch(e) { debugger; }
                        } else {
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

                if(isDef(liquid.pendingControlIds)) {
                    for(var il=0; il<liquid.pendingControlIds.length; il++) {
                        if(liquid.pendingControlIds[il]) {
                            Liquid.loadData(liquid.pendingControlIds[il], null);
                            // Liquid.onResize(liquid.pendingControlIds[il]);
                            // Liquid.setAutoresizeColumn(liquid, false);
                            liquid.pendingControlIds[il] = null;
                        }
                    }
                }

                if(liquid.mode === "combo") {
                    Liquid.setComboTitle( liquid );
                }

                if(liquid.nRows === 0) {
                    // no row select main no refresh, but layout footer/header need to be created
                    Liquid.refreshPendingLayouts(liquid, true);
                }

            } else {
                console.error("loadData() . wrong response:" + xhr.status);
            }
        }
    },    
    loadData:function(liquid, ids, reason) {
        var sFiltersJson = "";
        var allFilterJson = [];
        var doFilter = true;

        // if(liquid.controlId === "formats$study_id$id@Quotes_Suggested preforms_suggested_preforms") debugger;
        // if(liquid.controlId === "materials$id$materialid@quotes_detail$quoteid$Id@testGrid4") debugger;
        
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
                    Liquid.refreshGrids(liquid, null, "unselect");
                Liquid.refreshLayouts(liquid, false);
                Liquid.refreshDocuments(liquid, false);
                Liquid.refreshCharts(liquid, false);
                if(liquid.linkedLiquids)
                    Liquid.refreshLinkedLiquids(liquid);
                }
                return;
            }
        }        
        if(isDef(liquid.filtersJson)) { // user filter
            if(liquid.curFilter<liquid.filtersJson.length) {
                if(liquid.curFilter < 0) liquid.curFilter = 0;
                if(isDef(liquid.filtersJson[liquid.curFilter].columns)) {
                    allFilterJson = allFilterJson.concat(liquid.filtersJson[liquid.curFilter].columns);
                    allFilterJson.curFilter = liquid.curFilter;
                }
            }
        }
        if(isDef(liquid.runtimeFiltersJson)) { // runtime filter : internal use
            if(isDef(liquid.runtimeFiltersJson.columns)) {
                allFilterJson = allFilterJson.concat(liquid.runtimeFiltersJson.columns);
                delete liquid.runtimeFiltersJson;
                liquid.runtimeFiltersJson = null;
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
                    liquid.srcLiquid.onLoaded.push ( function() { Liquid.loadData(liquid.srcLiquid.controlId, ids, "srcLiquid start"); } );
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
                        var rebuildSrcColumnIndex = false;
                        if(!isDef(liquid.srcColumnIndex)) {
                            rebuildSrcColumnIndex = true;
                        } else {
                            if(Array.isArray(liquid.srcColumnIndex)) {
                                if(liquid.srcColumnIndex.length == 0) {
                                    rebuildSrcColumnIndex = true;
                                }
                            }
                        }
                        if(rebuildSrcColumnIndex) {
                            // solve source col (foreignTable, etc...)
                            Liquid.solveSourceColumn(liquid, (liquid,ids) => Liquid.loadData(liquid, ids, reason+".forward"), null);
                            if(!isDef(liquid.srcColumnIndex)) {
                                if(liquid.gridOptions.api)
                                    liquid.gridOptions.api.setRowData(null);
                                liquid.lastSelectedId = null;
                                console.warn("WARNING: on control "+liquid.controlId+" srcColumnIndex is stil undefined");
                                return;
                            }
                        }
                        var srcColumnIndexes = null;
                        var srcForeignColumns = null;
                        if(Array.isArray(liquid.srcColumnIndex)) {
                            srcColumnIndexes = liquid.srcColumnIndex;                                
                        } else {
                            srcColumnIndexes = [ liquid.srcColumnIndex ];
                        }
                        if(Array.isArray(liquid.srcForeignColumn)) {
                            srcForeignColumns = liquid.srcForeignColumn;                                
                        } else {
                            srcForeignColumns = [ liquid.srcForeignColumn ];
                        }
                        if(!isDef(srcColumnIndexes)) {
                            console.error("FATAL ERROR: loadData() on " + liquid.controlId + " srcColumnIndexes invalid");
                            return;
                        } else {
                            if(!srcColumnIndexes.length) {
                                console.error("FATAL ERROR: loadData() on " + liquid.controlId + " srcColumnIndexes empty");
                                return;
                            } else {
                                for(var node=0; node<selNodes.length; node++) {
                                    for(var ic=0; ic<srcColumnIndexes.length; ic++) {
                                        var srcForeignColumn = srcForeignColumns[ic];
                                        var srcColumnIndex = srcColumnIndexes[ic];
                                        var foreignFilter = { name: srcForeignColumn, value: selNodes[node].data[srcColumnIndex], logic: (ic!=0 ? "and":"or") };
                                        allFilterJson = allFilterJson.concat(foreignFilter);
                                    }
                                }
                            }
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
        //
        // if(isDef(liquid.tableJson.query)) debugger;
        //
        var queryParamsJson = null;
        if(isDef(liquid.tableJson.queryParams)) {
            liquid.tableJson.queryParamsJSON = Liquid.buildQueryParam(liquid, liquid.tableJson.queryParams);
            if(liquid.tableJson.queryParamsJSON.status === 'ready') {
                queryParamsJson = JSON.stringify(liquid.tableJson.queryParamsJSON.queryParams);
            } else if(liquid.tableJson.queryParamsJSON.status === 'pending') {
                console.warn("WARNING: control '"+liquid.controlId+"' still pending for load of '"+liquid.tableJson.queryParamsJSON.pendingControlIds+"'");
                liquid.status = "pending";
                if(isDef(liquid.tableJson.queryParamsJSON.pendingControlIds)) {
                    for(ip=0; ip<liquid.tableJson.queryParamsJSON.pendingControlIds.length; ip++) {
                        var driverLiquid = Liquid.getLiquid(liquid.tableJson.queryParamsJSON.pendingControlIds[ip]);
                        if(driverLiquid) {
                            if(!isDef(driverLiquid.pendingControlIds)) driverLiquid.pendingControlIds = [];
                            if(!driverLiquid.pendingControlIds.contains(liquid.controlId)) {
                                driverLiquid.pendingControlIds.push( liquid.controlId );
                            }
                        }
                    }
                }
                return;
            }
        }
        if(allFilterJson || ids) {
            sFiltersJson = "{";
            if(isDef(ids)) {
                sFiltersJson += ("\"ids\":[" + ids + "]");
            } else if(isDef(allFilterJson)) {
                sFiltersJson += "\"filtersJson\":" + (allFilterJson ? JSON.stringify(allFilterJson) : "{}");
            }
            sFiltersJson += (isDef(liquid.sortColumns) ? (",\"sortColumns\":[" + liquid.sortColumns.toString() + "]") : "");
            sFiltersJson += (isDef(liquid.sortColumnsMode) ? (",\"sortColumnsMode\":\"" + liquid.sortColumnsMode + "\"") : "");
            sFiltersJson += (isDef(liquid.curFilter) ? (",\"curFilter\":\"" + liquid.curFilter + "\"") : ",\"curFilter\":-1");
            sFiltersJson += (isDef(queryParamsJson) ? (",\"queryParams\":" + queryParamsJson) : "");
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

                    // Send the request
                    Liquid.sendRequest(
                          liquid
                        , { ids:ids, sFiltersJson:sFiltersJson }
                        , 'POST'
                        ,glLiquidServlet + '?operation=get&controlId='
                            + (typeof liquid.tableJson.registerControlId !== "undefined" ? liquid.tableJson.registerControlId : liquid.controlId)
                            + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : '')
                            + '&page=' + liquid.cPage
                            + "&pageSize=" + liquid.pageSize
                            + "&cacheIds=" + (typeof liquid.tableJson.cacheIds !== 'undefined' ? liquid.tableJson.cacheIds : "auto")
                            + "&targetDatabase=" + (typeof liquid.tableJson.database !== 'undefined' ? liquid.tableJson.database : "")
                            + "&targetSchema=" + (typeof liquid.tableJson.schema !== 'undefined' ? liquid.tableJson.schema : "")
                            + "&targetTable=" + (typeof liquid.tableJson.table !== 'undefined' ? liquid.tableJson.table : "")
                            + (!liquid.tableJson.columnsResolved ? '&columnsResolved=false' : '')
                        , liquid.tableJson.loadDataSync === true ? false : true
                        , sFiltersJson
                        , Liquid.onLoadDataOnReadyStateChange                        
                        , reason+".loading data "+liquid.controlId
                        , function(){ Liquid.updateProgress(event, liquid); }
                        , function(){ Liquid.downloadProgress(event, liquid); }
                        , function(){ Liquid.transferComplete(event, liquid); }
                        , function(){ Liquid.transferFailed(event, liquid); }
                        , function(){ Liquid.transferCanceled(event, liquid); }
                                );

                    liquid.gridOptions.api.showLoadingOverlay();
                    if(liquid.tableJson.loadDataSync === true) {
                        // liquid.xhr.send(sFiltersJson);
                        // onreadystatechange(liquid);
                        debugger;
                    } else {
                        // liquid.xhr.onreadystatechange = onreadystatechange;
                        // liquid.xhr.send(sFiltersJson);                        
                    }

                }
            } catch (e) { 
                console.error("ERROR: loadData() on control '"+liquid.controlId+"' : "+e); 
                if(Liquid.projectMode) 
                    debugger;
            }
        }
    },
    updateColumns:function(liquid, columns, bUpdate, bUIUpdate) {    
        if(isDef(liquid)) {
            if(isDef(liquid.tableJson)) {
                if(!isDef(liquid.tableJson.columns)) {
                    liquid.tableJson.columns = [];
                }
                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                    var column = liquid.tableJson.columns[ic];
                    var bFound = false;
                    for(var jc=0; jc<columns.length; jc++) {
                        if(columns[jc].name === column.name) {
                            columns[jc].rtFound = true;
                            if(isDef(columns[jc].field)) column.field = columns[jc].field; 
                            if(isDef(columns[jc].type)) column.type = columns[jc].type; 
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
                    liquid.gridOptions.api.setColumnDefs([]); // reset previsout definition
                    liquid.gridOptions.api.setColumnDefs(liquid.columnDefs);
                }
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
                            Liquid.loadData(glLiquidsPendingLoad[i].targetLiquid, glLiquidsPendingLoad[i].ids, "processPendingLoad");
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
    // Update current selection
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
            console.warn("WARNING : on control "+liquid.controlId+" waiting for request '"+description+"'..\n\n but still busy by operation '"+liquid.xhrDescription+"'");
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
            try {
                console.error("ERROR : on control "+liquid.controlId+" request still busy .. try with autoLoad=false in your json:"+(isDef(liquid.tableJson.sourceFileName) ? atob(liquid.tableJson.sourceFileName) : ""));
            } catch(e) { debugger; }
            return false;
        }
    },
    release_xhr:function(liquid) {
        if(liquid) {
            if(isDef(liquid.xhr)) {
                if(liquid.ws === true) {
                    // ws
                    } else {
                    // ajax
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
            LiquidEditing.onContextMenuClose();
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
    onLayoutShow:function(e) {
        if(e.target) {    
            var liquid = Liquid.getLiquid(liquid);
            if(liquid) {
                var lay_coord = Liquid.getLayoutCoords(liquid, e.target);
                if(lay_coord) {
                    if(lay_coord.layout) {
                        var layout = lay_coord.layout;
                        if(layout.pendingRefresh) {
                            layout.pendingRefresh = false;
                            Liquid.refreshLayout(liquid, layout, layout.pendingLink);
                        }
                    }
                }
            }
        }
    },
    onLayoutContainerScroll:function(e) {
        if(e.target) {
            var localLookupScrollLeft = e.target.getAttribute("scroll_left");
            var localLookupScrollTop = e.target.getAttribute("scroll_top");
            if(localLookupScrollLeft !== e.target.scrollLeft || localLookupScrollTop !== e.target.scrollTop) {
                var lookups = document.getElementsByClassName("liquidLookupOpen");
                if(lookups) {
                    var dX = localLookupScrollLeft - e.target.scrollLeft;
                    var dY = localLookupScrollTop - e.target.scrollTop;
                    for(var i=0; i<lookups.length; i++) {
                        lookups[i].style.top = (lookups[i].offsetTop + dY) + "px";
                        lookups[i].style.left = (lookups[i].offsetLeft + dX) + "px";
                    }
                }
                e.target.setAttribute("scroll_left", e.target.scrollLeft);
                e.target.setAttribute("scroll_top", e.target.scrollTop);
            }
        }
    },            
    onWindowScroll:function(e) {
        if(glLookupScrollLeft != document.body.scrollLeft || glLookupScrollTop != document.body.scrollTop) {
            var lookups = document.getElementsByClassName("liquidLookupOpen");
            if(lookups) {                
                for(var i=0; i<lookups.length; i++) {
                    Liquid.onBringLookup(lookups[i], true);
                }
            }
            glLookupScrollLeft = document.body.scrollLeft;
            glLookupScrollTop = document.body.scrollTop;
        }
    },
    onLayourScroll:function(e) {
        var lookups = document.getElementsByClassName("liquidLookupOpen");
        if(lookups) {                
            for(var i=0; i<lookups.length; i++) {
                Liquid.onBringLookup(lookups[i], true);
            }
        }
    },
    onFilterChange:function(e, obj) {
        if(e) {
            if(obj) {
                var liquid = Liquid.getLiquid(obj);
                if(liquid !== null) {
                    if (e.keyCode !== 13 
                            && (e.keyCode < 35 || e.keyCode > 40)
                            && e.keyCode != 27
                            ) {
                        if(!isDef(liquid.lastFilterTimetick)) {
                            liquid.lastFilterTimetick = getCurrentTimetick();
                        }
                        var dtime = (getCurrentTimetick() - liquid.lastFilterTimetick) / 1000;
                        if(dtime < Liquid.dynamicFilterMinTimeMS) {
                            liquid.lastFilterTimetick = getCurrentTimetick();
                            if(Liquid.dynamicFilterTimer) clearTimeout(Liquid.dynamicFilterTimer);
                            Liquid.dynamicFilterTimer = setTimeout( 
                                    function () { 
                                        Liquid.onFilterChange(e, obj); 
                                    }, Liquid.dynamicFilterMinTimeMS );
                            return;
                        }
                        Liquid.onExecuteFilter(obj);
                        delete liquid.lastFilterTimetick;
                    }
                }
            }
        }
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
     * @param obj the control where to start the filters
     * @return {} n/d
     */
    executeFilter:function(obj) {
        return Liquid.onExecuteFilter(obj);
    },
    onExecuteFilter:function(obj, bReloadAlways) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.filtersJson) {
                if(liquid.curFilter < 0) liquid.curFilter = 0;
                var filtersJson = liquid.filtersJson[liquid.curFilter];
                if(filtersJson) {
                    if(isDef(filtersJson.columns)) {
                        if(filtersJson.columns.length > 0) {
                            var bDoFilter = false;
                            if(filtersJson.columns.length) {
                                for(var i=0; i<filtersJson.columns.length; i++) {
                                    var element = document.getElementById(liquid.controlId + ".filters." +(liquid.curFilter+1) + "." + filtersJson.columns[i].runtimeName + ".filter");
                                    if(element) {
                                        if(isDef(element.dataset.linkedInputId))
                                            element = document.getElementById(element.dataset.linkedInputId);
                                        var elementValue = null;
                                        if(element.nodeName === "SELECT") {
                                            elementValue = element.options[element.selectedIndex].getAttribute("value");
                                        } else {
                                            elementValue = element.value;
                                        }
                                        if(filtersJson.columns[i].value !== elementValue) {
                                            filtersJson.columns[i].value = (elementValue === '' ? null : (elementValue === '""' ? "" : elementValue));
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
                                                    if(!isDef(filtersJson.columns[i].op)) {
                                                        // let server decide
                                                        filtersJson.columns[i].op = "";
                                                    }
                                                }
                                            }
                                            if(!isDef(filtersJson.columns[i].table)) filtersJson.columns[i].table = "";                                        
                                            bDoFilter = true;
                                            liquid.cPage = 0;
                                        }
                                    } else {
                                        // no html element : assume changed externally at runtime
                                        bDoFilter = true;
                                    }
                                }
                                filtersJson.curFilter = liquid.curFilter;
                            }
                        }
                    }
                }
                if(bDoFilter) {
                    // funzione callback : necessario rinfrescco dei grafici
                    liquid.onTransferCompleted = function(liquid) {
                        Liquid.refreshCharts(liquid, false);
                    }

                    if(liquid.tableJson) if(liquid.tableJson.isSystem === true) if(liquid.loadCounter === 0) Liquid.loadData(liquid, null, "executeFilter");
                    if( liquid.tableJson.filterMode === "client" || filtersJson.mode === "client" ) {
                        var forceReload = false;
                        if(liquid.tableJson.autoLoad === false) {
                            if(liquid.loadCounter === 0) {
                                forceReload = true;
                            }
                        }
                        if(liquid.needReload === true) {
                            delete liquid.needReload;
                            forceReload = true;                           
                        }
                        if(forceReload) {
                            Liquid.loadData(liquid, null, "executeFilter");
                        }
                        for(var i=0; i<filtersJson.columns.length; i++) {
                            var col = Liquid.getColumn(liquid, filtersJson.columns[i].name);
                            if(col) {
                                var filterComponent = liquid.gridOptions.api.getFilterInstance(col.field);
                                filterComponent.eValue1.value = filtersJson.columns[i].value && filtersJson.columns[i].value.toLowerCase() === "null" ? "" : filtersJson.columns[i].value;
                                filterComponent.onBtApply();
                            } else {
                                console.error("column \""+(filtersJson.columns[i].name)+"\" not found in filter:"+(filtersJson.name ? filtersJson.name : filtersJson.label) );
                            }
                        }
                        liquid.gridOptions.api.onFilterChanged();
                    } else {
                        Liquid.loadData(liquid, null, "executeFilter");
                    }
                } else {
                    if(isDef(bReloadAlways)) {
                        Liquid.loadData(liquid, null, "executeFilter/reload");
                    }
                }
            } else {
                if(isDef(bReloadAlways)) {
                    Liquid.loadData(liquid, null, "executeFilter/reload");
                }
            }
        };
    },    
    onResetFilters:function(obj, bInternal) {
        var retVal = false;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.filtersJson) {
                if(liquid.curFilter < 0) liquid.curFilter = 0;
                var filterJson = liquid.filtersJson[liquid.curFilter];
                if(filterJson) {
                    if(isDef(filterJson.columns)) {
                        if(filterJson.columns.length > 0) {
                            if(filterJson.columns.length) {
                                for(var i=0; i<filterJson.columns.length; i++) {
                                    if(bInternal && filterJson.columns[i].mode === "internal" || !bInternal) {
                                        filterJson.columns[i].value = null;
                                        retVal = true;
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
    onBtFilterExecute:function(obj) {
        Liquid.onExecuteFilter(obj);
    },
    onBtFirst:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.cPage !== 0) {
                liquid.cPage = 0;
                Liquid.loadData(liquid, null, "firstPage");
            }
        }
    },
    onBtLast:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid.cPage+1 !== liquid.nPages) {
            liquid.cPage = liquid.nPages > 0 ? liquid.nPages - 1 : 0;
            Liquid.loadData(liquid, null, "lastPage");
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
            Liquid.loadData(liquid, null, "previousPage");
        }
    },
    onGotoPage:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.cPage = Number(document.getElementById(liquid.controlId + ".cPage").value) - 1;
            if(liquid.cPage >= liquid.nPages) liquid.cPage = liquid.nPages - 1;
            if(liquid.cPage < 0) liquid.cPage = 0;
            Liquid.loadData(liquid, null, "gotoPage");
        }
    },
    onNextRow:function(event) {        
    },
    onPrevRow:function(event) {        
    },
    createLookupObjects:function(obj, rootObj, instanceId) {
        var isShared = false;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            //
            // combo may be shared, input and command are instances
            //
            liquid.lookupObj = document.createElement("div");
            liquid.lookupObj.id = instanceId + ".lookup";
            liquid.lookupObj.innerText = "";
            liquid.linkedInputId = instanceId + ".lookup.input";
            var className = "";
            if(liquid.tableJson.gridLink) className = "liquidGridControl";
            if(liquid.tableJson.layoutLink) className = "liquidLayoutControl";
            if(liquid.tableJson.filtertLink) className = "liquidFilterControl";

            var lookupMode = "lookup";
            var displayMode = "inline-block";
            var boxShadow = "rgb(167, 167, 167) 5px 5px 7px 1px";
            if(!isDef(liquid.sourceData)) lookupMode = "standalone";
            if(isDef(liquid.tableJson.query)) {
                liquid.tableJson.keepOpen = true;
                liquid.tableJson.navVisible = true;
                liquid.tableJson.autoSizeColumns = true;
                // liquid.tableJson.autoFitColumns = true;
                lookupMode = "fixed";
                displayMode = "";
                boxShadow = "";
            }

            liquid.lookupObj.innerHTML = "<input id=\"" + liquid.linkedInputId + "\""
                    + " class=\"liquidLookup "+(className)+(liquid.tableJson.zoomable===true ? "liquidGridControlZoomable":"")+"\""
                    + " readonly=\"readonly\" autocomplete=\"off\" type=\"text\""
                    + " data-mode=\""+(lookupMode)+"\""
                    + " data-gridlink=\"" + (liquid.tableJson.gridLink ? liquid.tableJson.gridLink : "") + "\""
                    + " data-layoutlink=\"" + (liquid.tableJson.layoutLink ? liquid.tableJson.layoutLink : "") + "\""
                    + " data-filterlink=\"" + (liquid.tableJson.filtertLink ? liquid.tableJson.filtertLink : "") + "\""                        
                    + " PlaceHolder=\""+(typeof liquid.tableJson.placeHolder !== 'undefined' ? liquid.tableJson.placeHolder : "")+"\""
                    + " onClick=\"Liquid.onOpenLookup(this)\""
                    + " onkeyup=\"if(Liquid.onChangeLookup(event)){ }\""
                    + "/>"            
                    + "<div id=\"" + instanceId + ".icon_container\" class=\"liquidLookupIconContainer\">"
                    + "<img id=\"" + instanceId + ".lookup.input.source\" src=\""+Liquid.getImagePath("open.png")+"\" onclick=\"Liquid.onOpenSourceLookup('"+instanceId+".lookup.input')\" style=\"padding-top:3px; right:-17px;\" width=\""+Liquid.lookupIconSize+"\" height=\""+Liquid.lookupIconSize+"\">"
                    + "<img id=\"" + instanceId + ".lookup.input.reset\" src=\""+Liquid.getImagePath("delete.png")+"\" onclick=\"Liquid.onResetLookup('"+instanceId+".lookup.input')\" style=\"padding-top:3px; right:7px;\" width=\""+Liquid.lookupIconSize+"\" height=\""+Liquid.lookupIconSize+"\">"
                    + "<img id=\"" + instanceId + ".lookup.input.reload\" src=\""+Liquid.getImagePath("update2.png")+"\" onclick=\"Liquid.onReloadLookup('"+instanceId+".lookup.input')\" style=\"padding-top:3px; right:7px;\" width=\""+Liquid.lookupIconSize+"\" height=\""+Liquid.lookupIconSize+"\">"
                    + "</div>";                        
            liquid.lookupObj.onmouseover = Liquid.lookupMouseOver;
            liquid.lookupObj.onmouseout = Liquid.lookupMouseOut;

            if(isDef(liquid.tableJson.query)) {
                if(liquid.tableJson.keepOpen) {
                    liquid.lookupObj.style.height = "0px";
                }
            }

            if(rootObj) {
                rootObj.insertBefore(liquid.lookupObj, rootObj.firstChild);
                rootObj.classList.add("liquidLookupTheme");
                // rootObj.style.width = "calc(100% - 0px)";
                // rootObj.style.padding = "0px";
                // rootObj.style.position = "relative";
                // rootObj.style.resize = "both";
                rootObj.style.filter = "grayscale(0) opacity(1) blur(0px)";
            }

            var lookupContainerComboId = liquid.controlId + ".lookup.combo";
            var lookupContainerComboContentId = liquid.controlId + ".lookup.combo.content";
            liquid.lookupContainerCombo = document.getElementById(lookupContainerComboId);
            if(!liquid.lookupContainerCombo) {
                liquid.lookupHeight = (typeof liquid.tableJson.height !== 'undefined' ? liquid.tableJson.height : (liquid.outDivObj.clientHeight > Liquid.minLookupHeight ? liquid.outDivObj.clientHeight : liquid.outDivObj.clientWidth * 2/3));
                liquid.lookupContainerCombo = document.createElement("div");
                liquid.lookupContainerCombo.id = lookupContainerComboId;
                liquid.lookupContainerCombo.style.width = "100%";
                liquid.lookupContainerCombo.style.height = (liquid.tableJson.keepOpen === true ? "calc(100% - 30px)" : "0px");
                liquid.lookupContainerCombo.style.display = displayMode;
                liquid.lookupContainerCombo.style.position = (liquid.tableJson.keepOpen === true ? "" : "");

                if(isDef(liquid.tableJson.query)) {
                    // link inside parent (always open)
                    if(rootObj)
                        rootObj.appendChild(liquid.lookupContainerCombo);
                } else {
                    // link to body as indipendent
                    document.body.appendChild(liquid.lookupContainerCombo);
                }


                liquid.lookupContainerComboContent = document.createElement("div");
                liquid.lookupContainerComboContent.id = lookupContainerComboContentId;
                liquid.lookupContainerComboContent.style.width = "100%";
                liquid.lookupContainerComboContent.style.height = "";
                liquid.lookupContainerComboContent.style.position = "relative";
                liquid.lookupContainerComboContent.style.display = displayMode;
                liquid.lookupContainerComboContent.style.zIndex = "150";                 
                liquid.lookupContainerComboContent.style.boxShadow = boxShadow;
                liquid.lookupContainerCombo.appendChild(liquid.lookupContainerComboContent);
                
                // set the root of the control
                liquid.rootObj = liquid.lookupContainerComboContent;

                try {
                    rootObj.dataset.linkedInputId = liquid.linkedInputId;
                    liquid.lookupContainerCombo.dataset.linkedInputId = liquid.linkedInputId;
                } catch (e) {
                }
            } else {
                // set the root of the control
                liquid.rootObj = liquid.lookupContainerComboContent = document.getElementById(lookupContainerComboContentId);
                isShared = true;
            }
            
            // link the template to inputObj
            var inputObj = document.getElementById(liquid.linkedInputId);
            if(inputObj) {
                inputObj.setAttribute('comboId', lookupContainerComboId);
            } else {
                console.error("ERROR: inputObj not found")
            }
        }
        return isShared;
    },
    onOpenLookup:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            // 
            // var inputObj = document.getElementById(liquid.controlId + ".lookup.input");
            var inputObj = obj;
            if(inputObj)
                if(inputObj.disabled)
                    return;
            
            if(inputObj.readOnly)
                if(inputObj.dataset.mode != "standalone" && !inputObj.dataset.filterlink)
                    return;


            Liquid.onBringLookup(obj, true);
            
            var objs = Liquid.getComboLookup(inputObj);
            var comboObj = objs[0];
            var comboContentObj = objs[1];
            var lookupObj = objs[3];
            if(comboContentObj) {                
                jQ1124( comboContentObj ).slideDown( "normal", function(){ this.style.display = "inline-block"; });
                comboContentObj.dataset.linkedInputId = inputObj.id;
            }
            if(comboObj) {
                comboObj.dataset.linkedInputId = inputObj.id;
            }
            if(inputObj) inputObj.select();
            
            var lookupLiquid = Liquid.getLiquid(comboContentObj);
            if(lookupLiquid) {
                lookupLiquid.status = "opening";
                // setting .linkedInputId, the link with the instance
                lookupLiquid.linkedInputId = inputObj.id;
                lookupLiquid.lookupObj = lookupObj;
                lookupLiquid.lastSelectedId = -1;

                // resetting mirrorEvents
                delete liquid.mirrorEvents;
                // lookupLiquid.gridOptions.api.deselectAll();
                
                //
                // executing filters
                //
                if(Liquid.onResetFilters(lookupLiquid, true)) {                
                    Liquid.onExecuteFilter(lookupLiquid);
                }
                
                // select by search current value
                if(isDef(lookupLiquid.tableJson.lookupField)) {
                    var col = Liquid.getColumn(lookupLiquid, lookupLiquid.tableJson.lookupField);
                    if(col) {
                        var res = Liquid.setNodesSelectedByColumn(lookupLiquid, col.field, obj.value.split(","), true);
                    }
                }

                lookupLiquid.status = "open";
                
                
                if(obj.nodeType === 1) {
                    var parent = obj.parentNode;
                    if(lookupLiquid.needResize === true) {
                        Liquid.onResize(lookupLiquid);
                        lookupLiquid.needResize = false;
                    }
                }
                // focus on forst item
                if(lookupLiquid.filtersFirstId) {
                    var filtersFirstId = document.getElementById(lookupLiquid.filtersFirstId);
                    if(filtersFirstId) {
                        filtersFirstId.focus();
                        filtersFirstId.select();
                    }
                }
            }            
        }
    },
    onChangeLookup:function(e) {
        var bDoFilter = false;
        if(e) {
            if(e.target) {
                var inputObj = e.target;
                var objs = Liquid.getComboLookup(inputObj);
                var comboContentObj = objs[1];
                var lookupObj = objs[3];
                var lookupLiquid = Liquid.getLiquid(comboContentObj);
                if(lookupLiquid) {
                    var liquid = lookupLiquid;
                    var columnName = liquid.tableJson.lookupField;
                    if (e.keyCode !== 13 
                        && (e.keyCode < 35 || e.keyCode > 40)
                        && e.keyCode != 27
                        ) {
                        if(!isDef(liquid.filtersJson) || !liquid.filtersJson.length) {
                            liquid.filtersJson = [ {} ];
                            liquid.curFilter = 0;
                        }
                        if(liquid.filtersJson) {
                            if(liquid.curFilter < 0) liquid.curFilter = 0;
                            var filterJson = liquid.filtersJson[liquid.curFilter];
                            var colDetected = false;
                            if(filterJson) {
                                liquid.tableJson.filterMode = "client";
                                if(!isDef(filterJson.columns)) {
                                    filterJson.columns = [ ];
                                }
                                if(isDef(filterJson.columns)) {
                                    if(filterJson.columns.length > 0) {
                                        if(filterJson.columns.length) {
                                            for(var i=0; i<filterJson.columns.length; i++) {
                                                if(filterJson.columns[i].name === columnName) {
                                                    colDetected = true;
                                                    if(filterJson.columns[i].value !== e.target.value) {
                                                        bDoFilter = true;
                                                        filterJson.columns[i].value = e.target.value;
                                                        filterJson.columns[i].op = "like";
                                                        filterJson.columns[i].mode = "internal";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if(!colDetected) {
                                liquid.filtersJson[liquid.curFilter].columns.push( { name:columnName, value:e.target.value, op:"like", mode:"internal" } );
                                bDoFilter = true;
                            }
                        }
                        if(bDoFilter) {
                            Liquid.onFilterChange(e, comboContentObj);
                        }
                    } else if (e.keyCode === 13) {
                        if(isDef(liquid.tableJson.allowInsert)) {
                            if(liquid.tableJson.allowInsert === true) {
                                var lookupColumn1B = 0;
                                for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                    if(liquid.tableJson.columns[ic].name === columnName) {
                                        lookupColumn1B = ic+1;
                                        break;
                                    }
                                }
                                if(lookupColumn1B) {
                                    // conteggio righe
                                    var rowCount = 0;
                                    var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                    for(var i=0; i<nodes.length; i++) {
                                        if(e.target.value === nodes[i].data[lookupColumn1B-1]) {
                                            rowCount++;
                                            break;
                                        }
                                    }
                                    if(!rowCount) {
                                        // nothing math
                                        Liquid.addRow(liquid);
                                        for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                            if(liquid.tableJson.columns[ic].name === columnName) {
                                                if(liquid.addingRow) {
                                                    liquid.addingRow[ic+1] = e.target.value;
                                                }
                                            }
                                        }
                                        // avoid row deselect event
                                        var selNodes = Liquid.getCurNodes(liquid);
                                        if(selNodes) {
                                            Liquid.addMirrorEvent(liquid, selNodes[0]);
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
                                            Liquid.resetMofifications(liquid);
                                        }
                                    }
                                }
                            }
                        }
                    } else if (e.keyCode === 40) {
                        // key down
                    } else if (e.keyCode === 27) {
                        var curNodes = Liquid.getCurNodes(liquid);
                        if(curNodes && curNodes.length) {
                            e.data = curNodes[0].data;
                            Liquid.onSetLookup(liquid, e);
                            Liquid.onCloseLookup(liquid);                        
                        }
                    }
                }
            }
        }
        return bDoFilter;
    },
    getComboLookup:function(obj) {
        // wrapping...
        var comboId = null, inputId = null;
        var inputObj = null, comboObj = null;
        if(obj instanceof LiquidCtrl ) {
            var liquid = obj;
            if(liquid.linkedInputId) {
                inputObj = document.getElementById(liquid.linkedInputId);
                comboObj = liquid.lookupContainerCombo;
                inputId = inputObj ? inputObj.id : null;
                comboId = comboObj ? comboObj.id : null;
            } else {
                console.error("ERROR: linkedInputId on control not set");
            }
        } else if(obj instanceof HTMLElement ) {
            inputObj = obj;
            comboId = inputObj ? inputObj.getAttribute('comboId') : null;
            inputId = inputObj ? inputObj.id : null;
            inputObj = document.getElementById(inputId);
            comboObj = document.getElementById(comboId);
        } else {
            // pitfall
            return null;
        }
        var comboContentId = comboId+".content";
        var comboContentObj = document.getElementById(comboContentId);
        var lookupObj = inputObj ? inputObj.parentNode : null;
        var lookupId = lookupObj ? lookupObj.id : null;
        return [ comboObj, comboContentObj, inputObj, lookupObj ];
    },
    onBringLookup:function(obj, bBrigUp) {
        if(obj) {
            var inputId = obj.id;
            var inputObj = obj;
            if(inputObj) {
                if(inputObj.dataset) { // is the combo ?
                    if(inputObj.dataset.linkedInputId) {
                        inputId = inputObj.dataset.linkedInputId;
                        inputObj = document.getElementById(inputId);
                    }
                }
                if(inputObj) {
                    var comboObj = Liquid.getComboLookup(inputObj)[0];
                    var comboId = comboObj ? comboObj.id : null;

                    if(inputObj.dataset) {
                        if(inputObj.dataset.mode === "fixed") { // fixed size
                            return;
                        }
                    }
                    if(comboObj && inputObj) {
                        if(bBrigUp) {
                            var rect = inputObj.getBoundingClientRect();
                            if(rect.width != 0 || rect.height != 0) {
                                comboObj.style.width = rect.width+"px";
                                comboObj.style.top = rect.y + rect.height;
                                comboObj.style.left = rect.x;
                                comboObj.classList.add('liquidLookupOpen');
                            }
                        } else {
                            comboObj.classList.remove('liquidLookupOpen');
                            comboObj.style.width = "";
                            comboObj.style.top = "";
                            comboObj.style.left = "";
                        }
                    }
                }
            }
        }
    },
    onCloseLookup:function(obj, event) {
        if(obj) {
            var liquid = Liquid.getLiquid(obj);
            if(liquid) {
                if(isDef(liquid.dontCloseLookup)) { // dont close ... only runtime
                    delete liquid.dontCloseLookup;
                    return;
                }            
                if(liquid.gridOptions.rowSelection === "multiple" || liquid.tableJson.keepOpen === true) {
                    Liquid.onSetLookup(obj, event);
                }            
                if(liquid.tableJson.keepOpen === true) {                
                } else {
                    var comboContentObj = Liquid.getComboLookup(obj)[1];
                    if(comboContentObj) {
                        comboContentObj.style.display = "none";
                    }
                    liquid.status = "";
                                               
                    var lookupObj = liquid.lookupObj;
                    if(lookupObj.nodeType === 1) {
                    }
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
    onOpenSourceLookup:function(obj_id) {
        var inputObj = document.getElementById(obj_id);
        if(inputObj) {
            var comboContentObj = Liquid.getComboLookup(inputObj)[1];
            if(comboContentObj) {
                var lookupLiquid = Liquid.getLiquid(comboContentObj);
                if(lookupLiquid) {
                    var liquid = lookupLiquid;
                    // if(!obj.readOnly && !obj.disabled) {
                    var WinXContainer = liquid.parentObjId ? liquid.parentObjId : Liquid.getParentObj(inputObj);
                    if(isDef(liquid.sourceData)) {
                        var sourceControlId = null;
                        var sourceControlJSON = null;
                        if(isDef(liquid.sourceData.lookupSourceControlId)) { // linked to control id : should be already load
                            sourceControlId = liquid.sourceData.lookupSourceControlId;
                            sourceControlJSON = null;
                        } else if(isDef(liquid.sourceData.lookupSourceGlobalVar)) { // linked by global var
                            var globalVar = liquid.sourceData.lookupSourceGlobalVar;
                            if(typeof globalVar === 'object') {
                                if(isDef(globalVar.controlId)) {
                                    sourceControlId = globalVar.controlId;
                                    sourceControlJSON = globalVar.json;
                                }
                            } else if(typeof globalVar === 'string') {
                                var globalVar = Liquid.getProperty(liquid.sourceData.lookupSourceGlobalVar);
                                if(isDef(globalVar)) {
                                    if(isDef(globalVar.controlId)) {
                                        sourceControlId = globalVar.controlId;
                                        sourceControlJSON = globalVar.json;
                                    } else {
                                        if(isDef(liquid.sourceData.lookupSourceGlobalVarControlId)) { 
                                            sourceControlId = liquid.sourceData.lookupSourceGlobalVarControlId;
                                            sourceControlJSON = globalVar;
                                        } else {
                                            try {
                                                var json = JSON.parse(globalVar);
                                                if(isDef(json.controlid)) {
                                                    sourceControlId = json.controlid;
                                                    sourceControlJSON = globalVar;
                                                }
                                            } catch (e) {}
                                        }
                                    }
                                }
                            }
                        }
                        if(sourceControlId) {
                            setTimeout( function() { Liquid.onOpenSourceLookupProcess(inputObj, sourceControlId, sourceControlJSON, WinXContainer); }, 250 );
                        } else {
                            console.error("ERROR : id of source control not defined .. cannot navigate to source");
                        }
                    }
                }
            }
        }
    },
    onOpenSourceLookupProcess:function(inputObj, sourceControlId, sourceControlJSON, WinXContainer) {
        if(inputObj) {
            var comboContentObj = Liquid.getComboLookup(inputObj)[1];
            if(comboContentObj) {
                var lookupLiquid = Liquid.getLiquid(comboContentObj);
                if(lookupLiquid) {
                    var liquid = lookupLiquid;
                    var result = Liquid.startWinX(sourceControlId, sourceControlJSON, WinXContainer, 'maximized', { autoLoad:false } );
                    var sourceLiquid = Liquid.getLiquid(sourceControlId);
                    var theLink = null;
                    if(sourceLiquid) {
                        // search the row
                        if(inputObj.dataset) {
                            var gridLink = inputObj.dataset.gridlink;
                            var layoutLink = inputObj.dataset.layoutlink;
                            var filterLink = inputObj.dataset.filterlink;
                            theLink = gridLink ? gridLink : layoutLink ? layoutLink : filterLink ? filterLink : null;
                        }
                        // search for the control owning the row that owns the lookup
                        var targetLField = null;
                        var targetLiquid = null;
                        if(isDef(liquid.sourceData.idColumnLinkedFields)) {
                            for(var i=0; i<liquid.sourceData.idColumnLinkedFields.length; i++) {
                                targetLFieldName = liquid.sourceData.idColumnLinkedFields[i].targetFieldName;
                                targetLField = liquid.sourceData.idColumnLinkedFields[i].targetField;
                                targetLiquid = Liquid.getLiquid(liquid.sourceData.idColumnLinkedFields[i].controlId);
                                break;
                            }
                        }
                        if(isDef(targetLField)) {
                            var selNodes = Liquid.getCurNodes(targetLiquid);
                            if(isDef(selNodes)) {
                                if(selNodes.length) {
                                    var data = selNodes[0].data;
                                    var idValue = data[targetLField];
                                    var targetCol = null;

                                    if(idValue) {
                                        // filter by idValue on the foreign column define by the lookup                                        
                                        if(theLink) {
                                            var grid_coords = Liquid.getGridCoords(targetLiquid, theLink);
                                            if(isDef(grid_coords)) {
                                                targetCol = Liquid.getColumn(sourceLiquid, grid_coords.column.foreignColumn);
                                                if(!targetCol) {
                                                    console.error("ERROR : undetected target column '"+grid_coords.column.foreignColumn+"' on field '"+grid_coords.column.name+"'");
                                                }
                                            } else {
                                                var lay_coords = Liquid.getLayoutCoords(targetLiquid, theLink);
                                                if(isDef(lay_coords)) {
                                                    var column = targetLiquid.tableJson.columns[Number(lay_coords.col)];
                                                    targetCol = Liquid.getColumn(sourceLiquid, column.foreignColumn);
                                                    if(lay_coords.row != 0) {
                                                        // need to recompupte source data
                                                        var nodes = targetLiquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                                        var rowIndex = lay_coords.layout.baseIndex1B-1 + lay_coords.row;                                                
                                                        var data = nodes[rowIndex].data;
                                                        idValue = data[targetLField];
                                                    }
                                                }
                                            }
                                        }
                                        if(isDef(targetCol)) {
                                            sourceLiquid.runtimeFiltersJson = { columns: [ { name:targetCol.name, field:targetCol.field, value:idValue } ], name:"runtime filter on open source lookup" };
                                            sourceLiquid.tableJson.tempAutoSelect = true;
                                            Liquid.loadData(sourceLiquid, null, "openSource");
                                            // Liquid.setFocus(sourceLiquid);
                                        } else {
                                            console.error("ERROR : undetected target column .. cannot navigate to source row");
                                        }
                                    } else {
                                        // valore vuoto : termina l'operazione
                                        Liquid.setFocus(targetLiquid);
                                    }
                                } else {
                                    console.error("ERROR : selection empty .. cannot navigate to source");
                                }
                            } else {
                                console.error("ERROR : selection not defined .. cannot navigate to source");
                            }
                        } else {
                            console.error("ERROR : id columns not defined in lookup .. cannot navigate to source");
                        }
                    } else {
                        console.error("ERROR : cannot navigate to source control");
                    }
                }
            }
        }
    },
    onReloadLookup:function(obj_id, reason) {
        var inputObj = document.getElementById(obj_id);
        if(inputObj) {
            var comboContentObj = Liquid.getComboLookup(inputObj)[1];
            if(comboContentObj) {
                var lookupLiquid = Liquid.getLiquid(comboContentObj);
                if(lookupLiquid) {
                    lookupLiquid.needReload = true;
                    Liquid.onExecuteFilter(lookupLiquid, true);
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
            tbl.cellPadding = 0;
            tbl.cellSpacing = 0;
            var tbody = document.createElement("tbody");
            var filterbBarToBottom = true;
            var tr = null;
            var trFilterBar = Liquid.createFiltersBar(liquid);
            
            if(isDef(liquid.tableJson.filterBarPosition)) {
            	if(liquid.tableJson.filterBarPosition.toLowerCase() === "bottom") {
                    filterbBarToBottom = true;
            	}
            }
            if(!filterbBarToBottom)
            	tbody.appendChild(trFilterBar);

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
                // TODO : cannot select text even draggable
                // if(Liquid.projectMode) Liquid.setDraggable(liquid.filtersJson[i].filterDiv);
                if(liquid.mode !== "lookup")
                    liquid.filtersJson[i].filterTable.style.position = "initial";
            }
            tr.appendChild(td);
            tbody.appendChild(tr);
            
            if(filterbBarToBottom)
            	tbody.appendChild(trFilterBar);
            
            tbl.appendChild(tbody);
            liquid.rootObj.appendChild(tbl);
            liquid.filtersObj = tbl;            
        }
    },
    createFiltersBar:function(liquid) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");

        td.className = "liquidFiltersLabel";
        if(liquid.filtersJson.length > 1) {
            var div = document.createElement("div");
            div.innerHTML = Liquid.lang === 'eng' ? "Filter" : "Tipo ricerca";
            td.appendChild(div);
        }
        tr.appendChild(td);

        td = document.createElement("td");
        if(liquid.filtersJson.length > 1) {
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
        }
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
        return tr;
    },
    createFilterTab:function(liquid, filterGroupIndex, filterJson) {
        if(filterJson) {
            if(filterJson.columns) {
                var i = 0;
                var tbl = document.createElement("table");
                tbl.id = liquid.controlId+".FilterTbl";
                tbl.className = "liquidFilterTbl";
                tbl.cellSpacing = 0;
                tbl.cellPadding = 0;
                var tbody = document.createElement("tbody");
                liquid.filtersFirstId = null;

                if(isDef(filterJson.rows))
                    filterJson.nRows = filterJson.rows;
                if(isDef(filterJson.cols))
                    filterJson.nCols = filterJson.cols;

                for(var r = 0; r < filterJson.nRows; r++) {
                    var tr = document.createElement("tr");
                    for(var c = 0; c < filterJson.nCols; c++) {
                        if(i < filterJson.columns.length) {
                            var td = document.createElement("td");
                            filterJson.columns[i].runtimeName = filterJson.columns[i].name+"."+(i+1);
                            filterJson.columns[i].linkedContainerId = liquid.controlId + ".filters." +filterGroupIndex + "." + filterJson.columns[i].runtimeName + ".filter";
                            Liquid.createFilterObject(liquid, td, filterGroupIndex, filterJson.columns[i]);
                            tr.appendChild(td);
                            i++;
                        }
                    }
                    tbody.appendChild(tr);
                }
                tbl.appendChild(tbody);
                if(isDef(filterJson.columns) && filterJson.columns.length) {
                    liquid.filtersFirstId = liquid.controlId + ".filters." +filterGroupIndex + "." + filterJson.columns[0].runtimeName + ".filter";
                }
                return tbl;
            }
        }
    },
    onSetLookup:function(obj, event) {
        if(obj) {         
            var objs = Liquid.getComboLookup(obj);
            var comboObj = objs[0];
            var comboContentObj = objs[1];
            var inputObj = objs[2];
            var lookupLiquid = Liquid.getLiquid(comboContentObj);
            if(lookupLiquid) {
                var liquid = lookupLiquid;
                var newValue = null;
                var newValueId = null;
                var lookupFieldName = isDef(liquid.tableJson.lookupField) ? liquid.tableJson.lookupField : liquid.tableJson.primaryKeyField;
                var lookupIdColumnName = isDef(liquid.tableJson.idColumnField) ? liquid.tableJson.idColumnField : null;
                var lookupFieldCol = Liquid.getColumn(liquid, lookupFieldName);
                var lookupIdCol = Liquid.getColumn(liquid, lookupIdColumnName);

                // var lookupTargetColumnName = isDef(liquid.tableJson.targetColumn) ? liquid.tableJson.targetColumnField : null;
                // var lookupTagetCol = Liquid.getColumn(liquid, lookupTargetColumnName);

                if(isDef(lookupFieldName)) {
                    if(!isDef(lookupFieldCol)) {
                        console.error("ERROR: Column '"+lookupFieldName+"' NOT found in control '"+liquid.controlId+"'");   
                    }
                } else {
                    console.warn("WARNING: Lookuop column NOT defined in control '"+liquid.controlId+"'");   
                }
                if(isDef(liquid.tableJson.idColumnField)) {
                    if(!isDef(lookupIdCol)) {
                        console.error("ERROR: Column '"+lookupIdColumnName+"' NOT found in control '"+liquid.controlId+"'");   
                    }
                }
                
                if(liquid.gridOptions.rowSelection === "multiple") {                
                    var selNodes = Liquid.getSelectedNodes(liquid);
                    newValue = "";
                    newValueId = "";
                    for(var node=0; node<selNodes.length; node++) {
                        if(newValue.length > 0)
                            newValue += ",";
                        if(lookupFieldCol) newValue += selNodes[node].data[lookupFieldCol.field];
                        if(lookupIdCol) newValueId += selNodes[node].data[lookupIdCol.field];
                    }
                } else {
                    newValue = event && lookupFieldCol ? event.data[lookupFieldCol.field] : null;
                    newValueId = event && lookupIdCol ? event.data[lookupIdCol.field] : null;
                }
                if(newValue !== null) {
                    try {
                        inputObj.value = newValue;
                        var gridLink = (inputObj.dataset !== 'undefined' ? inputObj.dataset.gridlink : null);
                        var layoutLink = (inputObj.dataset !== 'undefined' ? inputObj.dataset.layoutlink : null);
                        var links = [ gridLink, layoutLink ];
                        for(var il=0; il<links.length; il++) {
                            var link = links[il];
                            if(isDef(link)) {
                                var linkedItemId = typeof link === 'object' ? link.id : link;
                                var nameItems = linkedItemId.split(".");
                                if(nameItems && nameItems.length > 2) {
                                    var containerIndex = nameItems[2] - 1;
                                    var targetLiquid = Liquid.getLiquid(nameItems[0]);
                                    if(targetLiquid) {
                                        if(nameItems.length > 4) {
                                            var itemIndex = nameItems[4] - 1;
                                            if(il === 0) {
                                                if(targetLiquid.tableJson.grids) {
                                                    var grid = targetLiquid.tableJson.grids[containerIndex];
                                                    var gridControl = grid.columns[itemIndex];
                                                    var col = gridControl.colLink1B > 0 ? targetLiquid.tableJson.columns[gridControl.colLink1B-1] : null;
                                                    /*
                                                    if(typeof gridControl.isReflected === 'undefined' || gridControl.isReflected !== true) {
                                                        Liquid.onGridFieldModify(event, inputObj.parentNode.parentNode);
                                                    }*/
                                                    if(col) {
                                                        var selNodes = targetLiquid.gridOptions.api.getSelectedNodes();
                                                        if(selNodes && selNodes.length) {
                                                            selNodes[0].setDataValue(col.field, newValue);
                                                            Liquid.registerFieldChange(liquid, null, selNodes[0].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], col.field, null, newValue);
                                                            Liquid.updateDependencies(targetLiquid, col, null);
                                                        }
                                                    }

                                                    Liquid.setGridFieldAsChanged(liquid, gridControl, true);
                                                }
                                            } else {
                                                if(targetLiquid.tableJson.layouts) {
                                                    var lay = targetLiquid.tableJson.layouts[containerIndex];
                                                    // var layControl = lay.columns[itemIndex];
                                                    // if(typeof layControl.isReflected === 'undefined' || layControl.isReflected !== true) {
                                                    var linkedItemObj = document.getElementById(linkedItemId);
                                                    if(linkedItemObj) {
                                                        // event fitting
                                                        if(event) {
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
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                if(newValueId !== null) {
                    if(isDef(liquid.sourceData)) {
                        if(isDef(liquid.sourceData.targetColumnLinkedObjIds)) { // take care about all grid fields pointing to id
                            for(var i=0; i<liquid.sourceData.targetColumnLinkedObjIds.length; i++) {
                                try {
                                    var itemObj = document.getElementById(liquid.sourceData.targetColumnLinkedObjIds[i]);
                                    itemObj.value = newValueId;
                                    Liquid.onGridFieldModify(event, itemObj);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        }
                        if(isDef(liquid.sourceData.idColumnLinkedFields)) { // take care about id in the dataset
                            for(var i=0; i<liquid.sourceData.idColumnLinkedFields.length; i++) {
                                try {
                                    var targetField = liquid.sourceData.idColumnLinkedFields[i].targetField;
                                    var targetFieldName = liquid.sourceData.idColumnLinkedFields[i].targetFieldName;
                                    if(isDef(targetField)) {
                                        var targetLiquid = Liquid.getLiquid(liquid.sourceData.idColumnLinkedFields[i].controlId);
                                        var col = targetLiquid.tableJson.columns[Number(targetField) - 1];
                                        if(typeof col.isReflected === 'undefined' || col.isReflected !== true || col.isReflected === true) { // yes column is reflected, we must write it
                                            var selNodes = targetLiquid.gridOptions.api.getSelectedNodes();
                                            var isFormX = Liquid.isFormX(targetLiquid);
                                            var isAutoInsert = Liquid.isAutoInsert(targetLiquid, null); // TODO : current layout

                                            // if(isFormX || isAutoInsert) {
                                            if(targetLiquid.addingRow) {
                                                selNodes = [ targetLiquid.addingNode ? targetLiquid.addingNode : targetLiquid.addingnode ];
                                            }
                                            for(var node=0; node<selNodes.length; node++) {
                                                var validateResult = Liquid.validateField(targetLiquid, col, newValueId);
                                                if(validateResult !== null) {
                                                    if(validateResult[0] >= 0) {
                                                        newValueId = validateResult[1];
                                                        selNodes[node].setDataValue(targetField, newValueId);
                                                        Liquid.registerFieldChange(targetLiquid, selNodes[node].id, selNodes[node].data[ targetLiquid.tableJson.primaryKeyField ? targetLiquid.tableJson.primaryKeyField : "1" ], targetField, null, newValueId);
                                                        Liquid.updateDependencies(targetLiquid, col, null, null);
                                                        // N.B.: transaction is owned by modification
                                                        selNodes[node].data[targetField] = newValueId;
                                                        // var res = liquid.gridOptions.api.updateRowData({update: [ selNodes[node] ]});
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
                                    } else {
                                        console.error("ERROR: Target column '"+targetFieldName+"' NOT found in control '"+liquid.controlId+"'");   
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    getLiquidRow:function(obj, key) {
        var rows = Liquid.getLiquidRows(obj, key, true);
        if(rows && rows.length) {
            return rows[0];
        } else {
            return null;
        }
    },
    getLiquidRows:function(obj, key, transacted) {
        var liquid = Liquid.getLiquid(obj);
        if(!liquid) {
            glVar = Liquid.searchLiquid(obj);
            if(isDef(glVar)) {
                console.info("INFO: Loading control '"+obj+"' as iconized winX...");
                Liquid.startWinX( glVar.controlId, glVar.json, null, "iconic", { loadDataSync:true } );
                var timeout_msec = 9000;
                const date = Date.now();
                do {
                    currentDate = Date.now();
                    liquid = Liquid.getLiquid(obj);
                } while (liquid === null && currentDate - date < timeout_msec);                
                if(!liquid) {
                    console.error("ERROR: Timeout loading control '"+obj+"'");
                } else {
                    if(liquid.tableJson.autoLoad !== false) {
                        do {
                            currentDate = Date.now();
                        } while (liquid.absoluteLoadCounter === 0 && currentDate - date < timeout_msec);
                        if(liquid.absoluteLoadCounter === 0) {
                            console.error("ERROR: Timeout loading data of control '"+obj+"'");
                        }
                    } else {
                        Liquid.loadData(liquid);
                    }
                }                
            }
        }
        if(liquid) {
            primaryKeyField = isDef(liquid.tableJson.primaryKeyField) ? liquid.tableJson.primaryKeyField : null;
            if(primaryKeyField) {
                var selNodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                var rowsData = [];
                for(var i=0; i<selNodes.length; i++) {
                    if(selNodes[i].data[primaryKeyField] === key) {
                        // var curNode = isDef(transacted) ? Liquid.applyPendingFieldsChange( liquid, selNodes[i] ) : nodes[i];
                        var curNode = selNodes[i];
                        rowsData.push( Liquid.getFullRecordData(liquid, curNode, true) );
                    }
                }
                return rowsData;
            } else {
                console.error("ERROR: control '"+obj+"' hasn't primaryKey defined");
            }
        } else {
            console.error("ERROR: control '"+obj+"' not found");
            if(Liquid.projectMode) Liquid.dumpControlId();
        }
    },
    setLiquidRow:function(obj, row) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            primaryKey = isDef(liquid.tableJson.primaryKey) ? liquid.tableJson.primaryKey : null;
            primaryKeyField = isDef(liquid.tableJson.primaryKeyField) ? liquid.tableJson.primaryKeyField : null;
            if(primaryKey) {
                if(row) {
                    var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    var rowsData = [];
                    var key = row[primaryKey];
                    if(!isDef(key)) { // maybe in field resolved mode
                        if(primaryKeyField) {
                            key = row[primaryKeyField];
                        }
                    }
                    for(var i=0; i<nodes.length; i++) {
                        if(nodes[i].data[primaryKeyField] === key) {
                            for(var attrname in row) {
                                if(attrname != primaryKeyField && attrname != primaryKey) {
                                    var colField = attrname;
                                    if(!isDef(nodes[i].data[attrname])) {
                                        var col = Liquid.getColumn(liquid, attrname);
                                        if(col) {
                                            colField = col.field;
                                        } else {
                                            console.error("ERROR: column '"+attrname+"' not found");
                                        }
                                    }
                                    if(nodes[i].data[colField] !== row[attrname]) {
                                        // nodes[i].data[colField] = row[attrname];
                                        nodes[i].setDataValue(colField, row[attrname]);
                                        Liquid.registerFieldChange(liquid, null, nodes[i].data[ primaryKeyField ], colField, null, row[attrname]);
                                        Liquid.updateDependencies(liquid, liquid.tableJson.columns[Number(colField)-1], null, null);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                console.error("ERROR: control '"+obj+"' hasn't primaryKey defined");
            }
        } else {
            console.error("ERROR: control '"+obj+"' not found");
            if(Liquid.projectMode) Liquid.dumpControlId();
        }
    },
    getSelectedLiquidRow:function(obj, foreignTable) {
        var rows = Liquid.getSelectedLiquidRows(obj, foreignTable);
        if(rows && rows.length) {
            return rows[0];
        } else {
            return null;
        }
    },
    getSelectedLiquidRows:function(obj, foreignTable) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var foundFT1B = 0;
            if(isDef(foreignTable)) {
                var nameItems = foreignTable.split(".");
                for(var i=0; i<nameItems.length; i++) {
                    for(var ift=0; ift<liquid.foreignTables.length; ift++) {
                        var name = liquid.foreignTables[ift].name ? liquid.foreignTables[ift].name : liquid.foreignTables[ift].foreignTable;
                        if(name.toUpperCase() === nameItems[i].toUpperCase()) {
                            if(i>0) {
                                if(liquid.foreignTables[ift].sourceForeignTable === nameItems[i-1]) bfound = true;
                            } else bfound = true;
                            if(bfound) {
                                foundFT1B = ift+1;
                            }                                
                        }
                    }
                }
                if(!foundFT1B) {
                    return null;
                }
            }
        }
        if(foundFT1B) liquid = Liquid.getLiquid(liquid.foreignTables[foundFT1B-1].controlId);
        if(liquid) {
            return Liquid.getFullSelectedRecordsData(liquid, true);
        } else {
            console.error("ERROR: control '"+obj+"' not found");
            if(Liquid.projectMode) Liquid.dumpControlId();
        }
        return null;
    },
    getSelectedLookupRow:function(obj, columnName) {
        var rows = Liquid.getSelectedLookupRows(obj, columnName);
        if(rows && rows.length) {
            return rows[0];
        } else {
            return null;
        }
    },
    getSelectedLookupRows:function(obj, columnName) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var lookupControlIds = Liquid.getLookupData(obj, columnName);
            if(lookupControlIds) {
                if(lookupControlIds.length === 1) {
                    liquid = Liquid.getLiquid(lookupControlIds[0]);
                    if(liquid) {
                        return Liquid.getFullSelectedRecordsData(liquid, true);
                    }
                } else if(lookupControlIds.length > 1) {
                    // search on current grid / current foreign table
                    curLiquid = liquid;
                    if(isDef(liquid.currentForeignTable)) {
                        curLiquid = Liquid.getLiquid(liquid.FTTabList[liquid.currentForeignTable]);
                    }
                    if(isDef(curLiquid)) {
                        if(isDef(curLiquid.currentTab)) {
                            if(Number(curLiquid.currentTab) > 0) {
                                var containerObj = document.getElementById(liquid.tabList[curLiquid.currentTab].id + ".content");
                                for(var ic=0; ic<lookupControlIds.length; ic++) {
                                    var controlObj = Liquid.getLiquid(lookupControlIds[ic]).outDivObj;
                                    if(controlObj) {
                                        if(Liquid.isParentNode(controlObj, containerObj)) {
                                            liquid = Liquid.getLiquid(lookupControlIds[ic]);
                                            return Liquid.getFullSelectedRecordsData(liquid, true);
                                        }
                                    }
                                }
                            }
                        }
                    }                    
                    alert("ERROR: on getSelectedLookupRows() failed to get source : multiple lookuop links found ("+lookupControlIds.length+")");
                } else {
                    alert("ERROR: on getSelectedLookupRows() failed to get lookuop link");
                }
            }
        } else {
            console.error("ERROR: control '"+obj+"' not found");
            if(Liquid.projectMode) Liquid.dumpControlId();
        }
        return null;
    },
    getLookupData:function(obj, columnName) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var col = Liquid.getColumn(liquid, columnName);
            if(col) {
                if(col.linkedLiquidIds) {
                    return col.linkedLiquidIds;
                }
            }
        } else {
            console.error("ERROR: control '"+obj+"' not found");
            if(Liquid.projectMode) Liquid.dumpControlId();
        }
        return null;
    },
    /**
     * Start waiting for operation
     * @param liquid the control where to start the waiter
     * @return {} n/d
     */
    startWaiting:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.waitingObj) {
                liquid.waitingObj.style.display = '';
            }
        }
    },
    /**
     * Stop waiting for operation
     * @param liquid the control where to top the waiter
     * @return {} n/d
     */
    stopWaiting:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.waitingObj) {
                liquid.waitingObj.style.display = 'none';
            }
        }
    },
    getRootLiquid(liquid) {
        var rootLiquid = liquid;
        while(rootLiquid.srcLiquid) rootLiquid = rootLiquid.srcLiquid;
        return rootLiquid;
    },            
    getRootSourceControlId(liquid) {
        var srcLiquidControlId = liquid.controlId;
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
    addForeignTable:function(liquid, foreignTableObj, sourceForeignTable, sourceLiquidControlId, sourceForeignTablesIndexes1B) {
        if(!isDef(liquid.foreignTables)) 
            liquid.foreignTables = [];
        if(!(liquid.foreignTables instanceof Array)) liquid.foreignTables = [];
        if(isDef(sourceForeignTable)) {
            foreignTableObj.sourceForeignTable = sourceForeignTable;
            foreignTableObj.sourceLiquidControlId = sourceLiquidControlId;
        }
        // source index : the multilevel index of foreigntable definition relative to rootLiquid.tableJsonSource.foreignTables
        foreignTableObj.sourceForeignTablesIndexes1B = sourceForeignTablesIndexes1B;
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
                Liquid.addForeignTable(liquid, foreignTableObj.foreignTables[i], foreignTableObj, foreignTableObj.controlId, [ sourceForeignTablesIndexes1B, i+1 ] );
            }
        }
    },
    setForeignTablesDisableCascade:function(obj) {
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
                Liquid.setForeignTableMode(liquidRoot, foreignTable.tabId, foreignTable, mode);
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
    setForeignTablesModeCascade:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(liquid.homeTabId))
                Liquid.setForeignTableMode(liquid, liquid.homeTabId, null, "");
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
                    Liquid.setForeignTableMode(liquid, liquid.foreignTables[i].tabId, liquid.foreignTables[i], mode);
                }
            }
        }
    },
    setForeignTableMode:function(liquid, tabId, foreignTable, mode) {
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
                var tabId = obj.id; // liquid.controlId + ".foreignTable." + ftId;
                if(liquid.lastForeignTabSelected)
                    liquid.lastForeignTabSelected.className = "";
                liquid.lastForeignTabSelected = obj.parentNode;
                obj.parentNode.className = "liquidTabSel";
                if(liquid.lastForeignTabObjSelected) {
                    document.getElementById(liquid.lastForeignTabObjSelected.id + ".content").style.display = "none";
                }
                liquid.lastForeignTabObjSelected = obj;
                var controlIdForeignTable = "";
                var contentIdForeignTable = obj.id + ".content";
                var contentIdForeignTableObj = document.getElementById(contentIdForeignTable);
                if(contentIdForeignTableObj) {
                    if(!isDef(liquid.tableJson.transition)) {
                        jQ1124( contentIdForeignTableObj ).fadeIn( "normal", function(){ Liquid.onForeignTablePostProcess(obj); });
                    } else if(liquid.tableJson.transition === 'slide') {
                        jQ1124( contentIdForeignTableObj ).slideDown( "fast", function(){ Liquid.onForeignTablePostProcess(obj); });
                    } else if(liquid.tableJson.transition === 'fade') {
                        jQ1124( contentIdForeignTableObj ).fadeIn( "fast", function(){ Liquid.onForeignTablePostProcess(obj); });
                    } else {
                        contentIdForeignTableObj.style.display = "";
                        Liquid.onForeignTablePostProcess(obj);
                    }
                }                
            }
        }
    },
    onForeignTablePostProcess:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nameItems = obj.id.split(".");
            if(nameItems.length > 2) {
                var ftId = nameItems[2];
                var tabId = obj.id; // liquid.controlId + ".foreignTable." + ftId;
                var controlIdForeignTable = "";
                var contentIdForeignTable = obj.id + ".content";
                var contentIdForeignTableObj = document.getElementById(contentIdForeignTable);

                delete liquid.tableJson.currentForeignTable;
                for(var i=0; i<liquid.FTTabList.length; i++) {
                    if(liquid.FTTabList[i].tabId == tabId) {
                        controlIdForeignTable = liquid.FTTabList[i].controlId;
                        liquid.currentForeignTable = i;
                    }
                }                
                // is any pending for targetLiquid
                if(controlIdForeignTable) {
                    var targetLiquid = Liquid.getLiquid(controlIdForeignTable);
                    if(targetLiquid) {
                        if(!targetLiquid.resizeCounter) {
                            Liquid.onResize( targetLiquid );
                        }
                        if(targetLiquid != liquid) {
                            if(isDef(targetLiquid.tableJson.layouts)) {
                                var nodes = targetLiquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                                var forceRefresh = false;
                                if(!nodes.length || !isDef(targetLiquid.tableJson.autoSelect)) {
                                    // missing row selection and following events
                                    forceRefresh = true;
                                }
                                Liquid.refreshPendingLayouts(targetLiquid, forceRefresh);
                            }
                        }
                    }
                }
                // rsize columns
                Liquid.processLinkedLiquidForResize(liquid, nameItems[2]);
                // Update the caption
                Liquid.updateCaption(liquid);
            }
        }
    },
    setCurrentForeignTable:function(obj, currentForeignTable) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            for(var it=0; it<liquid.FTTabList.length; it++) {
                if(typeof currentForeignTable === 'string') {
                    if(liquid.FTTabList[it].name === currentForeignTable) {
                        Liquid.onForeignTable(document.getElementById(liquid.FTTabList[it].tabId));
                        break;
                    }
                } else if(typeof currentForeignTable === 'number') {                            
                    if(it === currentForeignTable) {
                        Liquid.onForeignTable(document.getElementById(liquid.FTTabList[it].tabId));
                        break;
                    }
                }
            }                        
        }
    },
    //
    // show foreignTable content by changing its parent
    //
    setParentForeignTable:function(obj, currentForeignTable, newParentId) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var foundTab1B = 0;
            for(var it=0; it<liquid.FTTabList.length; it++) {
                if(typeof currentForeignTable === 'string') {
                    if(liquid.FTTabList[it].name === currentForeignTable) {
                        foundTab1B = it+1;
                        break;
                    }
                } else if(typeof currentForeignTable === 'number') {                            
                    if(it === currentForeignTable) {
                        foundTab1B = it+1;
                        break;
                    }
                }
            }
            if(foundTab1B) {
                var tabId = liquid.FTTabList[foundTab1B-1].tabId;
                var contentId = liquid.FTTabList[foundTab1B-1].contentId;
                var contentObj = document.getElementById(contentId);
                if(!isDef(liquid.FTTabList[foundTab1B-1].originalParent))
                    liquid.FTTabList[foundTab1B-1].originalParent = contentObj.parentNode;
                if(obj instanceof HTMLElement) {
                    // is a layout fields ?
                    var linkedRow1B = obj.getAttribute('linkedrow1b');
                    var linkedId = obj.getAttribute('linkedid');
                    if(linkedId) {
                        if(isDef(newParentId)) {
                            newParents = document.getElementsByName(newParentId);
                            for(var ip=0; ip<newParents.length; ip++) {
                                if(newParents[ip].getAttribute('linkedrow1b') === linkedRow1B) {
                                    if(isDef(liquid.FTTabList[foundTab1B-1].currentParent)) {
                                        if(liquid.FTTabList[foundTab1B-1].currentParent.id === newParents[ip].id) {
                                            jQ1124( contentObj ).slideUp( "fast", function() {} );
                                            liquid.FTTabList[foundTab1B-1].originalParent.appendChild(contentObj);
                                            // liquid.FTTabList[foundTab1B-1].currentParent.style.display = 'none';
                                            if(isDef(liquid.FTTabList[foundTab1B-1].currentParent)) delete liquid.FTTabList[foundTab1B-1].currentParent;
                                            return;
                                        } else {
                                            liquid.FTTabList[foundTab1B-1].currentParent.style.display = 'none';
                                        }
                                    }
                                    newParents[ip].appendChild(contentObj);
                                    liquid.FTTabList[foundTab1B-1].currentParent = newParents[ip];
                                    jQ1124( contentObj ).slideDown( "fast", function() { 
                                        Liquid.onForeignTablePostProcess(contentObj);
                                    } );
                                    newParents[ip].style.display = '';
                                    break;
                                }
                            }
                        } else {
                            liquid.FTTabList[foundTab1B-1].originalParent.appendChild(contentObj);
                            if(isDef(liquid.FTTabList[foundTab1B-1].currentParent)) delete liquid.FTTabList[foundTab1B-1].currentParent;
                        }
                    }
                } else {
                    // restore
                    if(!isDef(newParentId)) {
                        liquid.FTTabList[foundTab1B-1].originalParent.appendChild(contentObj);
                        if(isDef(liquid.FTTabList[foundTab1B-1].currentParent)) delete liquid.FTTabList[foundTab1B-1].currentParent;
                    }
                }
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
    addProperty:function(liquid, ftIndex1B, propName, propJson) {
        try {
            if(ftIndex1B) {
                //
                // update from source the foreignTable
                //
                var foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                if(!isDef(foreignTable.options)) foreignTable.options = { };
                if(!isDef(foreignTable.options[propName])) foreignTable.options[propName] = [];
                foreignTable.options[propName].push( propJson );
                Liquid.setAskForSave(liquid, true);

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
                        foreignTable.options[propName].push( propJson );
                        Liquid.setAskForSave(sourceLiquid, true);
                    } else {
                        console.error("ERROR : source "+propName+" add failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                    }
                } else {
                    console.error("ERROR : source "+propName+" add failed .. source foreign table not indexed");
                }
                // for reflecting the modify by rebuild
                liquid.tableJsonSource[propName].push( propJson );
                
            } else {
                //
                // direct update
                //
                liquid.tableJsonSource[propName].push( propJson );
                Liquid.setAskForSave(liquid, true);
            }
        } catch(e) {
            console.error("ERROR: addProperty failed, error:"+e);
        }
    },
    updateProperty:function(liquid, ftIndex1B, propName, propIndex, propJson) {
        try {
            if(ftIndex1B) {
                //
                // update from source the foreignTable
                //
                var foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                if(!isDef(foreignTable.options)) foreignTable.options = { };
                if(!isDef(foreignTable.options[propName])) foreignTable.options[propName] = [];
                if(!isDef(foreignTable.options[propName][propIndex])) foreignTable.options[propName][propIndex] = {};
                Liquid.overlayObjectContent(foreignTable.options[propName][propIndex], propJson);
                Liquid.setAskForSave(liquid, true);

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
                        Liquid.overlayObjectContent(foreignTable.options[propName][propIndex], propJson);
                        Liquid.setAskForSave(sourceLiquid, true);
                    } else {
                        console.error("ERROR : source "+propName+" update failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                    }
                } else {
                    console.error("ERROR : source "+propName+" update failed .. source foreign table not indexed");
                }
                // for reflecting the modify by rebuild
                Liquid.overlayObjectContent(liquid.tableJsonSource[propName][propIndex], propJson);
                
            } else {
                //
                // direct update
                //
                Liquid.overlayObjectContent(liquid.tableJsonSource[propName][propIndex], propJson);
                Liquid.setAskForSave(liquid, true);
            }
        } catch(e) {
            console.error("ERROR: updateProperty failed, error:"+e);
        }
    },
    // get the source of the object to update, maybe foreign table ...
    getSourceProperty:function(liquid, ftIndex1B, propName, propIndex) {
        try {
            if(ftIndex1B) {
                // update from source the foreignTable
                var sourceForeignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                if(sourceForeignTable) {
                    if(!isDef(sourceForeignTable.options)) {
                        alert("WARNING: unsupported condition .. please check me");
                        return null;
                    } else {
                        return [ sourceForeignTable.controlId, sourceForeignTable.options[propName][propIndex] ];
                    }
                }
            } else if(isDef(liquid.sourceData) && isDef(liquid.sourceData.rootControlId)) {
                // update from the foreign table the source
                if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                    var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                    if(sourceLiquid) {
                        var sourceForeignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                        if(sourceForeignTable) {
                            if(!isDef(sourceForeignTable.options)) {
                                alert("WARNING: unsupported condition .. please check me");
                                return null;
                            } else {
                                return [ sourceLiquid.controlId, sourceForeignTable.options[propName][propIndex] ];
                            }
                        } else {
                            console.error("ERROR : source "+propName+" get failed .. source foreign table on control '"+liquid.sourceData.rootControlId+"' not found");
                        }
                    } else {
                        console.error("ERROR : source "+propName+" get failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                    }
                } else {
                    console.error("ERROR : source "+propName+" get failed .. source foreign table not indexed");
                }
                
            } else {
                // direct update
                return [ liquid.controlId, liquid.tableJsonSource[propName][propIndex] ];
            }
        } catch(e) {
            console.error("ERROR: updateProperty failed, error:"+e);
        }
    },
    is_asset_active:function(jsonObject, asset) {
        if(jsonObject) {
            if(isDef(jsonObject.assets)) {
                for(var i=0; i<jsonObject.assets.length; i++) {
                    
                }
            }
        }
    },
    handleFormText:function(childNode) {
        if(childNode.name.toLowerCase() === 'redirect' || childNode.id.toLowerCase() === 'redirect') {
            if(childNode.value === '' || childNode.value === './') {
                return btoa(window.location.href);
            } else if(childNode.value === '/') {
                return btoa(window.location.origin);
            } else {
                return btoa(childNode.value);
            }
        } else {
            return btoa(childNode.value);
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
        var nameItems = propName.split(".");
        if(nameItems.length > 1) {
            for(var i=0; i<nameItems.length-1; i++) {
                if(!isDef(targetObj[nameItems[i]])) targetObj[nameItems[i]] = {};
                targetObj = targetObj[nameItems[i]];
                propName = nameItems[i+1]
            }
        }
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
                            	
                                /*
                                 var s1 = evt.target.result.length;
                            	var t1 = performance.now();
                            	var zipped = gzip.zip(evt.target.result);
                            	var s2 = zipped.length;
                                */
                                
                            	// queue.propValue = "base64,"+Base64.encode(zipped);
                            	// queue.propValue = "binaryData,"+zipped.length+":"+zipped;
                            	// queue.propValue = "base64,"+btoa(zipped);
                            	queue.propValue = "base64,"+btoa(evt.target.result);                            	
                            	var t2 = performance.now();
                            	var s3 = queue.propValue.length;
                            	// console.log("ZIP time:"+(t2-t1)/1000.0 + " sec, size:"+s1 / 1024 +" / "+s2/1024+" / "+s3/1024 + " Kb, ratio:"+(s3/s1 * 100.0)+"%")
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
                            	var eventParams = Liquid.buildCommandParams(liquid, event, null);
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
                                    var eventParams = Liquid.buildCommandParams(liquid, event, null);
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
    //
    // Event callback
    //
    onEventOnReadyStateChange:function(liquid, xhr) { // event callback
        if(xhr.readyState === 4) {
            if(xhr.status === 200) {
                var event = xhr.params.event;
                var obj = xhr.params.obj;
                if(isDef(event)) {
                    if(event.clientAfter === true || event.clientBefore === false) {
                        Liquid.executeClientSide(liquid, "event:"+event.name, event.client, event.params, event.isNative);
                    }                                
                }                                
                try {
                    var httpResultJson = null;
                    if(xhr.responseText !== null && xhr.responseText !== 'null') {
                        try {
                            var responseText = Liquid.getXHRResponse(xhr.responseText);
                            httpResultJson = JSON.parse(responseText);
                        } catch (e) {
                            httpResultJson = null;
                            console.error("response:"+responseText);
                            console.error("ERROR : onEventProcess() : errore in response process:"+e+" on event "+event.name+" on control "+liquid.controlId);
                        }

                        if(isDef(event)) event.response = httpResultJson;
                        if(httpResultJson) {
                            if(event.name === 'onGetSelection') {
                                try {
                                    liquid.ids = httpResultJson.ids;
                                    Liquid.setNodesSelected(liquid, liquid.ids);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            if(isDef(httpResultJson.client)) {
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
                                        Liquid.resetMofifications(liquid);

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
                                        Liquid.resetMofifications(liquid);
                                    }
                                }
                            }
                            if(ids) {
                                if(ids.length) {
                                    Liquid.loadData(liquid, ids, "onEventProcess");
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
                    console.error(xhr.responseText);
                    console.error("onEventProcess() . error in response process:" + e  + " on event "+event.name+" on control "+liquid.controlId);
                }
            } else {
                console.error("onEventProcess() . wrong response:" + xhr.status);
            }
            // excuting callback
            if(isDef(liquid.curEvent)) {
                if(isDef(liquid.curEvent.eventCallback)) {
                    retVal = liquid.curEvent.eventCallback(liquid.curEvent.eventCallbackParams, httpResultJson);
                }
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
                    
                liquid.curEvent = { name:event.name, eventCallback:callback, eventCallbackParams:callbackParams };

                var params = [];

                //
                // native parameters of the events ...
                //
                var eventBuiltInParams = (event.params ? JSON.parse(JSON.stringify(event.params)) : null);
                if(eventBuiltInParams) {
                    if(!Array.isArray(eventBuiltInParams)) {
                        eventBuiltInParams = [ eventBuiltInParams ];
                    }
                    // Every row must be an object
                    for(var ip=0; ip<params.length; ip++) {
                        // N.B.: it's already processed and putted inside eventData
                        if(typeof params[ip] !== 'object') {
                            // params[ip] = { name:params[ip], data:"" };
                        } else {
                        }
                    }
                }
                //
                // N.B.: EventData come from event.params, so is the parameters resolved at runtime
                //
                if(isDef(eventData)) params.push( { data: eventData } );
                if(isDef(eventParams)) {
                    for(var ip=0; ip<eventParams.length; ip++) {
                        params.push( eventParams[ip] );
                    }
                }
                
                /*
                if(event.sync === true) {
                } else {
                }
                */
                  
                // Send the request
                Liquid.sendRequest(
                      liquid
                    , { event:event, obj:obj }
                    , 'POST'
                    , glLiquidServlet 
                            + '?operation=exec'
                            + '&className=' + encodeURI(event.server)
                            + '&clientData=' + encodeURI(JSON.stringify(event))
                            + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                    , (event.sync === true ? false : true)
                    , "{\"params\":" + JSON.stringify(params) + "}"
                    , Liquid.onEventOnReadyStateChange                    
                    , "event "+event.name+" on "+liquid.controlId
                    , function(param, e){ Liquid.onTransferUploading(param, event, "Event", e, event.onUploading, event.onUploadingParam); }
                    , function(param, e){ Liquid.onTransferDownloading(param, event, "Event", e, event.onDownloading, event.onDownloadingParam); }
                    , function(param, e){ Liquid.onTransferLoaded(param, event, "Event", e, event.onLoad, event.onLoadParam); }
                    , function(param, e){ Liquid.onTransferFailed(param, event, "Event", e, event.onError, event.onErrorParam); }
                    , function(param, e){ Liquid.onTransferAbort(param, event, "Event", e, event.onAbort, event.onAbortParam); }
                            );
                
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
    command:function(obj, commandName) { // aux entry
        return Liquid.onCommand(obj, commandName);
    },
    onCommand:function(obj, commandName) { // aux entry
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(isDef(liquid.tableJson)) {
                liquid.gridOptions.api.stopEditing();
                if(liquid.tableJson.commands) {
                    for(var icmd = 0; icmd < liquid.tableJson.commands.length; icmd++) {
                        var command = liquid.tableJson.commands[icmd];
                        if(commandName === command.name) {
                            command.step = Liquid.CMD_EXECUTE;
                            var eventName = "before" + commandName;
                            var eventData = null;
                            var defaultRetval = null;
                            var bAlwaysCallback = true;
                            var liquidCommandParams = Liquid.buildCommandParams(liquid, command, obj);
                            eventName = eventName.toCamelCase();
                            Liquid.onEvent(obj, eventName, eventData, Liquid.onCommandStart, liquidCommandParams, defaultRetval, bAlwaysCallback);
                            command.step = 0;
                        }
                    }
                }
            } else if(isDef(liquid.menuJson)) {
                var event = null;
                if(liquid.menuCommands) {
                    for(var i=0; i<liquid.menuCommands.length; i++) {
                        if(liquid.menuCommands[i].name === commandName) {
                            var command = liquid.menuCommands[i];
                            Liquid.openCloseParentCommand(liquid, command, null, event);
                            if(liquid.menuJson.closeParent===true || command.closeParent === true) {
                                Liquid.closeAllPopupMenuCommand(liquid, event);
                            }
                            return Liquid.onButton(liquid, command);
                        } else if(liquid.menuCommands[i].name + "-rollback" === commandName) {
                            var command = liquid.menuCommands[i].rollbackCommand;
                            return Liquid.onButton(liquid, command);
                        }
                    }
                }
            }
        }
    },
    //
    // Command callback
    //
    onCommandOnReadyStateChange:function(liquid, xhr) {
        if(xhr.readyState === 4) { // command callback
            Liquid.release_xhr(liquid);
            var obj = xhr.params.obj;
            var command = xhr.params.command;
            var liquidCommandParams = xhr.params.liquidCommandParams
            var httpResultJson = null;                                

            if(xhr.status === 200) {
                try {
                    // \b \f \n \r \t
                    var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
                    responseText = Liquid.getXHRResponse(responseText);
                    httpResultJson = JSON.parse(responseText);
                    command.response = liquidCommandParams.response = httpResultJson;
                    if(httpResultJson) {
                        if(httpResultJson.client) {
                            Liquid.executeClientSide(liquid, "command response:"+command.name, httpResultJson.client, liquidCommandParams, command.isNative);
                        }
                        Liquid.processXHRMessagesFromServer(liquid, httpResultJson, command, true, false, false, false);

                        if(isDef(httpResultJson.details)) {
                            Liquid.processXHRMessagesFromServer(liquid, httpResultJson.details, command, true, false, false, false);
                        }
                        if(isDef(httpResultJson.details)) {
                            for(var id=0; id<httpResultJson.details.length; id++) {
                                var detail = httpResultJson.details[id];
                                if(isDef(detail.tables)) {
                                    for(var it=0; it<detail.tables.length; it++) {
                                        if(isDef(detail.tables[it])) {
                                            Liquid.processXHRMessagesFromServer(liquid, detail.tables[it], command, true, false, false, false);
                                        }
                                    }
                                }
                                if(isDef(detail.foreignTables)) {
                                    for(var it=0; it<detail.foreignTables.length; it++) {
                                        if(isDef(detail.foreignTables[it])) {
                                            Liquid.processXHRMessagesFromServer(liquid, detail.foreignTables[it], command, true, false, false, false);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error(xhr.responseText);
                    console.error("onCommandStart() : error in response of command '"+command.name+"' : " + e);
                    alert("Error in response of command '"+command.name+"' : "+e+"\n\nPlease check server side code...");
                }
                if(command.client) {
                    if(command.clientAfter === true || command.clientBefore === false) {
                        Liquid.executeClientSide(liquid, "command:"+command.name, command.client, liquidCommandParams, command.isNative);
                    }
                }                                
            } else if(xhr.status === 404) {
                alert("Servlet Url is wrong : \""+glLiquidServlet+"\" was not found\n\nPlease set the variable \"glLiquidRoot\" to a correct value...\n\nShould be : glLiquidRoot=<YourAppURL>");
                console.error("onCommandStart() . wrong servlet url:" + glLiquidServlet);
            } else {
                console.error("onCommandStart() . wrong response:" + xhr.status);
            }

            Liquid.stopWaiting(liquid);
            retVal = Liquid.onCommandDone(liquidCommandParams);
            if(obj) obj.disabled = false;
        }
    },            
    onCommandStart:function(liquidCommandParams) {
        var liquid = liquidCommandParams.liquid;
        var obj = liquidCommandParams.obj;
        var command = liquidCommandParams.command;
        var params = liquidCommandParams.params;
        var async = isDef(command) ? (isDef(command.async) ? command.async : true) : true;
        var retVal = true;
        
        if(command.server) {
            Liquid.registerOnUnloadPage();

            try {
                if(obj) obj.disabled = true;
                Liquid.startWaiting(liquid);
                if(command.client) {
                    if(command.clientAfter !== true || command.clientBefore === true) {
                        Liquid.executeClientSide(liquid, "command:"+command.name, command.client, liquidCommandParams, command.isNative);
                    }
                }

                // Informazioni sul comando
                var commandData = { name:command.name, server:command.server, clientAfter:command.clientAfter, 
                                    img:command.img, size:command.size, text:command.text, labels:command.labels, isNative:command.isNative
                                    };
                var clientData = JSON.stringify(commandData);
                
                if(!async) {
                    if(isDef(obj)) {
                        obj.filter = "grayscale(.5) opacity(0.5) blur(3px)";
                        obj.disabled = true;
                        obj.style.pointerEvents = 'none';
                    }
                }

                // Send the request
                Liquid.sendRequest(
                      liquid
                    , { liquidCommandParams: liquidCommandParams, command:command, obj:obj }
                    , 'POST'
                    , glLiquidServlet 
                        + '?operation=exec'
                        + '&className=' + encodeURI(command.server)
                        + '&clientData=' + encodeURI(clientData)
                        + '&controlId=' + (liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : ""))
                        + '&owner=' + (typeof liquid !== 'undefined' && liquid ? (typeof liquid.tableJson !== 'undefined' && liquid.tableJson ? liquid.tableJson.owner : "" ) : "")
                    , async
                    , "{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}"
                    , Liquid.onCommandOnReadyStateChange
                    , "command "+command.name+" on "+liquid.controlId
                    , function(param, e){ Liquid.onTransferUploading(param, command, "Command", e, command.onUploading, command.onUploadingParam); }
                    , function(param, e){ Liquid.onTransferDownloading(param, command, "Command", e, command.onDownloading, command.onDownloadingParam); }
                    , function(param, e){ Liquid.onTransferLoaded(param, command, "Command", e, command.onLoad, command.onLoadParam); }
                    , function(param, e){ Liquid.onTransferFailed(param, command, "Command", e, command.onError, command.onErrorParam); }
                    , function(param, e){ Liquid.onTransferAbort(param, command, "Command", e, command.onAbort, command.onAbortParam); }
                            );

            } catch (e) {
                console.error("ERROR : onCommandStart() : "+e);
                if(obj) obj.disabled = false;
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
            } else if(command.name === "update") {
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
        var async = isDef(command) ? (isDef(command.async) ? command.async : true) : true;
        
        if(command.name) {
            var eventName = "after" + command.name + "";
            try {
                eventName = eventName.toCamelCase();
                Liquid.onEvent(obj, eventName, null, null);
            } catch (e) {
                console.error(e);
            }
        }
        
        if(!async) {
            if(isDef(obj)) {
                obj.filter = "";
                obj.disabled = false;
                obj.style.pointerEvents = '';
            }
        }
        
        var refreshAllDone = false;
        var refreshDone = false;
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
                            if(command.response.details) {
                                for(var id=0; id<command.response.details.length; id++) {
                                    if(command.response.details[id].foreignTables) {
                                        if(command.response.details[id].foreignTables.length > 0) {
                                            needFullUpdate = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        if(needFullUpdate) {
                        } else {
                            // Process result ids to read from server
                            ids = [];
                            Liquid.process_ids_to_reload(liquid, command, ids );
                            // check if is modification of adding node
                            for(var im = 0; im < liquid.modifications.length; im++) {
                                var modification = liquid.modifications[im];
                                if(modification) {
                                    if(modification.nodeId) {
                                        // if(ids.indexOf(modification.rowId) < 0) {
                                        if(liquid.addingNode) {
                                            if(liquid.addingNode.__objectId === modification.nodeId) {
                                                if(ids) {
                                                    if(ids.length) {
                                                        var primaryKeyField = liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1";
                                                        var newId = (typeof ids[0] === 'number' ? ids[0].toString() : ids[0]);
                                                        var oldId = liquid.addingNode.data[primaryKeyField];
                                                        liquid.addingRow[primaryKeyField] = liquid.addingNode.data[primaryKeyField] = newId;
                                                        // update the selection to newId
                                                        if(isDef(liquid.selection.exclude)) {
                                                            var index = liquid.selection.excludeObjectId.indexOf(modification.nodeId);
                                                            if(index >= 0) liquid.selection.exclude[index] = newId;
                                                        }
                                                        if(isDef(liquid.selection.include)) {
                                                            var index = liquid.selection.includeObjectId.indexOf(modification.nodeId);
                                                            if(index >= 0) liquid.selection.include[index] = newId;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if(!isDef(liquid.tableJson.isSystem) || !liquid.tableJson.isSystem) {
                            // Not system table
                            if(command.name === "delete") {
                                // remove node
                                if(command.response.details) {
                                    // cause row reselection and grid/layout refresh
                                    Liquid.onDeletedRow(liquid);
                                    refreshDone = true;
                                }
                            } else {
                                if(command.name === "insert") {
                                    // remove node if add rec ord failed
                                    if(ids === null || ids.length === 0) {
                                        var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                                        console.warn(res);
                                    } else { 
                                        // Increase nRows manually
                                        liquid.nRows++;
                                    }
                                }
                                // reset addingNode/Row
                                liquid.addingNode = null;
                                liquid.addingRow = null;
                                
                                // Re-enable all foreign tables children of
                                Liquid.setForeignTablesModeCascade(liquid);
                                
                                // Process result ids to read from server
                                if(isDef(ids) && ids.length > 0) {
                                    Liquid.loadData(liquid, ids, "onCommandDone");
                                    refreshDone = true;
                                }
                            }                    
                        } else {
                            // system control : recordset is at runtime
                        }
                        Liquid.resetMofifications(liquid);
                    }
                }
                if(!refreshDone) {
                    if(command.name === "insert") { 
                        //
                        // Process result ids to read from server
                        //
                        Liquid.process_ids_to_reload(liquid, command, [] );
                        if(ids) {
                            if(ids.length) {
                                Liquid.loadData(liquid, ids, "onCommandDone");
                            }
                        }
                    } else if(command.name === "delete") {
                        Liquid.onDeletedRow(liquid);
                    }
                }
                if(command.name === "insert") { 
                    liquid.addingNode = null;
                    liquid.addingRow = null;
                } else if(command.name === "delete") { 
                    liquid.deletingNodes = null; 
                }
            } else {
                //
                // Custom command
                //
                // Process result ids to read from server
                //
                if(command.response) {
                    if(command.response.details) {
                        // Process result ids to read from server
                        Liquid.process_ids_to_reload(liquid, command, [] );
                        if(ids) {
                            if(ids.length) {
                                Liquid.loadData(liquid, ids, "onCommandDone");
                            }
                        }
                    }
                }
            }
        } else {
            // system control : recordset is at runtime
            if(command.name === "delete") {
                if(command.response.details)
                    Liquid.onDeletedRow(liquid);
            } else {
                if(command.name === "insert") {
                    if(ids === null || ids.length === 0) {
                        if(!isSystem) { // not system control
                            var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                            console.error("LIQUID : Inserting operation failed on server : ids empty");
                            console.warn(res);
                        }
                    }
                    // reset addingNode/Row
                    liquid.addingNode = null;
                    liquid.addingRow = null;
                }
            }
        }
        // command started with gui, but closed with script, or layout need to rebuild by template changes : restore command bar and layout
        // TODO : may be optimized ... layouts need to build only current updating row
        if(isDef(liquid.currentCommand) || isDef(liquid.needLayoutRebuild)) {
            if(liquid.currentCommand.name === command.name) {
                Liquid.onButton(liquid, { name:"return" });
                refreshAllDone = true;
            }
        }

        if(!refreshAllDone) {
            // force refresh
            if(liquid instanceof LiquidCtrl) {
                Liquid.refreshAll(liquid, null, "onCommandDone");
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
                        if(command.response.details instanceof Array) {
                            details = command.response.details;
                        } else {
                            details = [ command.response.details ];
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
                                                }
                                                if(!detail.tables[it].ids || !detail.tables[it].ids.length) {
                                                    if(command.name === "insert") {
                                                        // inserted record in foreign table. but no id generated : reloading...
                                                        Liquid.loadData(liquid, null, "reloading all rows after insert (no ids returned)");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if(detail.foreignTables) {
                                    for(var it=0; it<detail.foreignTables.length; it++) {
                                        if(!detail.foreignTables[it].ids || !detail.foreignTables[it].ids.length) {
                                            if(command.name === "insert") {
                                                // inserted record in foreign table. but no id generated : reloading...
                                            }
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
                            if(isDef(grid.columns)) {
                                for(var i=0; i<grid.columns.length; i++) {
                                    var obj = document.getElementById(grid.columns[i].linkedContainerId);
                                    var col = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B - 1] : null;
                                    if(col)
                                        col.isChecked = true;
                                    if((typeof grid.columns[i].required !== 'undefined' && grid.columns[i].required)
                                            || (isDef(col) && col.required)) {
                                        if(obj) {
                                            obj.style.borderColor = "";
                                            if(obj.value === null || obj.value === '') {
                                                obj.style.borderColor = "red";
                                                obj.style.borderWidth = "1px";
                                                obj.style.borderStyle = "solid";
                                                if(col)
                                                    col.isValidated = false;
                                                retVal = false;
                                            } else {
                                                if(col)
                                                    col.isValidated = true;
                                            }
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
                                    msg += liquid.tableJson.columns[ic].name + " is required but it's empty or null\n";
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
        return (command.isNative || command.name === "rollback" || command.name === "update-rollback" || command.name === "insert-rollback" || command.name === "delete-rollback" || command.name === "return");
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
        var focusedLiquidZIndex = 0;
        var detectedFocus = false;
        var liquidsToClose = [];
        var liquidFocused = [];
        for(var i=0; i<glLiquids.length; i++) {
            if(glLiquids[i] instanceof LiquidCtrl) {
                if(glLiquids[i].mode === 'lookup') {
                    if(glLiquids[i].status === 'open' && glLiquids[i].tableJson.keepOpen !== true) {
                        if((glLiquids[i].popupCaptionObj && glLiquids[i].popupCaptionObj.contains(e.target))
                        || (glLiquids[i].lookupObj && glLiquids[i].lookupObj.contains(e.target))
                        || (glLiquids[i].filtersObj && glLiquids[i].filtersObj.contains(e.target))
                        || (glLiquids[i].navObj && glLiquids[i].navObj.contains(e.target))
                        || (glLiquids[i].aggridContainerObj && glLiquids[i].aggridContainerObj.contains(e.target))
                        || (glLiquids[i].lookupContainerComboContent && glLiquids[i].lookupContainerComboContent.contains(e.target))
                        ) {
                            detectedFocus = true;
                            liquidFocused.push(glLiquids[i]);
                        } else {
                            liquidsToClose.push(glLiquids[i]);
                        }
                    }
                }
                // removing parent liquid from queue
                if(glLiquids[i].outDivObj && glLiquids[i].outDivObj.contains(e.target)) {
                    var bProcess = true;
                    if(isDef(focusedLiquid)) { // privilege lookups
                        if(focusedLiquid.mode === 'lookup' && glLiquids[i].mode !== 'lookup') bProcess = false;
                    }
                    if(bProcess) {
                        focusedLiquid = glLiquids[i];
                        while(focusedLiquid.srcLiquid) focusedLiquid = focusedLiquid.srcLiquid;
                    }
                }
            } else if(glLiquids[i] instanceof LiquidMenuXCtrl) {
                var liquid = glLiquids[i];
                Liquid.closeAllPopupMenuCommand(liquid, e);
            }
        }
        // prevent parent to be closed
        for(var i=0; i<liquidFocused.length; i++) {
            if(liquidFocused[i].mode === 'lookup') {
                if(liquidFocused[i].status === 'open' && liquidFocused[i].tableJson.keepOpen !== true) {
                    if(isDef(liquidFocused[i].sourceData)) {
                        if(isDef(liquidFocused[i].sourceData.parentLiquidId)) {
                            var srcLiquid = Liquid.getLiquid(liquidFocused[i].sourceData.parentLiquidId);
                            if(srcLiquid) {
                                var index = liquidsToClose.indexOf(srcLiquid);
                                if(index>=0) {
                                    liquidsToClose.splice(index, 1);
                                }
                            }
                        }
                    }
                }
            }
        }
        for(var i=0; i<liquidsToClose.length; i++) {
            Liquid.onCloseLookup(liquidsToClose[i]);
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
                                    var clientCode = null;
                                    try { clientCode = atob(clients[i]); } catch(e) { clientCode = clients[i]; }
                                    try { 
                                        retVal = eval(clientCode);
                                    }  catch(e) { 
                                        if(isNative===true) {} else { 
                                            console.error("ERROR: on control:"+liquid.controlId+" at "+sourceDesciption+"\nAn error occours in function:'" + clientCode+"' ..\nError:"+e); 
                                        } 
                                    }
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
    addMirrorEvent:function(liquid, node) {
        if(liquid) {
            if(node) {
                if(!isDef(liquid.mirrorEvents)) {
                    liquid.mirrorEvents = [];
                }
                for(var i=0; i<liquid.mirrorEvents.length; i++) {
                    if(liquid.mirrorEvents[i].id == node.id) {
                        liquid.mirrorEvents[i].tick = getCurrentTimetick();
                        return true;
                    }
                }
                liquid.mirrorEvents.push( { id:node.id, tick:getCurrentTimetick() } );
                return true;
            }
        }
        return false;
    },
    isMirrorEvent:function(liquid, node) {
        if(isDef(liquid.mirrorEvents)) {
            var tick = getCurrentTimetick();
            for(var i=0; i<liquid.mirrorEvents.length; i++) {
                if(liquid.mirrorEvents[i].id == node.id) {
                    if( tick - liquid.mirrorEvents[i].tick < Liquid.mirrorEventIntervalNs) {
                        return true;
                    } else {
                        if(Liquid.debug) {
                            console.warn("Misrror event delta : "+(tick - liquid.mirrorEvents[i].tick) + " / " + Liquid.mirrorEventIntervalNs);
                        }
                        liquid.mirrorEvents.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        return false;
    },
    setNodesSelected:function(obj, ids) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            return Liquid.setNodesSelectedByColumn(obj, liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1", ids)
        }
    },
    setNodesSelectedByColumn:function(obj, field, columnValues, setVisible) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
            var selectedList = [];
            var alreadySelected = [];
            var hasSetSetVisible = false;
            var selectionChanged = false;
            // N.B.: to store mirror events correctly first unselect, after select
            if(isDef(nodes) && nodes.length > 0) {
                for(var i=0; i<nodes.length; i++) {
                    var nodeId = nodes[i].data[field];
                    var bUnselect = false;
                    var bDetected = false;
                    for(var iv=0; iv<columnValues.length; iv++) {
                        if(columnValues[iv] === nodeId) {
                            bDetected = true;
                            if(!nodes[i].isSelected()) {
                                selectedList.push(i);
                                selectionChanged = true;
                            } else {
                                alreadySelected.push(i);
                            }
                            break;
                        }
                    }
                    if(!bDetected) {
                        if(nodes[i].isSelected()) {
                            if(selectedList.indexOf(i) < 0) {
                                // if adding node lookuop initially set to emty for avoiding close lookup on unselect current row
                                Liquid.addMirrorEvent(liquid, nodes[i]);
                                nodes[i].setSelected(false);
                                selectionChanged = true;
                            }
                        }
                    }
                }
                if(selectedList && selectedList.length) {
                    for(var is=0; is<selectedList.length; is++) {
                        var i = selectedList[is];
                        liquid.lastSelectedId = nodes[i].id;
                        Liquid.addMirrorEvent(liquid, nodes[i]);
                        nodes[i].setSelected(true);
                        if(!hasSetSetVisible) {
                            hasSetSetVisible = true;
                            if(isDef(setVisible)) {
                                liquid.cRow = i; // help avoiding closing on unselect
                                liquid.gridOptions.api.ensureIndexVisible(nodes[i].rowIndex, "top"); 
                                liquid.gridOptions.api.setFocusedCell(i, 'start', 'top');
                            }
                        }
                    }
                } else {
                    if(alreadySelected && alreadySelected.length) {
                        var i = alreadySelected[0];
                        if(isDef(setVisible)) {
                            liquid.cRow = i; // help avoiding closing on unselect
                            liquid.gridOptions.api.ensureIndexVisible(nodes[i].rowIndex, "top"); 
                            liquid.gridOptions.api.setFocusedCell(i, 'start', 'top');
                        }
                    }
                }
                
                if(selectionChanged) {
                    // any selection changed
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
     * @param {selctionInfoObject} the object defining the selection ([0] list of ids selected, [1] = ALL - list of ids unselected)
     * @return the descrition (string)
     */
    getSelectionDescription:function(selctionInfoObject) {
        var desc = "";
        var selLabel = Liquid.lang === 'eng' ? ("selected") : ("selezionate" );
        if(selctionInfoObject) {
            if(selctionInfoObject.selectionKey.length) {
                var selection = selctionInfoObject.selectionKey.split(",");
                if(Array.isArray(selection)) {
                    var nSel = selection.length;
                    if(nSel == 1) {
                        if(isDef(selctionInfoObject.columns)) {
                            var liquid = selctionInfoObject.liquid;
                            var rowFields = Liquid.getSelectedLiquidRow(liquid);
                            if(rowFields) {
                                for(var ic=0; ic<selctionInfoObject.columns.length; ic++) {
                                    var col = Liquid.getColumn(liquid, selctionInfoObject.columns[ic]);
                                    if(col) {
                                        desc += (ic>0 > 0 ? " - " : "") + rowFields[col.name];
                                    }
                                }
                            }
                        } else {
                            desc = "[ "+selection+" ]";
                        }
                    } else {
                        desc = "[ "+nSel+selLabel+(Liquid.lang === 'eng' ? ("selected") : ("selezionate" )) + " ]";
                    }
                }
            } else if(selctionInfoObject.unselectionKey) {
                var selection = elctionInfoObject.unselectionKey.split(",");
                if(Array.isArray(selection)) {                    
                    var nSel = liquid.nRows - sselection.length;
                    if(nSel == 1) {
                        if(isDef(selctionInfoObject.columns)) {
                            desc = Liquid.lang === 'eng' ? "[ ALL except " : "[ TUTTO tranne ";
                            var rowFields = Liquid.getSelectedLiquidRow(selctionInfoObject.liquid);
                            var liquid = selctionInfoObject.liquid;
                            for(var ic=0; ic<selctionInfoObject.columns.length; ic++) {
                                var col = Liquid.getColumn(liquid, selctionInfoObject.columns[ic]);
                                if(col) {
                                    desc += (ic>0 ? " - " : "") + rowFields[col.name];
                                }
                            }
                            desc += " ]";
                        } else {
                            desc = (Liquid.lang === 'eng' ? "[ ALL except " : "[ TUTTO tranne ");
                            desc += selection[0]+" ]";
                        }
                    } else {
                        desc = "[ "+nSel+selLabel+" ]";
                    }
                }
            }
        }
        return desc;
    },
    /**
     * Get the selection
     * @param {liquid} the control id or the class instance (LiquidCtrl)
     * @return [ including list, excluding list ] array
     */
    getSelectedPrimaryKeys:function(liquid) {
        if(liquid) {
            var idsSelected = "";
            var idsUnselected = "";
            if(liquid.selection.all) {
                // working with exclude list
                // N.B.: Resolve anyway the selected, tho the reciver can easy walk
                // idsSelected = "\"*\"";
                idsSelected = "";
                nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                for(var i=0; i<nodes.length; i++) {
                    var value = nodes[i].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
                    if(!isDef(liquid.selection.exclude) || (isDef(liquid.selection.exclude) && !liquid.selection.exclude.contains(value))) {
                        if(idsSelected.length > 0) idsSelected += ",";
                        if(typeof value === 'string') value = value.replace(/"/g, "\\\""); 
                        idsSelected += (value.startsWith('"') ? "" : '"') + value + (value.endsWith('"') ? "" : '"');
                    }
                }
                // escluse list
                for(var i=0; i<liquid.selection.exclude.length; i++) {
                    if(idsUnselected.length > 0) idsUnselected += ",";
                    var value = liquid.selection.exclude[i];
                    if(typeof value === 'string') value = value.replace(/"/g, "\\\""); 
                	idsUnselected += (value.startsWith('"') ? "" : '"') +  + value + (value.endsWith('"') ? "" : '"');
                }
            } else {
                // working with include list
                for(var i=0; i<liquid.selection.include.length; i++) {
                    if(idsSelected.length > 0) idsSelected += ",";
                    var value = liquid.selection.include[i];
                    if(typeof value === 'string') value = value.replace(/"/g, "\\\""); 
                    idsSelected += (value.startsWith('"') ? "" : '"') + value + (value.endsWith('"') ? "" : '"');
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
                    if(!isDef(liquid.parentObj.style.overflow))
                        liquid.parentObj.style.overflow = "auto";
                    if(!liquid.parentObj.classList.contains("liquidWinXContainer")) {
                        liquid.parentObj.classList.add("liquidWinXContainer");
                    }
                    liquid.parentObj.ondrop = function(event) { Liquid.onDrop(event); };
                    liquid.parentObj.ondragover = function(event) { Liquid.onAllowDrop(event); };
                    
                    if(liquid.parentObj.style.position !== 'relative' && liquid.parentObj.style.position !== '' && liquid.parentObj.style.position !== 'absolute') {
                        console.warn("WARNING : Changed position atttrib on HTML element :" + liquid.parentObjId+" on control:"+liquid.controlId);
                        liquid.parentObj.style.position = 'relative';
                    }

    
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
    isParentNode:function(obj, parentObj) {
        var parentNode = obj;
        if(parentNode.id === parentObj.id) return true;
        while ((parentNode = parentNode.parentNode)) {
            if(parentNode.id === parentObj.id) {
                return true;
            }
        }
        return false;
    },            
    getParentObj:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        var parentNode = obj;
        while ((parentNode = parentNode.parentNode)) {
            if(parentNode.classList) {
                if(parentNode.classList.contains('liquidWinXContainer')) {
                    return parentNode;
                }
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
                Liquid.onLayoutMode(liquid.tableJson.layouts[ig].layoutTabObj, null, "readonly");
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
                
                
                // wrap to more specific and already defined command
                if(command.name === "return") {
                    if(isDef(liquid.currentCommand)) {
                        if(liquid.currentCommand.name === "insert" || liquid.currentCommand.name === "update") {
                            command = liquid.currentCommand.rollbackCommand;
                        }
                    }
                } else if(command.name === "insert" || command.name === "update") {
                    // complete a generic command bt missing default fields
                    if(liquid.tableJson.commands) {
                        for(var icmd = 0; icmd < liquid.tableJson.commands.length; icmd++) {
                            var cmd = liquid.tableJson.commands[icmd];
                            if(cmd.name === command.name) {
                                // Liquid.transferProperties(cmd, command, ["server","client","rollback","rollbackObj","rollbackImg","rollbackCommand","linkedLabelObj","isNative","img","size","labels","text","lastGridIndex"]);
                                command = cmd;
                            }
                        }
                    }
                }                    
                
                if(typeof command.step === 'undefined') {
                    command.step = 0;
                    if(isDef(liquid)) {
                        if(isDef(liquid.currentCommand)) { // recovery from current command
                            if(liquid.currentCommand.name === command.name) {
                                command.step = liquid.currentCommand.step;
                            }
                        }
                    }
                }
                
                if(Liquid.isNativeCommand(command)) {
                    if(command.name === "update" || command.name === "delete") {
                        var selNodes = Liquid.getCurNodes(liquid);
                        if(!selNodes || selNodes.length === 0) {
                            var msg = Liquid.lang === 'eng' ? ("No items selected") : ("Nessuna riga selezionata" );
                            Liquid.showToast(Liquid.appTitle, msg, "warning");
                            return;
                        }
                    }
                    if(command.name === "insert" || command.name === "update" || command.name === "delete") {
                        if(isDef(liquid.sourceData)) {
                            if(isDef(liquid.sourceData.liquidOrId)) {
                                var parentLiquid = Liquid.getLiquid(liquid.sourceData.liquidOrId);
                                var selNodes = Liquid.getCurNodes(parentLiquid);
                                if(!selNodes || selNodes.length === 0) {
                                    var msg = Liquid.lang === 'eng' ? ("No items selected on parent") : ("Nessuna riga selezionata in "+parentLiquid.controlId );
                                    Liquid.showToast(Liquid.appTitle, msg, "warning");
                                    return;
                                }
                            }
                        }
                    }
                    
                    if(command.name === "insert" || command.name === "update" || command.name === "delete") {
                        if(command.step===0) {
                            liquid.lastSuppressRowClickSelection = liquid.gridOptions.suppressRowClickSelection;
                            liquid.gridOptions.suppressRowClickSelection = true;
                        }
                    }
                    var gotoGridIndex = null, gotoLayoutIndex = null;
                    if( liquid.lastGridTabObj || (isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) || (isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) ) {
                        var nameItems = null;
                        if(liquid.lastGridTabObj) {
                            nameItems = liquid.lastGridTabObj.id.split(".");
                        } else if(isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) {
                            if(liquid.tableJson.grids[0].id) 
                                nameItems = liquid.tableJson.grids[0].id.split(".");
                        } else if( isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
                            if(liquid.tableJson.layouts[0].id) 
                                nameItems = liquid.tableJson.layouts[0].id.split(".");
                        } else if(liquid.lastGridTabObj) {
                            if(liquid.lastGridTabObj.id) 
                                nameItems = liquid.lastGridTabObj.id.split(".");
                        }
                        if(nameItems) {
                            if(nameItems.length > 2) {
                                if(nameItems[1] === 'grid_tab') {
                                    gotoGridIndex = nameItems[2] - 1 + 1;
                                    if(gotoGridIndex == 0) {
                                        if(isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) {
                                            // go to first grid
                                            gotoGridIndex = 1;
                                        }
                                    }
                                } else if(nameItems[1] === 'layout_tab') {
                                    gotoLayoutIndex = nameItems[2] - 1 + 1;
                                } else {
                                    gotoGridIndex = 0;
                                }
                            }
                        }
                    }
                    if(command.name === "update") { // backup
                        delete liquid.backupNode;
                        var selNodes = Liquid.getCurNodes(liquid);
                        if(selNodes) {
                            if(selNodes.length) {
                                liquid.backupNodeData = deepClone(selNodes[0].data);
                                liquid.backupNode = selNodes[0];
                            }
                        }
                    }                    
                    if(command.name === "insert-rollback") {
                        if(liquid.addingNode) {
                            var res = liquid.gridOptions.api.updateRowData({remove: [liquid.addingRow]});
                            console.warn(res);
                            liquid.addingNode = null;
                            if(isDef(liquid.cRowBeforeAdding)) liquid.cRow = liquid.cRowBeforeAdding;
                            if(isDef(liquid.nodesBeforeAdding) && liquid.nodesBeforeAdding.length) {
                                for(var i=0; i<liquid.nodesBeforeAdding.length; i++) {
                                    liquid.nodesBeforeAdding[i].setSelected(true);
                                }
                                setTimeout(function() { liquid.gridOptions.api.ensureIndexVisible(liquid.cRowBeforeAdding, "top"); liquid.cRowBeforeAdding = null; }, 250 );
                                liquid.nodesBeforeAdding = null;
                            }
                        }
                        liquid.addingRow = null;
                        // refresh row on grid and layouts
                        Liquid.refreshGrids(liquid, null, "rollback");
                        Liquid.resetLayoutsContent(liquid, true);
                        Liquid.refreshLayouts(liquid, true);
                        Liquid.refreshDocuments(liquid);
                        Liquid.refreshCharts(liquid);
                        command.step = Liquid.CMD_EXECUTE;
                        
                        // Re-enable all foreign tables children of
                        Liquid.setForeignTablesModeCascade(liquid);
                        
                        
                        
                    } else if(command.name === "update-rollback") {
                        if(isDef(liquid.backupNode)) {
                            Liquid.addMirrorEvent(liquid, liquid.backupNode);
                            for(var field in liquid.backupNode.data) {
                                liquid.backupNode.setDataValue(field, liquid.backupNodeData[field]);
                            }
                        }
                        Liquid.resetMofifications(liquid);
                        
                        delete liquid.backupNode;
                        command.step = Liquid.CMD_EXECUTE;
                        
                    } else if(command.name === "return") {
                        // command as service invoked from the case user invcoke command by script 
                        command.step = 0;
                        Liquid.restoreCommands(liquid);
                        Liquid.hideCommandsRollbackButton(liquid, liquid.commandsObj);
                        
                        liquid.currentCommand = null;
                        
                        // restore layout flags
                        if(isDef(liquid.tableJson.layouts)) {
                            for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                var layout = liquid.tableJson.layouts[il];
                                if(layout.rowsContainer) {
                                    for(var ir=0; ir<layout.rowsContainer.length; ir++) {
                                        layout.rowsContainer[ir].isUpdating = false;
                                        layout.rowsContainer[ir].isAdding = false;
                                    }
                                }
                            }
                        }
                        // refreshing
                        Liquid.refreshGrids(liquid, null, "return");
                        Liquid.resetLayoutsContent(liquid, true);
                        Liquid.refreshLayouts(liquid, true);
                        Liquid.refreshDocuments(liquid);
                        Liquid.refreshCharts(liquid);
                        
                        // set readonly mode
                        if(isDef(liquid.tableJson.grids)) {
                            for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                                Liquid.onGridMode(liquid.tableJson.grids[ig].gridObj, "readonly");
                            }
                        }
                        if(isDef(liquid.tableJson.layouts)) {
                            for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                var layout = liquid.tableJson.layouts[il];
                                Liquid.onLayoutMode(layout.layoutTabObj, null, "readonly");
                            }
                        }
                        Liquid.resetMofifications(liquid);
                        return;
                        
                    } else if(command.name === "filter") {
                        Liquid.onExecuteFilter(liquid);
                        return;
                    } else if(command.name === "next" || command.name === "previous") {
                        command.step = 0;
                        // avoid lokkup close
                        if(liquid.mode === 'lookup') liquid.dontCloseLookup = true;
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
                            Liquid.stopFlashingFields();
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
                            var result = Liquid.onEvent(obj, "onInserting", liquid.addingRow, function(liquid, result) { Liquid.onPreparedRow(liquid, true); }, liquid, defaultValue, bAlwaysCallback);
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
                            /*
                            Liquid.refreshGrids(liquid, null, "post-delete");
                            Liquid.refreshLayouts(liquid);
                            Liquid.refreshDocuments(liquid);
                            Liquid.refreshCharts(liquid);
                            */
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
                            mode = "delete";
                        if(!Liquid.isRollbackCommand(command)) {
                            command.curGridIndex = gotoGridIndex;
                            if(isDef(liquid.tableJson.grids) && liquid.tableJson.grids.length > 0) {
                                if(gotoGridIndex < 0) gotoGridIndex = 0;
                                for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                                    Liquid.onGridMode(liquid.tableJson.grids[ig].gridTabObj, mode);
                                }
                                if(gotoGridIndex !== null) {
                                    if(gotoGridIndex>=0) {
                                        if(gotoGridIndex != liquid.currentTab) {
                                            Liquid.onGridTab( document.getElementById(liquid.tabList[gotoGridIndex].id) );
                                            command.restoreView = true;
                                        }
                                    }
                                }
                            }
                            if(isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
                                for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                    if(liquid.tableJson.layouts[il].currentRow1B) {
                                        Liquid.onLayoutMode(liquid.tableJson.layouts[il].layoutTabObj, liquid.tableJson.layouts[il].currentRow1B-1, mode);
                                    }
                                }
                            }
                            
                            command.curLayoutIndex = gotoLayoutIndex;
                            if(isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
                                if(gotoLayoutIndex < 0) gotoLayoutIndex = 0;
                                // set isUpdating flag in the layouts row
                                if(command.name === "update") {
                                    var templateIndex = 2;
                                    for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                        var layout = liquid.tableJson.layouts[il];
                                        if(isDef(layout.templateRows[templateIndex].source)) {
                                            if(layout.templateRows[0].source != layout.templateRows[templateIndex].source) {
                                                if(layout.rowsContainer) {
                                                    if(layout.currentRow1B) {
                                                        layout.currentCommandRow1B = layout.currentRow1B;
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].isUpdating = true;
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].isAdding = false;
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].incomingSource = layout.templateRows[templateIndex].source;
                                                        Liquid.refreshLayout(liquid, layout, false);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if(command.name === "insert") {
                                    nRows = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren.length;
                                    for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                        var layout = liquid.tableJson.layouts[il];
                                        layout.currentCommandRow1B = nRows;
                                    }
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
                        if(command.restoreView) Liquid.onGridTab(liquid.listGridTabObj);
                        Liquid.restoreGrids(liquid);
                        Liquid.restoreLayouts(liquid);
                        Liquid.restoreCommands(liquid);
                        if(Liquid.isNativeCommand(command)) {
                            if(command.rollbackCommand)
                                if(command.rollbackCommand.linkedObj)
                                    command.rollbackCommand.linkedObj.style.display = 'none';
                        }                        
                        //
                        // restoring the layout
                        //
                        if(isDef(liquid.tableJson.layouts) && liquid.tableJson.layouts.length > 0) {
                            var templateIndex = 0;
                            if(command.name === "update" || command.name === "update-rollback") templateIndex = 2;
                            if(command.name === "insert" || command.name === "insert-rollback") templateIndex = 1;
                            for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                                var layout = liquid.tableJson.layouts[il];
                                if(isDef(layout.templateRows[templateIndex].source)) {
                                    if(layout.templateRows[0].source != layout.templateRows[templateIndex].source) {
                                        if(layout.rowsContainer) {
                                            if(layout.currentCommandRow1B) {
                                                if(layout.rowsContainer) {
                                                    if(layout.rowsContainer[layout.currentCommandRow1B-1]) {
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].isUpdating = false;
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].isAdding = false;
                                                        layout.rowsContainer[layout.currentCommandRow1B-1].incomingSource = layout.templateRows[0].source;
                                                        Liquid.refreshLayout(liquid, layout, true);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if(Liquid.isRollbackCommand(command)) {
                        command.step = 0;
                        if(command.linkedCmd) {
                            command.linkedCmd.step = 0;
                            if(command.linkedCmd.linkedLabelObj)
                                command.linkedCmd.linkedLabelObj.innerHTML = (isDef(command.linkedCmd.text) ? command.linkedCmd.text : "");
                            if(command.name === "insert-rollback") {
                                /* Duplicate with record change */
                            } else {
                                Liquid.restoreGrids(liquid);
                                Liquid.restoreLayouts(liquid);
                                Liquid.refreshGrids(liquid, null, "rollback");
                                Liquid.refreshLayouts(liquid);
                                Liquid.refreshDocuments(liquid);
                                Liquid.refreshCharts(liquid);
                            }                                
                            if(command.linkedCmd.restoreView) Liquid.onGridTab(liquid.listGridTabObj);
                        }
                        
                        Liquid.restoreCommands(liquid);
                        liquid.currentCommand = null;
                        if(command.linkedObj)
                            command.linkedObj.style.display = 'none';
                        Liquid.onEvent(obj, "onRollback", liquid.addingRow);
                        
                        Liquid.resetMofifications(liquid);
                        return;
                    }
                } else {
                    command.step = Liquid.CMD_EXECUTE;
                }
                if(command.step === Liquid.CMD_EXECUTE) {
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command, obj);
                    Liquid.onCommandStart(liquidCommandParams);
                    command.step = 0;
                }
            }
        }
    },
    // get the HTML Element owning the value
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
    getItemInputObj:function(obj) {
        return Liquid.getItemLookupObj(obj, "");
    },
    getItemSourceObj:function(obj) {
        return Liquid.getItemLookupObj(obj, ".source");
    },
    getItemResetObj:function(obj) {
        return Liquid.getItemLookupObj(obj, ".reset");
    },
    getItemReloadObj:function(obj) {
        return Liquid.getItemLookupObj(obj, ".reload");
    },
    getItemLookupObj:function(obj, postFix) {
        var itemObj = obj.linkedObj;
        if(itemObj) {
            if(itemObj.dataset) {
                if(isDef(itemObj.dataset.linkedInputId)) {
                    return document.getElementById(itemObj.dataset.linkedInputId+postFix);
                }
            }
            if(isDef(postFix)) {
                return document.getElementById(itemObj.id+postFix);
            } else {
                return itemObj;
            }
        }
    },
    getColumnsField:function(obj, name) {
        var col = Liquid.getColumn(obj, name);
        if(col)
            return col.field;
        return null;
    },
    getColumn:function(obj, name) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid)
            if(liquid.tableJson)
                if(liquid.tableJson.columns)
                    return Liquid.getColumnFromColumns(liquid.tableJson.table, liquid.tableJson.columns, name);
        return null;
    },
    getColumnFromColumns:function(table, columns, name) {
        if(isDef(columns)) {
            if(isDef(name)) {
                var fullName = table + "." + name;
                for(var ic=0; ic<columns.length; ic++)
                    if(typeof columns[ic] === 'object') {
                        if(columns[ic].name === name || columns[ic].name === fullName)
                            return columns[ic];
                        else if(table + "." + columns[ic].name === name)
                            return columns[ic];
                        else if(columns[ic].field === name)
                            return columns[ic];
                    } else if(typeof columns[ic] === 'string') {
                        if(columns[ic] === name || columns[ic] === fullName)
                            return columns[ic];
                        else if(table + "." + columns[ic] === name)
                            return columns[ic];
                    }
                // Now insensitive case
                name = name.toUpperCase();
                fullName = isDef(fullName) ? fullName.toUpperCase() : name;
                for(var ic=0; ic<columns.length; ic++) {
                    if(typeof columns[ic] === 'object') {
                        if(columns[ic].name.toUpperCase() === name || columns[ic].name.toUpperCase() === fullName)
                            return columns[ic];
                        else if(isDef(table) && table.toUpperCase() + "." + columns[ic].name.toUpperCase() === name)
                            return columns[ic];
                    } else if(typeof columns[ic] === 'string') {
                        if(columns[ic].toUpperCase() === name || columns[ic].toUpperCase() === fullName)
                            return columns[ic];
                        else if(table + "." + columns[ic].toUpperCase() === name)
                            return columns[ic];
                    }
                }
            }
        }
    },
    getColumnByField:function(obj, field) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid)
            if(liquid.tableJson)
                if(liquid.tableJson.columns)
                    for(var ic=0; ic<liquid.tableJson.columns.length; ic++)
                        if(liquid.tableJson.columns[ic].field === field)
                            return liquid.tableJson.columns[ic];
        return null;
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
                        field = "Field: " + nameItems[1] + "\n";
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
                tooltipField += "Label: "+(isDef(col.label)?col.label:"N/D") + "\n";
                tooltipField += "type: "+col.typeName + "\n";
                tooltipField += "size: "+(isDef(col.size)?Liquid.bytesToSize(col.size):"N/D") + "\n";
                tooltipField += "digits: "+(isDef(col.digits)?col.digits:"N/D") + "\n";
                tooltipField += "nullable: "+(isDef(col.nullable)?col.nullable:"N/D") + "\n";
                tooltipField += "default: "+(isDef(col.default)?col.default:"N/D") + "\n";
                tooltipField += "autoIncString: "+(isDef(col.autoIncString)?col.autoIncString:"N/D") + "\n";
                tooltipField += "remarks: "+(isDef(col.remarks)?col.remarks:"N/D") + "\n";
                tooltipField += "required: "+(isDef(col.required)?col.required:"N/D") + "\n";
                if(col.requiredByDB === true) {
                    tooltipField += "required by db: "+(isDef(col.requiredByDB)?col.requiredByDB:"N/D") + "\n";
                }
                tooltipField += "\n";
                tooltipField += "managed as: "+Liquid.getTypeName(col.type) + "(native type:"+col.type+")\n";
                return tooltipField;
            }
        }
        return "";
    },
    getFormElementId:function(formElement) {
        var name = null;
        if(formElement) {
            name = formElement.id ? formElement.id : formElement.name;
            var previd = formElement.getAttribute('previd');
            if(previd) {
                name = previd;
            }
            var names = name.split(".layout.");
            if(names.length > 1) name = names[0];

            var index = name.indexOf("@{");
            if(index>=0) {
                var subKey = name.substring(index+2);
                index = subKey.indexOf("}");
                if(index>=0) {
                    var fieldKey = subKey.substring(0, index);
                    fieldKey = fieldKey.replace(/'/g, "").replace(/"/g, "");
                    name = fieldKey;
                }                                
            }
        }
        return name;
    },            
    getProperty:function(propName) {
        var parts = null, obj = null;
        if(typeof propName === 'string') parts = propName.split('.');
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
                    if(Array.isArray(liquid.srcColumn)) {
                        srcColumns = liquid.srcColumn;
                    } else {
                        srcColumns = [ liquid.srcColumn ];
                    }
                    liquid.srcColumnIndex = [];
                    for(var ic=0; ic<srcColumns.length; ic++) {
                        srcColumn = srcColumns[ic];
                        liquid.srcColumnObj = Liquid.getColumn(liquid.srcLiquid, srcColumn);
                        if(liquid.srcColumnObj) {
                            liquid.srcColumnIndex.push( liquid.srcColumnObj ? liquid.srcColumnObj.field : -1 );
                        }
                    }
                    if(liquid.srcColumnObj) {
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
                var left, top, width, height;
                var lastDisplay = null;
                var lastPos = null;
                var lastLeft = null;
                var nodesVisibilityFitted = [];
                
                if(liquid.mode !== "lookup") {
                    if(liquid.isIconic) {
                        if(liquid.winXStatus !== 'iconic') {
                            if(!liquid.iconicPos) {                            
                                var iconincInfo = Liquid.getIconicCount(liquid.parentObj);
                                liquid.iconicPos = { left:(3 + iconincInfo.x * Liquid.iconincSize.wx), top:(liquid.parentObj.clientHeight - (iconincInfo.y+1) * Liquid.iconincSize.wy-1), width:Liquid.iconincSize.wx, height:Liquid.iconincSize.wy };
                            }
                            left = liquid.iconicPos.left; 
                            top = liquid.iconicPos.top;
                            width = liquid.iconicPos.width;
                            height = liquid.iconicPos.height;
                            liquid.outDivObj.style.position = 'absolute';
                            liquid.outDivObj.style.boxShadow  = '';
                            liquid.outDivObjOverflow = liquid.outDivObj.style.overflow;
                            liquid.outDivObj.style.overflow = 'hidden';
                            liquid.winXStatus = 'iconic';
                            var searchObj = document.getElementById(liquid.controlId+".popup.search");
                            if(searchObj) searchObj.style.display = "none";
                            liquid.outDivObj.style.resize = '';
                            jQ1124( liquid.outDivObj ).animate( { 
                                left: left+'px' 
                                ,top: top+'px'
                                ,width: width+"px"
                                ,height: height+"px"
                            }, 200, function(){ } );
                        }
                    } else if(liquid.isMaximized) {
                        if(liquid.winXStatus !== 'maximized') {
                            if(liquid.winXStatus === '') {
                                if(!liquid.isResizing) {
                                    liquid.outDivObjSize = { y:liquid.outDivObj.offsetTop, x:liquid.outDivObj.offsetLeft, wx:liquid.outDivObj.offsetWidth, wy:liquid.outDivObj.offsetHeight };
                                }
                            }                            
                            liquid.referenceHeightObj = liquid.parentObj;
                            liquid.outDivObj.style.position = 'absolute';
                            if(liquid.parentObj) {
                                width = (liquid.parentObj.offsetWidth-3);
                                height = (liquid.parentObj.offsetHeight-3);
                            } else {
                                width = (document.body.offsetWidth-3);
                                height = (document.body.offsetHeight-3);
                                console.warn("WARNING: controlId"+liquid.controlId+" hs no parent...");
                            }
                            left = 0;
                            top = 0;
                            if(liquid.outDivObjOverflow) liquid.outDivObj.style.overflow = liquid.outDivObjOverflow;
                            liquid.outDivObj.style.boxShadow  = '0 0px 0px rgba(0,0,0,0)';
                            liquid.winXStatus = 'maximized';
                            var searchObj = document.getElementById(liquid.controlId+".popup.search");
                            if(searchObj) searchObj.style.display = "";
                            liquid.outDivObj.style.resize = '';
                            liquid.isAnimating = true;
                            jQ1124( liquid.outDivObj ).animate( { 
                                left: left+'px' 
                                ,top: top+'px'
                                ,width: width+"px"
                                ,height: height+"px"
                            }, 200, function(){ liquid.isAnimating = false; } );
                        } else {
                            if(!liquid.isAnimating) {
                                if(liquid.parentObj) {
                                    liquid.outDivObj.style.left = "0px";
                                    liquid.outDivObj.style.top = "0px";
                                    liquid.outDivObj.style.width = (liquid.parentObj.offsetWidth - 3) + "px";
                                    liquid.outDivObj.style.height = (liquid.parentObj.offsetHeight - 3) + "px";
                                }
                            }
                        }
                        
                    } else {
                        if(liquid.winXStatus !== '') {
                            if(liquid.outDivObjSize) {
                                liquid.outDivObj.style.position = 'absolute';
                                left = liquid.outDivObjSize.x;
                                top = liquid.outDivObjSize.y;
                                width = (liquid.outDivObjSize.wx);
                                height = (liquid.outDivObjSize.wy);
                                liquid.outDivObj.style.boxShadow  = '';
                                if(liquid.outDivObjOverflow) liquid.outDivObj.style.overflow = liquid.outDivObjOverflow;
                                var searchObj = document.getElementById(liquid.controlId+".popup.search");
                                if(searchObj) searchObj.style.display = "";
                                liquid.outDivObj.style.resize = liquid.tableJson.resize;
                                jQ1124( liquid.outDivObj ).animate( { 
                                    left: left+'px' 
                                    ,top: top+'px'
                                    ,width: width+"px"
                                    ,height: height+"px"
                                }, 200, function(){ } );
                                
                            }
                            liquid.winXStatus = '';
                        } else {
                            if(liquid.outDivObj)
                                liquid.outDivObjSize = { y:liquid.outDivObj.offsetTop, x:liquid.outDivObj.offsetLeft, wx:liquid.outDivObj.offsetWidth, wy:liquid.outDivObj.offsetHeight };
                        }
                    }
                                      
                    liquid.referenceHeightObj = liquid.outDivObj;
                    if(liquid.referenceHeightObj) {
                        referenceHeight = liquid.referenceHeightObj.clientHeight;
                        if(referenceHeight <= 0) {
                            if(!liquid.isResizing) {

                                // liquid.pendingResize = true;
                                // return;
                            
                                // try fitting visibility
                                var node = liquid.referenceHeightObj.parentNode;
                                while(isDef(node)) {
                                    if(node.style) {
                                        if(node.style.display === 'none') {
                                            nodesVisibilityFitted.push( { node:node, visibility:node.style.visibility } );
                                            node.style.display = 'block';
                                            node.style.visibility = 'hidden';
                                        }
                                    }
                                    node = node.parentNode;
                                    if(node.nodeName === "HTML") break;
                                }
                                referenceHeight = liquid.referenceHeightObj.clientHeight;
                                for(var inode=0; inode<nodesVisibilityFitted.length; inode++) {
                                    nodesVisibilityFitted[inode].node.style.display = 'none';
                                    nodesVisibilityFitted[inode].node.style.visibility = nodesVisibilityFitted[inode].visibility;
                                }
                                if(referenceHeight <= 0) {
                                    if(Liquid.debug) {
                                        console.warn("ERROR: on control '" + liquid.controlId + "' : unable to resize, reference height is invalid (" + referenceHeight+")");
                                    }
                                    liquid.pendingResize = true;
                                    return;
                                }
                            }
                        }
                        
                        lastDisplay = liquid.referenceHeightObj.style.display;
                        lastPos = liquid.referenceHeightObj.style.position;
                        lastLeft = liquid.referenceHeightObj.style.left;
                        if(liquid.referenceHeightObj.clientHeight <= 0) {
                            liquid.referenceHeightObj.style.display = "block";
                            liquid.referenceHeightObj.style.position = "absolute";
                            liquid.referenceHeightObj.style.left = "+9999em";
                        }
                        
                    } else {
                        console.error("ERROR: on control '" + liquid.controlId + "' : unable to resize, reference object not detected");
                        liquid.pendingResize = true;
                        return;
                    }
                } else {
                    var lookupHeight = null;
                    if(isNaN(liquid.lookupHeight)) {
                        if(typeof liquid.lookupHeight === 'string') {
                            if(liquid.lookupHeight.indexOf("%") > 0) {
                                lookupHeight = liquid.outDivObj.offsetHeight;
                            } else {
                                lookupHeight = liquid.lookupHeight.replace(/[^0-9]/g,'');
                            }
                        }
                    } else {
                        lookupHeight = liquid.lookupHeight;
                    }
                    if(!isNaN(lookupHeight)) {
                        referenceHeight = Number(lookupHeight);
                    } else {
                        console.error("ERROR:  on control '" + liquid.controlId + "' : undetected lookup height:" + liquid.lookupHeight);
                    }
                }
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
                
                if(liquid.outDivObj.offsetWidth > 0 || liquid.outDivObj.offsetHeight > 0) {
                    if(isDef(liquid.outDivObjSize)) {
                        if(isDef(liquid.outDivObjSize.x)) liquid.tableJson.left = liquid.tableJsonSource.left = liquid.outDivObjSize.x+'px';
                        if(isDef(liquid.outDivObjSize.y)) liquid.tableJson.top = liquid.tableJsonSource.top = liquid.outDivObjSize.y+'px';
                        if(isDef(liquid.outDivObjSize.wx)) liquid.tableJson.width = liquid.tableJsonSource.width = (liquid.outDivObjSize.wx)+'px';
                        if(isDef(liquid.outDivObjSize.wy)) liquid.tableJson.height = liquid.tableJsonSource.height = (liquid.outDivObjSize.wy)+'px';
                    }
                }
                
                liquid.commandsObjHeight = Liquid.getPrecomputedHeight(liquid.commandsObj);
                liquid.filtersObjHeight = Liquid.getPrecomputedHeight(liquid.filtersObj);
                liquid.gridTabsObjHeight = Liquid.getPrecomputedHeight(liquid.gridTabsObj);
                liquid.navObjHeight = Liquid.getPrecomputedHeight(liquid.navObj);
                liquid.actionsObjHeight = Liquid.getPrecomputedHeight(liquid.actionsObj);

                if(referenceHeight > 0) {
                    var gridTabsHeight = Number( (liquid.gridTabsObj ? (liquid.gridTabsObjHeight ? liquid.gridTabsObjHeight : 0) : 0) );
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

                    if(liquid.aggridContainerObj) {
                        if(!isDef(liquid.aggridContainerDocked) || liquid.aggridContainerDocked === false) {
                        liquid.aggridContainerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                            if(liquid.referenceHeightObj) {
                                if(liquid.AAA === "testGrid4 - mode:undefined - div:testGrid4") debugger;
                                if(liquid.referenceHeightObj.offsetHeight !== referenceHeight) { // something escaped                                
                                    var gap = liquid.referenceHeightObj.offsetHeight - referenceHeight;
                                    if(gap<=4) {
                                        aggridContainerHeight -= gap;
                                        liquid.aggridContainerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                                    }
                                }
                            }
                            liquid.aggridContainerHeight = aggridContainerHeight;
                        }
                        liquid.resizeCounter++;
                    }
                    // if(liquid.controlId === 'testGrid7') debugger;
                    // put the docker to fixed height (container of tabs list/grids/layout
                    if(liquid.dockerTbl) {
                        liquid.dockerTbl.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight+gridTabsHeight : "0") + "px";
                    }
                    
                } else {
                    liquid.needResize = true;
                }
                if(liquid.referenceHeightObj) {
                    if(isDef(lastDisplay)) liquid.referenceHeightObj.style.display = lastDisplay;
                    if(isDef(lastPos)) liquid.referenceHeightObj.style.position = lastPos;
                    if(isDef(lastLeft)) liquid.referenceHeightObj.style.left = lastLeft;
                }
                
                if(liquid.foreignTables) {
                    var foreignTableContainerHeight = Number(aggridContainerHeight) 
                            + Number(isDef(liquid.navObj) ? liquid.navObjHeight : 0)
                            + Number(isDef(liquid.commandsObj) ? liquid.commandsObjHeight : 0)
                            + Number(isDef(liquid.filtersObj) ? liquid.filtersObjHeight : 0)
                            + Number(isDef(gridTabsHeight) ? gridTabsHeight : 0)
                            + Number(isDef(liquid.multiPanelsHeight) ? liquid.multiPanelsHeight : 0)
                            + Number(isDef(liquid.actionsObj) ? liquid.actionsObjHeight : 0)
                            ;
                    for(var ig = 0; ig < liquid.foreignTables.length; ig++) {
                        if(liquid.foreignTables[ig].contentObj)
                            liquid.foreignTables[ig].contentObj.style.height = (foreignTableContainerHeight > 0 ? foreignTableContainerHeight : "0") + "px";
                    }
                }
                
                if(liquid.dockerTblCenter) {
                    if(liquid.mode != 'lookup') {
                        if(liquid.outDivObj.offsetWidth > 0) {
                            liquid.dockerTblCenter.style.width = (liquid.outDivObj.offsetWidth - liquid.dockerTblRight.offsetWidth - liquid.dockerTblLeft.offsetWidth) + "px";
                        }
                    }
                }
                
                if(liquid.tableJson.grids) {
                    for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                        if(liquid.tableJson.grids[ig].containerObj) {
                            liquid.tableJson.grids[ig].containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                        }
                        Liquid.onGridResize(liquid, liquid.tableJson.grids[ig]);
                    }
                }
                if(liquid.tableJson.layouts) {
                    for(var ig = 0; ig < liquid.tableJson.layouts.length; ig++) {
                        if(liquid.tableJson.layouts[ig].containerObj)
                            Liquid.onLayoutResize(liquid, liquid.tableJson.layouts[ig]);
                    }
                }
                if(liquid.tableJson.documents) {
                    for(var ig = 0; ig < liquid.tableJson.documents.length; ig++) {
                        if(liquid.tableJson.documents[ig].containerObj)
                            Liquid.onDocumentResize(liquid, liquid.tableJson.documents[ig]);
                    }
                }
                if(liquid.tableJson.charts) {
                    for(var ig = 0; ig < liquid.tableJson.charts.length; ig++) {
                        if(liquid.tableJson.charts[ig].containerObj)
                            Liquid.onChartResize(liquid, liquid.tableJson.charts[ig]);
                    }
                }
            } else if(liquid instanceof LiquidMenuXCtrl) {
                if(liquid.stateClose === false && liquid.stateMoving === false) {
                    Liquid.setMenuIcon(liquid.menuIconObj, liquid, liquid.outDivObj, liquid.menuIconObj, liquid.stateClose, false);
                }
            }
            
            delete liquid.pendingResize;
        }
    },
    onVisible:function(objOrId) {
        if(objOrId) {
            setTimeout(function(){ Liquid.onVisibleProcess(objOrId); }, 50);
        }
    },
    onVisibleProcess:function(objOrId) {
        var obj = objOrId;
        if(typeof objOrId === 'string') obj = document.getElementById(objOrId);
        if(obj instanceof HTMLElement) {
            if(obj.childNodes) {
                for(var i=0; i<obj.childNodes.length; i++) {
                    if(obj.childNodes[i].nodeType === 1) {
                        var o = obj.childNodes[i];
                        var controlId = o.getAttribute("controlId");
                        if(controlId) {
                            Liquid.onResize(o);
                        } else {
                            if(o.childNodes) 
                                Liquid.onVisible(o);
                        }
                    }
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
    lookupMouseOver:function(e) {
        if(this.classList.contains("liquidLookup")) {
            if(obj.disabled !== false) return;
        }
    },
    lookupMouseOut:function(e) {
        if(this.classList.contains("liquidLookup")) {
            if(obj.disabled !== false) return;
        }
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
    hideCommandsRollbackButton(liquid, parentObj) {
        if(liquid) {
            if(parentObj) {
                if(isDef(liquid.tableJson.commands)) {
                    for(var i=0; i<liquid.tableJson.commands.length; i++) {
                        var command = liquid.tableJson.commands[i];
                        if(isDef(command.name)) {
                            if(command.linkedLabelObj)
                                command.linkedLabelObj.innerHTML = (isDef(command.text) ? command.text : "");
                            if(isDef(command.rollbackObj)) {
                                jQ1124( command.rollbackObj ).slideUp( "fast", function() {} );
                            }
                        }
                    }
                }
            }
        }
    },
    onCommandBarClickDeferred:function(event) {
        var obj = this;
        setTimeout(function() {
            Liquid.onCommandBarClickProcess(obj, event);
        }, 100);
    },
    onCommandBarClick:function(event) {
        return Liquid.onCommandBarClickProcess(this, event);
    },
    onCommandBarClickProcess:function(obj, event) {
        var nameItems = obj.id.split(".");
        if(nameItems.length > 2) {
            var cmdName = nameItems[2];
            var liquid = Liquid.getLiquid(obj);
            if(liquid) {
                try {
                    if(isDef(liquid.gridOptions)) {
                        if(isDef(liquid.gridOptions.api)) {
                            var editingcells = liquid.gridOptions.api.getEditingCells();
                            if(editingcells && editingcells.length) {
                                liquid.gridOptions.api.stopEditing();
                                liquid.pendingCommand = {commandBar: true, commandName: cmdName, obj: obj};
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
                    jQ1124( command.commandsContainer ).slideDown( "fast", function() {
                        command.commandsContainer.style.display = '';
                        command.isOpen = true;
                    });
                }
            } else {
                index = liquid.lastMenuPopup.indexOf(command);
                if(index >= 0) {
                    liquid.lastMenuPopup.splice( index, 1 );
                }
                jQ1124( command.commandsContainer ).slideUp( "fast", function() {
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
                            if( (event && event.target && event.target.id !== objId) || event == null)
                                Liquid.onGridRefreshField(liquid, grid, gridObj, data, "dep");
                        } else if(isDef(col.dependencies[id].layoutName)) {
                            var layout = Liquid.getLayoutByName(liquid, col.dependencies[id].layoutName);
                            var iRow = col.dependencies[id].iRow;
                            var obj = document.getElementById(col.dependencies[id].objId);
                            if(iRow===0)
                                if(event && event.target !== obj)
                                    Liquid.setLayoutField(liquid, layout, obj, iRow, false);
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
    dumpControlId:function() {
        for (var i = 0; i < glLiquids.length; i++) {
            console.error(" control #"+(i+1)+" : "+glLiquids[i].controlId+" - DB: "+glLiquids[i].database+"."+glLiquids[i].schema+"."+glLiquids[i].table);
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
            
            var innerHTML = "";

            // var filterId = liquid.controlId + ".filters." +filterGroupIndex+"."+ filterObj.runtimeName + ".filter";
            var onkeyupCode = "";
            var onChangeCode = " onchange=\"";
            onChangeCode += "this.setAttribute('rel',this.value);";

            if (liquid.tableJson.filterMode == 'client' || liquid.tableJson.filterMode == "dynamic") {
                onChangeCode +="Liquid.onFilterChange(event, '"+filterObj.linkedContainerId+"');";
                onkeyupCode = " onkeyup=\"Liquid.onFilterChange(event, '"+filterObj.linkedContainerId+"');\" ";
            }
            onChangeCode += "\"";



            if(isDef(parentNode)) {                
                innerHTML = "<table style=\"width:100%; table-layout:fixed\"><tr>"
                                    + "<td class=\"liquidFilterLabel\" id=\""+(liquid.controlId+".filters."+filterGroupIndex+"."+filterObj.name+".label")+"\">" + Liquid.getFilterLabel(liquid, filterObj) + "</td>"
                                    + "<td class=\"liquidFilterInputTd\" id=\""+(liquid.controlId+".filters."+filterGroupIndex+"."+filterObj.name+".td")+"\">";
            }

            if(filterObj.valuesList || filterObj.values) {
                var values = filterObj.valuesList ? filterObj.valuesList : filterObj.values;
                innerHTML += "<select id=\"" + filterObj.linkedContainerId + "\"" + onkeyupCode + onChangeCode + " style=\"width:97%\" class=\"liquidSelect\" >";
                for(var i=0; i<values.length; i++) {
                    var valueObj = values[i];
                    if(valueObj) {
                        var selected = "";
                        if(valueObj.value === filterObj.value || (valueObj.selected === true) )
                            selected = "selected";
                        innerHTML += "<option " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " value=\"" + ( isDef(valueObj.value) ? valueObj.value : valueObj.label) + "\" " + selected + ">" + (valueObj.label ? valueObj.label : valueObj.value) + "</option>";
                    }
                }
                innerHTML += "</select>" + "</td>"
                            + "<td class=\"liquidFilterImg\">"
                            + "<div style=\"width:24px;\"></div>"
                            + "</td>";
            } else if(filterObj.editor) {
                var values = filterObj.editor.values ? filterObj.values : filterObj.editorValues;
                innerHTML += "<select id=\"" + filterObj.linkedContainerId + "\"" + onkeyupCode + onChangeCode + " style=\"width:97%\" class=\"liquidSelect\" >";
                for(var i=0; i<values.length; i++) {
                    var valueObj = values[i];
                    if(valueObj) {
                        var selected = "";
                        if(valueObj.value === filterObj.value || (valueObj.selected === true) )
                            selected = "selected";
                        innerHTML += "<option " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " value=\"" + (valueObj.value ? valueObj.value : valueObj.label) + "\" " + selected + ">" + (valueObj.label ? valueObj.label : valueObj.value) + "</option>";
                    }
                }
                innerHTML += "</select>"
                        + "</td>"
                        + "<td class=\"liquidFilterImg\">"
                        + "<div style=\"width:24px;\"></div>"
                        + "</td>";
            } else {
                if(!filterObj.lookup || typeof filterObj.lookup === 'undefined') {
                    var tooltip = Liquid.lang === 'eng' ? "Get all dinstinct values" : "Ottiene tutti i valori distinti";
                    var searchCode = "<img id=\"" + liquid.controlId + "." + filterObj.name + ".filter.search\" " +
                        "class=\"liquidFilterBt\" " +
                        "title=\""+tooltip+"\" " +
                        "src=\""+Liquid.getImagePath("search.png")+"\" " +
                        "onClick=\"Liquid.onSearchControl(this, '" + filterObj.name + "', '" + filterObj.linkedContainerId + "')\" " +
                        "style=\"padding-top:1; cursor:pointer; filter: grayscale(0.85);\" width=\"16\" height=\"16\" " +
                        ">";

                    var onMouseDownCode = "";
                    var onBlurCode = "";
                    if(filterObj.comboBox == true || filterObj.combobox == true) {
                        onMouseDownCode = " onmousedown=\"this.setAttribute('rel',this.value); this.placeholder=this.value; this.value =''\"";
                        onBlurCode = " onblur=\"this.value=this.getAttribute('rel');\"";
                    }

                    var tooltip = Liquid.lang === 'eng' ? "Reset filter field" : "Reimposta il filtro";
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputWidth + " " + inputHeight + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                        + " value=\"\" id=\"" + filterObj.linkedContainerId + "\""
                        + " type=\"" + inputType + "\""
                        + " class=\"liquidFilterInput\""
                        + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                        + " data-rel=\"\""
                        + onkeyupCode + onChangeCode
                        + onMouseDownCode
                        + onBlurCode
                        + "/>"
                        + "<div style=\"display:inline-block; margin-left:-22px;\">"
                        + "<img src=\""+Liquid.getImagePath("delete.png")+"\" "
                        + "class=\"liquidFilterBt\" "
                        + "title=\""+tooltip+"\" "
                        + "onClick=\"Liquid.onResetFilter('" + filterObj.linkedContainerId + "')\" "
                        + "style=\"top:4px; right:7px; position:relative; cursor:pointer; filter: grayscale(0.85);\" width=\"16\" height=\"16\">"
                        + "</div>"
                        + "</td>"
                        + "<td class=\"liquidFilterImg\">"
                        + (liquid.tableJson.filtersSearch !== false ? searchCode : "")
                        + "</td>"
                        + "</tr>";
                    
                } else {
                    // lookup created later...
                    innerHTML += "<div id=\"" + filterObj.linkedContainerId + "\"></div>"
                            + "<td class=\"liquidFilterImg\">"
                            + "<div style=\"width:24px;\"></div>"
                            + "</td>";                    ;
                }
            }
            
            if(isDef(parentNode)) {
                innerHTML += "</table>";
                parentNode.innerHTML = innerHTML;
            }
            
            return innerHTML;
        }
        return null;
    },
    createCommandButton:function(liquid, command, className) {
        if(command) {
            var div = document.createElement("div");
            div.className = className+"Button";
            div.style.borderWidth = "1px";
            div.style.borderStyle = "solid";
            div.style.visibility = command.hidden === true ? "hidden" : "";
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
                        var sourceCol = null;
                        var lookupControlId = liquid.controlId + ("filters_"+(i+1)+"_"+filterJson.columns[ic].name).replace(/\./g, "_");
                        if(!Liquid.startLookup(liquid.controlId, sourceCol, lookupControlId, filterJson.columns[ic].linkedContainerId, filterJson.columns[ic].lookup, filterJson.columns[ic].lookupField, filterJson.columns[ic].options, 'filter', "filter field", null)) {
                            // TODO: normal filter?
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
                            var obj = document.getElementById(filterObj.linkedContainerId);
                            Liquid.createDateTimePicker(col, obj, false, liquid, null);
                        }
                    }
                }
            }
        }
    },
    createGrid:function(liquid, grid, id, parentNode) { // Tab List/Grid
        if(liquid) {
            if(grid) {
                var firstCell = null;
                grid.resizeCounter = 0;
                if(isDef(grid.columns)) {
                    for(var ic=0; ic<grid.columns.length; ic++) {
                        if(!isDef(grid.columns[ic].field)) {
                            var iField1B = Liquid.solveGridField(liquid, grid.columns[ic]);
                            if(iField1B > 0) {
                                grid.columns[ic].field = liquid.tableJson.columns[iField1B-1].field;
                                grid.columns[ic].colLink1B = iField1B;
                            } else {
                                if(isDef(grid.columns[ic].query)) { // runtime field
                                } else {
                                    console.error("[LIQUID] Unlinked grid at:" + liquid.controlId + " field:" + grid.columns[ic].name);
                                }
                            }
                        } else {
                            var iCol1B = Number(grid.columns[ic].field);
                            if(iCol1B > 0) {
                                grid.columns[ic].colLink1B = iCol1B + 1;
                            } else {
                                console.error("[LIQUID] Unlinked grid at:" + liquid.controlId + " field:" + grid.columns[ic].name);
                            }
                        }
                    }
                }
                var cellsMap = [];
                var i = 0;
                grid.id = liquid.controlId + ".grid_tab." + id + ".table";
                var tbl = document.createElement("table");
                tbl.cellPadding = 0;
                tbl.cellSpacing = 0;                
                tbl.id = grid.id;
                tbl.style.tableLayout = 'fixed';
                tbl.className = "liquidGridTableContainer";
                if(isDef(grid.height)) tbl.style.height = Liquid.getCSSDim(grid.height);
                if(isDef(grid.width)) tbl.style.width = Liquid.getCSSDim(grid.width);
                var tbody = document.createElement("tbody");
                grid.nRows = grid.nRows ? Number(grid.nRows) : 1;
                grid.nCols = grid.nCols ? Number(grid.nCols) : 1;
                if(isDef(grid.columns)) {
                    for(var c=0; c< grid.columns.length; c++) {
                        if(isDef(grid.columns[c].row)) grid.columns[c].row = Math.floor(grid.columns[c].row);
                        if(isDef(grid.columns[c].col)) grid.columns[c].col = Math.floor(grid.columns[c].col);
                    }
                }
                for(var r = 0; r < grid.nRows; r++) {
                    var tr = document.createElement("tr");
                    tr.className = "liquidGridRow " + (r % 2 ? "liquidGridRowOdd" : "liquidGridRowEven");
                    for(var c = 0; c < grid.nCols; c++) {
                        var td = document.createElement("td");
                        if(!firstCell) firstCell = td;
                        var iList = Liquid.getGridCells(liquid, grid, r, c);
                        td.className = "LiquidGridCellTD";
                        td.id = grid.id + ".row." + (r+1) + ".col."+(c+1)+".label";
                        for(var il=0; il<iList.length; il++) {
                            var i = iList[il];
                            if(isDef(grid.columns)) {
                                if(i >= 0 && i < grid.columns.length) {
                                    var gridObj = grid.columns[i];                            
                                    gridObj.index1B = i + 1;
                                    if(grid.columns[i].label === null || grid.columns[i].label === "null") {
                                        delete td;
                                        td = null;
                                    } else {
                                        Liquid.createGridLabel(liquid, td, grid, grid.columns[i]);
                                        td.id = grid.id + "." + (i + 1) + ".label.container";
                                        if(isDef(grid.columns[i].labelWidth))
                                            td.style.width = Liquid.getCSSDim(grid.columns[i].labelWidth);
                                        if(isDef(grid.columns[i].labelHeight))
                                            td.style.height = Liquid.getCSSDim(grid.columns[i].labelHeight);
                                    }
                                }
                            }
                        }
                        if(td) {
                            tr.appendChild(td);
                            if(Liquid.projectMode) Liquid.setDraggable(td);
                        }
                        td = document.createElement("td");
                        td.className = "LiquidGridCellTD";
                        td.id = grid.id + ".row." + (r+1) + ".col."+(c+1)+".field";
                        for(var il=0; il<iList.length; il++) {
                            var i = iList[il];
                            if(isDef(grid.columns)) {
                                if(i >= 0 && i < grid.columns.length) {
                                    var tdId = grid.id + "." + (i + 1) + ".value.container";
                                    if(cellsMap.indexOf(tdId) >= 0) console.error("ERROR: control:"+liquid.controlId+" grid:"+grid.name+" row:"+(r+1) + " columns:"+(c+1)+" item duplicate");
                                    cellsMap.push(tdId);
                                    td.id = tdId;
                                    if(grid.columns[i].label === null) {
                                        td.colSpan = "2";
                                    }
                                    Liquid.createGridField(liquid, td, grid, grid.columns[i]);
                                    if(isDef(grid.columns[i].width)) {
                                        td.style.width = Liquid.getCSSDim(grid.columns[i].width);
                                        // td.style.display = "block";
                                    }
                                    if(isDef(grid.columns[i].height)) {
                                        td.style.height = grid.columns[i].height;
                                        // td.style.display = "block";
                                    }
                                }
                            }
                        }
                        tr.appendChild(td);
                        if(Liquid.projectMode) Liquid.setDraggable(td);
                    }
                    tbody.appendChild(tr);
                }
                tbl.appendChild(tbody);


                // processing running free items
                if(parentNode) {
                    var freeCellsDiv = document.createElement("div");
                    freeCellsDiv.style.display = "block";
                    freeCellsDiv.style.hieght = "0px";
                    freeCellsDiv.style.position = "absolute";
                    freeCellsDiv.style.left = "0px";
                    freeCellsDiv.style.top = "0px";
                    parentNode.appendChild(freeCellsDiv);
                    if(isDef(grid.columns)) {
                        for(var i=0; i<grid.columns.length; i++) {
                            if(grid.columns[i].row < 0 || grid.columns[i].col < 0) {
                                Liquid.createGridLabel(liquid, freeCellsDiv, grid, grid.columns[i]);
                                Liquid.createGridField(liquid, freeCellsDiv, grid, grid.columns[i]);
                            }
                        }
                    }
                }
                if(isDef(grid.image)) {
                    if(isDef(grid.image.url)) tbl.style.backgroundImage = "url("+grid.image.url+")";
                    if(isDef(grid.image.repeat)) tbl.style.backgroundRepeat = grid.image.repeat;
                    if(isDef(grid.image.size)) tbl.style.backgroundSize = grid.image.size;
                    if(isDef(grid.image.positionX)) tbl.style.backgroundPositionX = grid.image.positionX;
                    if(isDef(grid.image.positionY)) tbl.style.backgroundPositionY = grid.image.positionY;
                } 
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
    createGridLabel:function(liquid, parentNode, grid, gridObj) {
        if(gridObj) {
            var div = document.createElement("div");
            div.id = grid.id + "." + (gridObj.index1B) + ".label.div";
            div.className = "liquidGridTables liquidGridLabel";
            div.innerHTML = (gridObj.label ? gridObj.label : gridObj.name);
            if(isDef(gridObj.labelData)) {
                if(isDef(gridObj.labelData.style)) div.style.cssText = gridObj.labelData.style;
                if(isDef(gridObj.labelData.position)) div.style.position = gridObj.labelData.position;
                if(isDef(gridObj.labelData.positionX)) div.style.left = gridObj.labelData.positionX;
                if(isDef(gridObj.labelData.positionY)) div.style.top = gridObj.labelData.positionY;
                if(isDef(gridObj.labelData.width)) div.style.width = gridObj.labelData.width;
                if(isDef(gridObj.labelData.height)) div.style.height = gridObj.labelData.height;
            }
            parentNode.appendChild(div);
            if(Liquid.projectMode) Liquid.setDraggable(div);
        }        
    },
    createGridField:function(liquid, parentNode, grid, gridObj) {
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
            
            var col = gridObj.colLink1B > 0 ? liquid.tableJson.columns[gridObj.colLink1B - 1] : null;
            var itemId = grid.id + "." + (gridObj.index1B) + ".value";
            var itemClass = "liquidGridCell";
            var itemCssText = "";
             
            var itemContainerId = grid.id + "." + (gridObj.index1B) + ".div";
            if((col && typeof col.required !== 'undefined')) {
                inputRequired = "required=\"" + col.required + "\"";
            }
            if((col && typeof col.size !== 'undefined')) {
                if(inputMaxlength !== "") {
                    if(Number(inputMaxlength) > col.size)
                        inputMaxlength = "maxlength=\""+col.size+"\"";
                } else {
                    inputMaxlength = "maxlength=\""+col.size+"\"";
                }
                if(inputRequired === "") {
                    if(col.required) {
                        inputRequired = "required=\"true\"";
                    }
                }
            }
            
            var position = "";
            if(isDef(gridObj.fieldData)) {
                if(isDef(gridObj.fieldData.position)) position += " position:"+gridObj.fieldData.position + ";";
                if(isDef(gridObj.fieldData.positionX)) position += " left:" + gridObj.fieldData.positionX + ";";
                if(isDef(gridObj.fieldData.positionY)) position += " top:" + gridObj.fieldData.positionY + ";";
                if(isDef(gridObj.fieldData.width)) inputWidth = "width:" + Liquid.getCSSDim(gridObj.fieldData.width) + ";";
                if(isDef(gridObj.fieldData.height)) inputHeight = "height:" + Liquid.getCSSDim(gridObj.fieldData.height) + ";";
                if(isDef(gridObj.fieldData.style)) itemCssText = gridObj.fieldData.style;
            }            
            if(typeof col === 'undefined' || !col) {
                if(isDef(gridObj.query)) { // runtime field
                    if(!isDef(inputHeight) || inputHeight == '') inputHeight = "height:100%;";
                    innerHTML += "<div"
                            + " id=\"" + itemId + "\""
                            + " class=\""+itemClass + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " title=\""+toolTip + "\""
                            + "></div>";
                } else {
                    innerHTML += "<div id=\"" + itemId + "\" class=\""+itemClass+"\" title=\""+(gridObj.name)+" not found...check on your database\" style=\"color:"+Liquid.undetectedColumnColor+"\">"+Liquid.undetectedColumnMessage+"</div>";
                }
            } else {
                var toolTip = Liquid.getColumnTooltip(liquid, col);
                if(isDef(col.query) || isDef(gridObj.query)) {
                    if(!isDef(inputHeight) || inputHeight == '') inputHeight = "height:100%;";
                    if(!inputWidth) inputWidth = "width: calc(100% - 10px);"
                    innerHTML += "<div"
                            + " id=\"" + itemId + "\""
                            + " class=\""+itemClass + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " title=\""+toolTip + "\""
                            + "></div>";
                    
                } else if( (col && isDef(col.lookup)) || (isDef(gridObj.lookup)) ) {
                    // innerHTML += "<div id=\"" + itemId + "\" class=\""+itemClass+"\" title=\""+toolTip+"\"></div>";
                    // if(!isDef(inputHeight) || inputHeight == '') inputHeight = "height:100%;";
                    // if(!inputWidth) inputWidth = "width: calc(100% - 10px);"
                    innerHTML += "<div"
                            + " id=\"" + itemId + "\""
                            + " class=\""+itemClass + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " title=\""+toolTip + "\""
                            + "></div>";
                } else if(Liquid.isSunEditor(col) || Liquid.isSunEditor(gridObj)) {
                    if(!inputWidth) inputWidth = "width: calc(100% - 10px);"
                    innerHTML += "<div"
                            + " id=\"" + itemId + "\""
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
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
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " autocomplete=\"off\""
                            // + " onclick=\"Liquid.onPickDate(event,this)\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + "/>";
                } else if((col && typeof col.type !== 'undefined' && (col.type === "6" || col.type === "91"))) {
                    innerHTML += ""
                            + "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + inputType + "\" "
                            // + " data-date-format=\"DD-MM-YYYY HH:mm:ss\""
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " autocomplete=\"off\""
                            + " onclick=\"Liquid.onPickDate(event,this)\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " />";
                } else if(Liquid.isInteger(col.type)) {
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + "number" + "\" "
                            + " step=\"" + "1" + "\" "
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
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
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            + " />";
                } else {
                    innerHTML += "<input " + inputMax + " " + inputMin + " " + inputStep + " " + inputPattern + " " + inputMaxlength + " " + inputAutocomplete + " " + inputAutofocus + " " + inputPlaceholder + " " + inputRequired + " " + inputAutocomplete
                            + " value=\"\" id=\"" + itemId + "\""
                            + " type=\"" + inputType + "\" "
                            + " class=\"liquidGridControl "+itemClass+" "+(gridObj.zoomable===true ? "liquidGridControlZoomable":"") + "\""
                            + " style=\"" + inputWidth + " " + inputHeight + " " + position + " " + itemCssText + "\""
                            + " onchange=\"Liquid.onGridFieldModify(event,this)\""
                            + " onkeypress=\"return Liquid.onKeyPress(event, this)\""
                            + " title=\""+toolTip+"\""
                            +"/>";
                }
            }
            div.innerHTML = innerHTML;
            div.id = itemContainerId;
            div.style.height = '0px';
            div.style.display = "contents";
            gridObj.linkedContainerId = itemId;
            parentNode.appendChild(div);
            if(Liquid.projectMode) Liquid.setDraggable(div);
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
                if(isDef(grid.columns)) {
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
    }
    ,createGridsLookups:function(liquid, grids) {
        if(grids) {
            for(var ig = 0; ig < grids.length; ig++) {
                var grid = grids[ig];
                if(isDef(grid.columns)) {
                    for(var i=0; i<grid.columns.length; i++) {
                        var obj = document.getElementById(grid.columns[i].linkedContainerId);
                        var sourceCol = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B-1] : null;
                        var json = null;
                        var outField = null;
                        var options = null;
                        var bAddResizeObserver = false;
                        if(isDef(grid.columns[i].lookup) || isDef(grid.columns[i].query)) {
                            if(isDef(grid.columns[i].lookup)) {
                                json = grid.columns[i].lookup;
                                outField = grid.columns[i].lookupField;
                                options = grid.columns[i].options;
                            } else if(isDef(grid.columns[i].query)) {
                                json = JSON.stringify( { query:grid.columns[i].query, database:liquid.tableJson.database, schema:liquid.tableJson.schema } );
                                outField = grid.columns[i].queryField;
                                options = grid.columns[i].options;
                                if(!isDef(options)) options = {};
                                options.status = "open";
                                options.keepOpen = true;
                                options.width = '100%';
                                options.height = '100%';
                                options.autoFitColumns = true;
                                options.autoLoad = false;
                                bAddResizeObserver = true;
                            }
                        } else {
                            var col = grid.columns[i].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[i].colLink1B - 1] : null;
                            if(isDef(col)) {
                                if(isDef(col.lookup)) {
                                    json = col.lookup;
                                    outField = col.lookupField;
                                    options = col.options;
                                } else if(isDef(col.query)) {
                                    json = JSON.stringify( { query:col.query, database:liquid.tableJson.database, schema:liquid.tableJson.schema } );
                                    outField = col.queryField;
                                    options = col.options;
                                    if(!isDef(options)) options = {};
                                    options.status = "open";
                                    options.keepOpen = true;
                                    options.width = '100%';
                                    options.height = '100%';
                                    options.autoFitColumns = true;
                                    options.autoLoad = false;
                                    bAddResizeObserver = true;
                                }
                            }
                        }
                        if(json) {
                            var lookupControlId = liquid.controlId + "_" + grid.name + "_" + grid.columns[i].name.replace(/\./g, "_");
                            Liquid.startLookup(liquid.controlId, sourceCol, lookupControlId, grid.columns[i].linkedContainerId, json, outField, options, 'grid', "grid \"" + grid.name + "\" field \"" + grid.columns[i].name + "\"", null);
                            if(bAddResizeObserver) {
                                var obj = document.getElementById( grid.columns[i].linkedContainerId );
                                this.resizeObserver = new ResizeObserver(entries => {
                                    if(obj) {
                                        Liquid.setAutoresizeColumn(lookupControlId, false);
                                    }
                                });
                                this.resizeObserver.observe(obj);
                            }                        
                        }                    
                    }
                }
            }
        }
    },
    getGridCells:function(liquid, grid, r, c) {
        var result = [];
        if(grid) {
            if(isDef(grid.columns)) {
                for(var i=0; i<grid.columns.length; i++) {
                    if(grid.columns[i].row === r && grid.columns[i].col === c)
                        result.push( i );
                }
            }
            var index = r*grid.nCols+c;
            if(isDef(grid.columns)) {
                if(index < grid.columns.length) {
                    if(typeof grid.columns[index].row === 'undefined' && typeof grid.columns[index].col === 'undefined') result.push( index );
                }
            }
        }
        return result;
    },
    getGridFieldByName:function(liquid, grid, name) {
        if(grid) {
            if(isDef(grid.columns)) {
                for(var i=0; i<grid.columns.length; i++) {
                    if(grid.columns[i].name === name)
                        return grid.columns[i];
                }
            }
        }
        return null;
    },
    searchGridCell:function(liquid, grid, name) {
        if(grid) {
            if(isDef(grid.columns)) {
                for(var i=0; i<grid.columns.length; i++) {
                    if(grid.columns[i].name === name)
                        return i+1;
                }
            }
        }
        return 0;
    },
    getGridCoords:function(liquid, obj) {
        if(liquid && obj) {
            var obj_id = (typeof obj === 'object' ? obj.id : obj);
            var nameItems = obj_id ? obj_id.split(".") : null;
            if(nameItems && nameItems.length > 2) {
                var gdIndex = nameItems[2] - 1;
                if(nameItems[1] === "grid_tab") {
                    if(gdIndex >= 0) {
                        var grid = liquid.tableJson.grids[gdIndex];
                        if(nameItems.length > 4) {
                            if(nameItems[4] == 'row') {
                                var gRow = Number(nameItems[5]) - 1;
                                var gCol = Number(nameItems[7]) - 1;
                                return { grid: grid, control: gridControl, gridIndex:gdIndex, cellRow:gRow, cellCol:gCol };
                            } else {
                                var gItemIndex = nameItems[4] - 1;
                                var gridControl = grid.columns[gItemIndex];
                                var col = gridControl.colLink1B ? liquid.tableJson.columns[gridControl.colLink1B - 1] : null;
                                return { grid: grid, control: gridControl, column: col, gridIndex:gdIndex, itemIndex:gItemIndex, colIndex:gridControl.colLink1B - 1 };
                            }
                        } else {
                            return { grid: grid, gridIndex:gdIndex };
                        }
                    }
                } else if(nameItems[1] === "layout_tab") {
                    return { layout: liquid.tableJson.layouts[gdIndex], gridIndex:gdIndex };
                } else if(nameItems[1] === "document_tab") {
                    return { document: liquid.tableJson.documents[gdIndex], gridIndex:gdIndex };
                } else if(nameItems[1] === "chart_tab") {
                    return { chart: liquid.tableJson.charts[gdIndex], gridIndex:gdIndex };
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
    getGridIndexByName:function(liquid, gridName) {
        if(liquid && gridName)
            if(isDef(liquid.tableJson.grids))
                for(var ig=0; ig<liquid.tableJson.grids.length; ig++)
                    if(liquid.tableJson.grids[ig].name === gridName) 
                        return ig+1;
        return 0;
    },
    solveGridField:function(liquid, column) {
        if(liquid) {
            if(column) {
                var name = column.name;
                var label = column.label;
                // by field name
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    if(name === liquid.tableJson.columns[iF].name) {
                        return iF + 1;
                    }
                }
                // Now insensitive case
                name = column.name ? column.name.toUpperCase() : "";
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    var uName = isDef(liquid.tableJson.columns[iF].name) ? liquid.tableJson.columns[iF].name.toUpperCase() : null;
                    if(name ===  uName) {
                        return iF + 1;
                    }
                }
                // Now by label
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    if(label === liquid.tableJson.columns[iF].label) {
                        return iF + 1;
                    }
                }
                label = column.label ? column.label.toUpperCase() : "";
                for(var iF = 0; iF < liquid.tableJson.columns.length; iF++) {
                    var uLabel = isDef(liquid.tableJson.columns[iF].label) ? liquid.tableJson.columns[iF].label.toUpperCase() : null;
                    if(label === uLabel) {
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
                        // if(typeof col.isReflected === 'undefined' || col.isReflected !== true) {
                        if(typeof col.isReflected === 'undefined' || col.isReflected !== true || col.isReflected === true) { // yes column is reflected, we must write it
                            var selNodes = Liquid.getCurNodes(liquid);
                            for(var node=0; node<selNodes.length; node++) {
                                if(obj.classList.contains("liquidGridControlRW")) {
                                    var newValue = null;
                                    var curValue = selNodes[node].data[col.field];
                                    if(obj.nodeName==='INPUT') newValue = obj.value;
                                    else newValue = obj.innerHTML;
                                    if(newValue !== curValue) {
                                        var validateResult = Liquid.validateField(liquid, col, newValue);
                                        if(validateResult !== null) {
                                            if(validateResult[0] >= 0) {
                                                // newValue = validateResult[1];
                                                // selNodes[node].data[col.field] = newValue;
                                                selNodes[node].setDataValue(col.field, validateResult[1]);
                                                Liquid.setGridFieldAsChanged(liquid, gridControl, true);
                                                Liquid.registerFieldChange(liquid, null, selNodes[node].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], col.field, null, newValue);
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
            var nameItems = obj instanceof HTMLElement ? obj.id.split(".") : obj.split(".");
            if(nameItems && nameItems.length > 2) {
                if(!isNaN(nameItems[2])) {
                    var layoutIndex = nameItems[2] - 1;
                    if(nameItems.length > 2) {
                        return { layout: liquid.tableJson.layouts[layoutIndex], itemIndex:nameItems[4] - 1, layoutIndex:layoutIndex, col:nameItems[4]-1, row:nameItems[6] - 1  };
                    }
                }
            }
        }
        return null;
    },
    getLayoutIndexByName:function(liquid, layoutName) {
        if(liquid && layoutName)
            if(isDef(liquid.tableJson.layouts))
                for(var il=0; il<liquid.tableJson.layouts.length; il++)
                    if(liquid.tableJson.layouts[il].name === layoutName) 
                        return il+1;
        return 0;
    },
    loadLayoutsContent:function(liquid) {        
        if(isDef(liquid.tableJson.layouts)) {
            for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                var layout = liquid.tableJson.layouts[il];
                var isAutoInsert = false
                if(layout) {
                    if(layout.source !== 'undefined' && layout.source) {
                        layout.containerObj.innerHTML = "Loading \""+layout.source+"\"...";
                        try {
                            var sources = [
                                 { key:"source", def:null }
                                ,{ key:"sourceForInsert", def:"source"  }
                                ,{ key:"sourceForUpdate", def:"source"  }
                                ,{ key:"header", def:null  }
                                ,{ key:"footer", def:null  }
                                ,{ key:"headerForInsert", def:null  }
                                ,{ key:"footerForInsert", def:null  }
                                ,{ key:"headerForUpdate", def:null  }
                                ,{ key:"footerForUpdate", def:null  }
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
                                        // direct html link
                                        var content = Liquid.getProperty(layout.source);
                                        if(content === 'undefined' || !content) {
                                            layout.containerObj.innerHTML = content;
                                        } else {
                                            layout.containerObj.innerHTML = layout.source;
                                        }
                                        var height = Liquid.getItemsMaxHeight(layout.containerObj);
                                        var rootObj = document.createElement("div");
                                        // while(layout.containerObj.childNodes.length) {
                                        rootObj.appendChild(layout.containerObj.childNodes[0]);

                                        layout.templateRows.push( { key:sources[is].key, templateRow:rootObj, isAutoInsert:isAutoInsert, isFormX:isFormX, mode:mode, source:layout.source, height:height } );
                                        layout.pageLoaded = true;
                                    }
                                } else {
                                    if(sources[is].def) {
                                        layout.templateRows.push( { key:sources[is].key, templateRow:rootObj, isAutoInsert:isAutoInsert, isFormX:isFormX, mode:mode, source:layout[sources[is].def], height:height } );
                                    } else {
                                        // no default layout
                                        layout.templateRows.push( null );
                                    }
                                }
                            }
                            layout.containerObj.style.display = lastDisplay;
                            
                            Liquid.refreshLayout(liquid, layout, true);
                            
                            var mode = "readonly";
                            var isFormX = Liquid.isFormX(liquid);
                            var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                            if(isFormX || isAutoInsert === true) mode = "write";
                            if(layout.currentRow1) 
                                Liquid.onLayoutMode(layout.containerObj, layout.currentRow1B-1, mode);
                            if(layout.rowsContainer) {
                                for(var ir=0; ir<layout.rowsContainer.length; ir++) {
                                    layout.rowsContainer[ir].isUpdating = false;
                                }
                            }
                            
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
    resetLayoutsContent:function(liquid, bOnlyAddingRow, bAnimate) {
        if(liquid.tableJson.layouts) {
            if(liquid.tableJson.layouts.length > 0) {
                for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                    var layout = liquid.tableJson.layouts[il];
                    Liquid.resetLayoutContent(liquid, layout, bOnlyAddingRow, bAnimate);
                }
            }
        }
    },
    resetLayoutContent:function(liquid, layout, bOnlyAddingRow, bAnimate) {
        if(liquid) {
            if(layout) {
                if(layout.containerObj) {
                    var slideUpObjs = [];
                    if(layout.rowsContainer) {
                        var rowsContainer = [];
                        for (var ir=0; ir<layout.rowsContainer.length; ir++) {
                            if(layout.rowsContainer[ir]) {
                                var obj = layout.rowsContainer[ir].containerObj;
                                if(obj) {
                                    if(bOnlyAddingRow && layout.rowsContainer[ir].isAdding || !isDef(bOnlyAddingRow) || bOnlyAddingRow === false) {
                                        if(bAnimate) {
                                            slideUpObjs.push(layout.rowsContainer[ir].containerObj);
                                        } else {
                                            // check is some node own content to recover (like foreign table moved across parent)
                                            Liquid.checkLayoutChildrenForRemove(liquid, layout.rowsContainer[ir].containerObj);
                                            layout.rowsContainer[ir].containerObj.innerHTML = "";
                                        }
                                        delete layout.rowsContainer[ir];
                                    } else {
                                        rowsContainer.push(layout.rowsContainer[ir])
                                    }
                                }
                            }
                        }
                        layout.rowsContainer = rowsContainer;
                        if(!isDef(bOnlyAddingRow)) {
                            delete layout.rowsContainer;
                        }
                    }
                    for(var i=0; i<slideUpObjs.length; i++) {
                        var containerObj = slideUpObjs[i];
                        Liquid.unlinkElements( containerObj );
                        jQ1124( containerObj ).slideUp( "fast", 
                        function(){ 
                            containerObj.innerHTML = ""; 
                        });
                    }
                    layout.pendingLink = true;
                }
            }
        }
    },
    refreshPendingLayouts:function(liquid, forceRefresh) {
        if(isDef(liquid.tableJson.layouts)) {
            for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                var layout = liquid.tableJson.layouts[il];
                if(layout.pendingRefresh || forceRefresh) {
                    layout.pendingRefresh = false;
                    setTimeout(function() {
                        Liquid.refreshLayout(liquid, layout, layout.pendingLink);
                    }, 250);
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
                if(layout.pageLoaded === true) {
                    if(layout.pendingLink === true) {
                        if(!bSetup) { 
                            bSetup = true;
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
    scrollToBottomLayouts:function(liquid, bSetup) {
        if(liquid.tableJson.layouts) {
            if(liquid.tableJson.layouts.length > 0) {
                for(var il = 0; il < liquid.tableJson.layouts.length; il++) {
                    var layout = liquid.tableJson.layouts[il];
                    Liquid.scrollToBottomLayout(liquid, layout);
                }
            }
        }
    },
    scrollToBottomLayout:function(liquid, layout) {
        if(liquid) {
            if(layout) {
                if(layout.bodyContainerObj) {
                    layout.bodyContainerObj.scrollTop = layout.bodyContainerObj.scrollHeight;
                }
            }
        }
    },
    linkLayoutToFields:function(liquid, layout, containerObj, bSetup) {
        if(liquid) {
            if(layout) {
                if(containerObj) {
                    var slideDownContainerObjs = [];
                    if(containerObj.nodeName.toUpperCase() === 'IFRAME') {
                        try { containerObj = containerObj.contentWindow.document.body; } catch (e) { console.error("ERROR: unable to access to dsocument at layout:"+layout.name+", error:"+e); }
                    }
                    
                    if(containerObj.offsetWidth > 0 && containerObj.offsetHeight > 0) {
                        // if visible
                        var headerContainerObjId = containerObj.id + ".header";
                        var bodyContainerObjId = containerObj.id + ".body";
                        var footerContainerObjId = containerObj.id + ".footer";
                        var isInserting = false, isUpdating = false;
                        var templateHeader = null, templateFooter = null;

                        layout.headerContainerObj = document.getElementById(headerContainerObjId);
                        layout.bodyContainerObj = document.getElementById(bodyContainerObjId);
                        layout.footerContainerObj = document.getElementById(footerContainerObjId);


                        if(isDef(liquid.currentCommand)) {
                            if(liquid.currentCommand.name === "insert") 
                                isInserting = true;
                            else if(liquid.currentCommand.name === "update") 
                                isUpdating = true;
                        }

                        if(isInserting) {
                            templateHeader = layout.templateRows[5];
                            templateFooter = layout.templateRows[6];
                        } else if(isUpdating) {
                            templateHeader = layout.templateRows[7];
                            templateFooter = layout.templateRows[8];
                        } else {
                            templateHeader = layout.templateRows[3];
                            templateFooter = layout.templateRows[4];
                        }

                        if(!layout.headerContainerObj) {
                            layout.bCreateHeader = true;
                            layout.headerContainerObj = document.createElement("div");
                            layout.headerContainerObj.id = headerContainerObjId;
                            layout.headerContainerObj.style.width = "100%";
                            layout.headerContainerObj.style.height = "auto";
                            layout.headerContainerObj.style.overflow = "auto";
                            if(Liquid.debug) layout.headerContainerObj.style.border = "1px solid red";
                            containerObj.appendChild(layout.headerContainerObj);
                        }
                        if(!layout.footerContainerObj) {
                            layout.bCreateFooter = true;
                            layout.footerContainerObj = document.createElement("div");
                            layout.footerContainerObj.id = footerContainerObjId;
                            layout.footerContainerObj.style.width = "100%";
                            layout.footerContainerObj.style.height = "auto";
                            layout.footerContainerObj.style.overflow = "auto";
                            if(Liquid.debug) layout.footerContainerObj.style.border = "1px solid orange";
                            containerObj.appendChild(layout.footerContainerObj);
                        }
                        if(!layout.bodyContainerObj) {
                            layout.bodyContainerObj = document.createElement("div");
                            layout.bodyContainerObj.id = bodyContainerObjId;
                            layout.bodyContainerObj.className = "liquidLayoutRowContainer";
                            layout.bodyContainerObj.style.width = "100%";
                            layout.bodyContainerObj.style.height = "calc(100% - "+(layout.headerContainerObj.offsetHeight+layout.footerContainerObj.offsetHeight+2)+"px)";
                            layout.bodyContainerObj.style.overflow = "auto";
                            containerObj.style.overflow = "hidden";
                            if(Liquid.debug) layout.bodyContainerObj.style.border = "1px solid blue";
                            containerObj.insertBefore(layout.bodyContainerObj, layout.footerContainerObj);
                            // scroll listner
                            if(layout.bodyContainerObj.addEventListener) { layout.bodyContainerObj.addEventListener('scroll', Liquid.onLayourScroll); } else { layout.bodyContainerObj.attachEvent('scroll', Liquid.onLayourScroll); }
                        }
                    }                    
                    
                    var nRows = 0;
                    if(typeof layout.nRows !== 'undefined' && (layout.nRows === 0 || layout.nRows === 'auto')) {
                        if(layout.bodyContainerObj && layout.bodyContainerObj.offsetWidth > 0 && layout.bodyContainerObj.offsetHeight > 0) {
                            layout.itemsMaxHeight = layout.templateRows[0].height;
                            if(layout.itemsMaxHeight > 0)
                                if(layout.overflow === 'clamp') {
                                    layout.nRows = Math.floor(layout.bodyContainerObj.clientHeight / layout.itemsMaxHeight);
                                    if(layout.nRows <= 0) layout.nRows = 1;
                                    layout.itemsMaxHeight = layout.bodyContainerObj.clientHeight / layout.nRows;
                                } else {
                                    layout.nRows = Math.round(layout.bodyContainerObj.clientHeight / layout.itemsMaxHeight);
                                }
                            else
                                layout.nRows = 1;
                            if(layout.nRows < 1)
                                layout.nRows = 1;
                            layout.itemsMaxHeight = layout.bodyContainerObj.clientHeight / layout.nRows;
                        } else {
                            /// setTimeout(function(){ Liquid.linkLayoutToFields(liquid, layout, layout.bodyContainerObj, bSetup); }, 3000);
                            return;
                        }
                        // layout.bodyContainerObj.style.display = lastDisplay;
                        nRows = layout.nRows;
                    } else {
                        nRows = layout.nRows;
                        if(nRows < 0 || nRows === 'all' || nRows==='*') {
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
                            if(!isDef(layout.bodyContainerObj) || layout.bodyContainerObj.offsetWidth <= 0 || layout.bodyContainerObj.offsetHeight <= 0) {
                                if(!layout.resizeCounter) { // need resize ?
                                    Liquid.onLayoutResize(liquid, layout);
                                }
                            }                            
                            if(!isDef(layout.bodyContainerObj) || layout.bodyContainerObj.offsetWidth <= 0 || layout.bodyContainerObj.offsetHeight <= 0) {
                                /// setTimeout(function(){ Liquid.linkLayoutToFields(liquid, layout, layout.bodyContainerObj, bSetup); }, 3000);
                                // not ready
                                layout.pendingRefresh = true;
                                return;
                            }
                        }
                        if(layout.nRows > 0) {
                            layout.itemsMaxHeight = layout.bodyContainerObj.clientHeight / nRows;
                        } else {
                            layout.itemsMaxHeight = "auto";
                        }
                    }                    
                    if(layout.overflow === 'clamp' || layout.overflow === 'hidden') {
                        containerObj.style.overflow = "hidden";
                        layout.bodyContainerObj.style.overflow = "hidden";
                    }                            
                    if(typeof layout.rowsContainer === 'undefined' || !layout.rowsContainer) {
                        layout.rowsContainer = [];
                    }
                    

                    var isFormX = Liquid.isFormX(liquid);
                    var isDialogX = Liquid.isDialogX(liquid);
                    var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                    if(isFormX || isDialogX) {
                        if(layout.nRows <= 0) { // all rows
                            if(nRows <= 0) nRows = 1;
                        }
                    } else if(isAutoInsert) {
                        if(layout.nRows <= 0) { // all rows
                            nRows = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren.length;
                        }
                    } else {
                        if(layout.nRows <= 0) { // all rows
                            nRows = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren.length;
                        }
                    }
                    
                    // set nRows
                    layout.rowCount = nRows;

                    
                    //
                    // header/footer contents
                    //
                    var updateBodyHeight = false;
                    if(layout.bCreateHeader || layout.templateHeader !== templateHeader) {
                        layout.templateHeader = templateHeader;
                        layout.bCreateHeader = false;
                        if(layout.templateHeader) {
                            layout.headerContainerObj.innerHTML = "";
                            layout.headerContainerObj.appendChild(layout.templateHeader.templateRow.cloneNode(true));
                            updateBodyHeight = true;
                        }
                    }
                    if(layout.bCreateFooter || layout.templateFooter !== templateFooter) {
                        layout.bCreateFooter = false;
                        layout.templateFooter = templateFooter;
                        if(layout.templateFooter) {
                            layout.footerContainerObj.innerHTML = "";
                            layout.footerContainerObj.appendChild(layout.templateFooter.templateRow.cloneNode(true));
                            updateBodyHeight = true;
                        }
                    }

                    if(updateBodyHeight) {
                        layout.bodyContainerObj.style.height = "calc(100% - "+(layout.headerContainerObj.offsetHeight+layout.footerContainerObj.offsetHeight)+"px)";
                    }
                    
                    
                    // Duplicate body contents
                    for(var ir=0; ir<nRows; ir++) {
                        var templateRowSourceResult = Liquid.getTemplateRowSource(liquid, layout, layout.baseIndex1B-1+ir );
                        var templateRow = Liquid.getTemplateRow(liquid, layout, layout.baseIndex1B-1+ir );
                        var templateRowSource = templateRowSourceResult[0]
                        var isAdding = templateRowSourceResult[1];
                        var bCreateRow = false;
                        
                        if(layout.rowsContainer.length < ir+1) {
                            bCreateRow = true;
                        } else {
                            if(layout.rowsContainer[ir] === null) {
                                bCreateRow = true;
                            } else {
                                if(layout.rowsContainer[ir].templateRowSource != templateRowSource) {
                                    layout.rowsContainer[ir].templateRowSource = templateRowSource;
                                    var rowsContainer = layout.rowsContainer[ir];

                                    // check is some node own content to recover (like foreign table moved across parent)
                                    Liquid.checkLayoutChildrenForRemove(liquid, layout.rowsContainer[ir].containerObj);

                                    layout.rowsContainer[ir].containerObj.innerHTML = "";
                                    layout.rowsContainer[ir].containerObj.innerText = "";
                                    layout.rowsContainer[ir].bSetup = true;
                                    layout.rowsContainer[ir].containerObj.style.visibility = 'hidden';
                                    if(templateRow) layout.rowsContainer[ir].containerObj.appendChild(templateRow.cloneNode(true));
                                    slideDownContainerObjs.push( { containerObj:layout.rowsContainer[ir].containerObj, mode:layout.rowsContainer[ir].isAdding || layout.rowsContainer[ir].isUpdating?"write":"readonly" } );
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
                            
                            layout.bodyContainerObj.appendChild(rowObj);
                            if(layout.rowsContainer.length < ir+1) {
                                layout.rowsContainer.push( { containerObj:rowObj, objs:[], objsSource:[], objsReload:[], objsReset:[], objsInput:[], cols:[], bSetup:true, templateRowSource:templateRowSource, isAdding:isAdding } );
                            } else {
                                layout.rowsContainer[ir] = { containerObj:rowObj, objs:[], objsSource:[], objsReload:[], objsReset:[], objsInput:[], cols:[], bSetup:true, templateRowSource:templateRowSource, isAdding:isAdding };
                            }
                            if(isAdding) {
                                Liquid.scrollToBottomLayout(liquid, layout);
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
                        Liquid.setLayoutField(liquid, layout, layout.rowsContainer[ir].containerObj, ir, layout.rowsContainer[ir].bSetup);
                        layout.rowsContainer[ir].bSetup = false;
                        var isAddingNode = Liquid.isAddingNode(liquid, layout.baseIndex1B-1+ir, nodes, true);
                        if( layout.baseIndex1B > 0 && (layout.baseIndex1B-1+ir < liquid.nRows || isAddingNode) || isFormX || isDialogX ) {
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
                                        if(obj.parentNode) obj.parentNode.removeChild(obj);
                                        layout.rowsContainer[ir] = null;
                                    }
                                }
                            }
                        }
                    }                    
                }
                layout.pendingLink = false;
                layout.pendingRefresh = false;                
            }
        }

        var setMode = true;
        if(slideDownContainerObjs) {
            for(var i=0; i<slideDownContainerObjs.length; i++) {
                var containerObj = slideDownContainerObjs[i].containerObj;
                var mode = slideDownContainerObjs[i].mode;
                containerObj.style.display = 'none';
                containerObj.style.visibility = '';
                setMode = false;
                jQ1124( containerObj ).slideDown( "slow", function(){ 
                    if(layout.currentRow1B)
                        Liquid.onLayoutMode(layout.layoutTabObj, layout.currentRow1B-1, mode);
                });
            }
        }
        if(setMode) {
            if(layout.currentRow1B) {
                var mode = "readonly";
                if(layout.rowsContainer[layout.currentRow1B-1]) {
                    mode = layout.rowsContainer[layout.currentRow1B-1].isAdding || layout.rowsContainer[layout.currentRow1B-1].isUpdating?"write":"readonly";
                }
                Liquid.onLayoutMode(layout.layoutTabObj, layout.currentRow1B-1, mode);
            }
        }
    },
    unlinkElements:function( obj ) {
        if(obj) {
            obj.id = "";
            if(obj.childNodes) {
                for(var j=0; j<obj.childNodes.length; j++) {
                    Liquid.unlinkElements(obj.childNodes[j]);
                }
            }
        }
    },
    isWinX:function(liquid) {
        return (liquid.mode === "winX" || liquid.mode === "WinX");
    },
    isFormX:function(liquid) {
        return (liquid.mode === "formX" || liquid.mode === "FormX");
    },
    isDialogX:function(liquid) {
        return (liquid.mode === "dialogX" || liquid.mode === "DialogX");
    },
    isAutoInsert:function(liquid, layout) {
        var autoInsert = false;
        if(isDef(liquid)) if(isDef(liquid.tableJson.autoInsert)) autoInsert = liquid.tableJson.autoInsert;
        if(isDef(layout)) if(isDef(layout.autoInsert)) autoInsert = layout.autoInsert;
        return autoInsert;
    },            
    autoInsert:function(liquid) {
        if(liquid) {
            var insertCommand = { name:"insert", server:"", client:"", isNative:true };
            Liquid.onButton(liquid, insertCommand);
        }
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
                var isAddingNode = Liquid.isAddingNode(liquid, ir, nodes, true);
                if(isAddingNode)
                    if(layout.templateRows.length > 1)
                        if(layout.templateRows[1])
                            if(layout.templateRows[1].templateRow)
                                return layout.templateRows[1].templateRow;
                
                if(isDef(layout.rowsContainer))
                    if(ir < layout.rowsContainer.length)
                        if(layout.rowsContainer[ir]) 
                            if(layout.rowsContainer[ir].isUpdating)
                                return layout.templateRows[2].templateRow;
                
                return layout.templateRows[0].templateRow;
            }
        }
    },
    getTemplateRowSource:function (liquid, layout, ir) {
        var templateRow = null;
        if(liquid) {
            if(layout) {
                var nodes = null;
                try { nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren; } catch(e) {}
                var isAddingNode = Liquid.isAddingNode(liquid, ir, nodes, true);
                if(isAddingNode)
                    if(layout.templateRows.length > 1)
                        if(layout.templateRows[1])
                            if(layout.templateRows[1].source)
                                return [ layout.templateRows[1].source, true];
                
                if(isDef(layout.rowsContainer))
                    if(ir < layout.rowsContainer.length)
                        if(layout.rowsContainer[ir]) 
                            if(layout.rowsContainer[ir].isUpdating)
                                return [ layout.templateRows[2].source, false ];
                
                return [ layout.templateRows[0].source, false ];
            }
        }
        return [ null, -1 ];
    },
    setLayoutField:function(liquid, layout, obj, iRow, bSetup) {
        if(obj) {
            var objLinkers = null;
            var objLinkersTarget = null;
            if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'TEXTAREA') {
                objLinkers = [obj.id, obj.className];
                objLinkersTarget = [null, "className"];
            } else if(obj.nodeName.toUpperCase() === 'DIV' || obj.nodeName.toUpperCase() === 'SPAN' || obj.nodeName.toUpperCase() === 'TD' || obj.nodeName.toUpperCase() === 'P') {
                objLinkers = [obj.innerHTML, obj.id, obj.classList];
                objLinkersTarget = [null, null, "className"];
            } else if(obj.nodeName.toUpperCase() === 'A' || obj.nodeName.toUpperCase() === 'BUTTON') {
                objLinkers = [obj.innerHTML, obj.id, obj.classList];
                objLinkersTarget = [null, null, "className"];
            } else if(obj.nodeName.toUpperCase() === 'FORM') {
                liquid.linkedForm = obj;
            }
            
            if(objLinkers) {
                var linkeCol = null;
                var objLinkerDesc = "";
                var value = "[!]";
                var linkCount = 0;
                var doc = obj.ownerDocument;
                var win = doc.defaultView || doc.parentWindow;
                                                            
                if(isDef(layout.rowsContainer[iRow].incomingSource)) {
                    if(layout.rowsContainer[iRow].incomingSource != layout.rowsContainer[iRow].templateRowSource) {
                        jQ1124( layout.rowsContainer[iRow].containerObj ).slideUp( "fast", function(){ 
                            // check is some node own content to recover (like foreign table moved across parent)
                            Liquid.checkLayoutChildrenForRemove(liquid, layout.rowsContainer[iRow].containerObj);
                            layout.rowsContainer[iRow].containerObj.innerHTML = ""; 
                        });
                        layout.rowsContainer[iRow].objs = [];
                        layout.rowsContainer[iRow].objsInput = [];
                        layout.rowsContainer[iRow].objsSource = [];
                        layout.rowsContainer[iRow].objsReset = [];
                        layout.rowsContainer[iRow].objsReload = [];
                        layout.rowsContainer[iRow].cols = [];
                        bSetup = true;
                    }
                    delete layout.rowsContainer[iRow].incomingSource;
                }

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
                                    var result = Liquid.solveExpressionFieldOnRow(objLinkers[il], null, liquid, iRow);
                                    var expr = result[1];
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
                    var layoutIndex1B = Liquid.getLayoutIndex(liquid, layout.name);
                    var controlName = "";
                    var newId = liquid.controlId + ".layout." + layoutIndex1B; // generic id .. to refine
                    
                    if(linkCount) {
                        if(linkeCol) {
                            controlName = "col." + linkeCol.field + ".row." + (iRow + 1);
                            newId = liquid.controlId + ".layout." + layoutIndex1B + "." + controlName;
                            obj.setAttribute('previd', obj.id);
                            obj.setAttribute('linkedfield', linkeCol.field);
                            obj.setAttribute('linkedname', linkeCol.name);
                            obj.setAttribute('linkedrow1b', iRow + 1);
                            obj.onchange = function (event) {
                                Liquid.onLayoutFieldChange(event);
                            };
                            obj.onclick = function (event) {
                                Liquid.onLayoutFieldClick(event);
                            };                            
                            var linkedObj = obj;
                            var linkedObjInput = null;
                            var linkedObjSource = null;
                            var linkedObjReset = null;
                            var linkedObjReload = null;
                            var otherObj = null;
                            while ((otherObj = win.document.getElementById(newId)) !== null)
                                newId += ".copy";
                            obj.id = newId;
                            
                            obj.title = ""+linkeCol.name+"";
                            
                            

                            // max size
                            if(obj.nodeName.toUpperCase() === 'INPUT') {
                                if(linkeCol.size > 0) {
                                    obj.maxLength = linkeCol.size;
                                }
                            }

                            if(linkeCol.remarks) {
                                if(!isDef(obj.title)) {
                                    obj.title = linkeCol.remarks;
                                }
                            }

                            
                            //
                            // date / time ?
                            //
                            if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'DIV') {
                                
                                // default value on layout
                                if(obj.value) {
                                    if(layout.rowsContainer[iRow].isAdding) {
                                        if(!isDef(linkeCol.default)) {
                                            linkeCol.default = obj.value;
                                            liquid.addingRow[linkeCol.field] = obj.value;
                                        } else {
                                            if(linkeCol.default !== obj.value) {
                                                console.warn("WARNING: default value on layout '"+layout.name+"' ignored because database default is already definid");
                                            }
                                        }
                                    }
                                }
                                
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
                                    var dpControlName = '.xdsoft_datetimepicker';
                                    var timeFormat = 'H'+Liquid.timeSep+'i'+Liquid.timeSep+'s';
                                    var dp = jQ1124(dpControlName);
                                    try {
                                        jQ1124(obj).datetimepicker({
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
                                                jQ1124(dpControlName).datetimepicker("option", opt);
                                                jQ1124(dpControlName).css('z-index', 99900);
                                                this.setOptions(opt);
                                                console.log(jQ1124(dpControlName).css('z-index'));
                                            }
                                            ,onClose:function(o) { 
                                                console.log(jQ1124(dpControlName).css('z-index'));
                                            }
                                        });
                                    } catch(e) {
                                        console.error(e);
                                    }
                                }
                            }
                            
                            //
                            // numeric ?
                            //
                            if(obj.nodeName.toUpperCase() === 'INPUT') {
                                if(obj.type !== 'hidden') {
                                    if(Liquid.isInteger(linkeCol.type)) {
                                        obj.type = 'number';
                                        obj.step = '1';
                                    } else if(Liquid.isFloat(linkeCol.type)) {
                                        obj.type = 'number';
                                        obj.step = '0.01';
                                    }
                                }
                            }
                            
                            //
                            // Lookup ?
                            //
                            if(isDef(linkeCol.lookup)) {
                                var previousClassList = null;
                                if(obj.nodeName.toUpperCase() === 'INPUT' || obj.nodeName.toUpperCase() === 'TEXTAREA' || obj.nodeName.toUpperCase() === 'DIV') {
                                    var parentNode = obj.parentNode;
                                    var newObj = win.document.createElement("div");
                                    newObj.className = obj.className;
                                    previousClassList = obj.classList;
                                    newObj.style = obj.style;
                                    newObj.style.width = obj.offsetWidth + 'px';
                                    // newObj.style.height = obj.offsetHeight + 'px';
                                    newObj.style.display = obj.style.display;
                                    newObj.style.position = obj.style.position;;
                                    newObj.style.overflow = "";
                                    newObj.style.left = obj.style.left;
                                    newObj.style.top = obj.style.top;
                                    newObj.id = obj.id;
                                    newObj.innertHTML = obj.value;
                                    newObj.style.padding = "0px";
                                    newObj.onchange = obj.onchange;
                                    newObj.dataset.linkedInputId = newId+".lookup.input"; // link to inputObj
                                    newObj.setAttribute('comboId', lookupControlId+".lookup.combo");
                                    obj.onchange = null;
                                    parentNode.removeChild(obj);
                                    delete obj;
                                    parentNode.appendChild(newObj);
                                    obj = newObj;
                                }
                                obj.setAttribute('linkedInputId', "pending");
                                var sourceCol = null; // TODO : set source column
                                var lookupControlName = "col." + linkeCol.field + ".row.template" // share the control, avoiding duplicates ... 1000 row = 1000 control in the server
                                var lookupControlId = liquid.controlId + "_" + layout.name + "_" + lookupControlName.replace(/\./g, "_");
                                var lookupInstanceControlId = newId;
                                // creating lookup
                                var lookupLiquid = Liquid.startLookup(liquid.controlId, sourceCol, lookupControlId, obj, linkeCol.lookup, linkeCol.lookupField, linkeCol.options, 'layout', "column field \"" + linkeCol.name + "\"", win);
                                if(lookupLiquid) {
                                    // obj.setAttribute('comboId', lookupControlId+".lookup.combo");
                                    obj.setAttribute('linkedInputId', lookupInstanceControlId+".lookup.input");
                                    obj.setAttribute('linkedfield', linkeCol.field);
                                    obj.setAttribute('linkedname', linkeCol.name);
                                    obj.setAttribute('linkedrow1b', iRow + 1);
                                    linkedObj = document.getElementById(lookupInstanceControlId);
                                    if(linkedObj) {
                                        // linkedObj.style.width = "calc(100% - 0px)";
                                        linkedObjSource = document.getElementById(lookupInstanceControlId + ".lookup.input.source");
                                        linkedObjReset = document.getElementById(lookupInstanceControlId + ".lookup.input.reset");
                                        linkedObjReload = document.getElementById(lookupInstanceControlId + ".lookup.input.reload");
                                        linkedObjInput = document.getElementById(lookupInstanceControlId + ".lookup.input");
                                        if(linkedObjInput) {
                                            linkedObjInput.setAttribute('comboId', lookupControlId+".lookup.combo");
                                            if(layout.rowsContainer[iRow].isAdding) {
                                                linkedObjInput.readOnly = false;
                                            } else {
                                                linkedObjInput.readOnly = true;
                                            }
                                            if(previousClassList) {
                                                for(var ic=0; ic<previousClassList.length; ic++) {
                                                    linkedObjInput.classList.add(previousClassList[ic]);
                                                }
                                            }
                                        } else {
                                            console.error("ERROR: lookup not detect the input control "+(lookupInstanceControlId+".lookup.input"));
                                        }
                                    } else {
                                        console.error("ERROR: lookup not detect the input's parent control "+lookupInstanceControlId);
                                    }
                                }
                            }
                            layout.rowsContainer[iRow].objs.push(linkedObj);
                            layout.rowsContainer[iRow].objsInput.push(linkedObjInput);
                            layout.rowsContainer[iRow].objsSource.push(linkedObjSource);
                            layout.rowsContainer[iRow].objsReset.push(linkedObjReset);
                            layout.rowsContainer[iRow].objsReload.push(linkedObjReload);
                            layout.rowsContainer[iRow].cols.push(linkeCol);
                            Liquid.appendDependency(liquid, linkeCol, {layoutName: layout.name, objId: obj.id, iRow: iRow});
                        } else {
                            if(obj.id) {
                                if(obj.id.indexOf("@{") >= 0) {
                                    console.error("ERROR: html element not linked : "+obj.id+" ... maybe not defined in "+liquid.controlId);
                                }
                            }
                            layout.rowsContainer[iRow].objs.push(null);
                            layout.rowsContainer[iRow].objsInput.push(null);
                            layout.rowsContainer[iRow].objsSource.push(null);
                            layout.rowsContainer[iRow].objsReset.push(null);
                            layout.rowsContainer[iRow].objsReload.push(null);
                            layout.rowsContainer[iRow].cols.push(linkeCol);
                        }
                    } else {
                        // object not linked, may be action item like buttons
                        if(bSetup) {
                            if(obj) {
                                // Append only record link
                                if(!isDef(layout.noneCounter)) layout.noneCounter = 1;
                                obj.setAttribute('linkedrow1b', iRow + 1);
                                controlName = "col." + "none" + (layout.noneCounter++)+ ".row." + (iRow + 1);
                                newId = liquid.controlId + ".layout." + layoutIndex1B + "." + controlName;
                                obj.setAttribute('linkedid', newId);
                                obj.setAttribute('name', obj.id);
                                obj.id = newId;                                
                                
                                if(!obj.id) {
                                    obj.id = newId;
                                }
                                if(!obj.onclick) {
                                    obj.onclick = function (event) {
                                        Liquid.onLayoutFieldClick(event);
                                    };                                    
                                }
                            }
                        }
                    }
                }
                var linkedField = obj.getAttribute('linkedfield');
                var linkedName = obj.getAttribute('linkedname');
                var linkedRow1B = obj.getAttribute('linkedRow1b');
                var linkedInputId = obj.getAttribute('linkedinputid');
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
                            var absRow = baseIndex1B - 1 + iRow;                        
                            if(absRow < liquid.nRows && absRow < nodes.length) {
                                if(nodes[absRow].data)
                                    value = nodes[absRow].data[linkedField];
                            } else if(Liquid.isAddingNode(liquid, absRow, nodes, true)) {
                                if(nodes[absRow].data)
                                    value = nodes[absRow].data[linkedField];
                            } else {
                                disabled = true;
                                value = "";
                            }
                        } else {
                            var isDialogX = Liquid.isDialogX(liquid);
                            var isFormX = Liquid.isFormX(liquid);
                            var isAutoInsert = Liquid.isAutoInsert(liquid, layout);
                            if(isFormX || isAutoInsert) {
                                if(liquid.addingRow) {
                                    value = liquid.addingRow[linkedField];
                                } else {
                                    disabled = true;
                                    value = ".";
                                }
                            } else if(isDialogX) {
                                disabled = false;
                                value = "";
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
                                if(targetObj) {
                                    targetObj.style.border = '0px';
                                    targetObj.style.backgroundColor = 'transparent';
                                }
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
                                // check is some node own content to recover (like foreign table moved across parent)
                                Liquid.checkLayoutChildrenForRemove(liquid, obj);
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
                    Liquid.setLayoutField(liquid, layout, obj.childNodes[j], iRow, bSetup);
                }
            }
        }
    },
    /**
     * Set the form's fields by liquid control node
     * @param formObj the form object
     * @param liquid the source control
     * @param node the source node
     * @return n/d
     * 
     * TODO: test
     */
    setForm:function(formObjOrName, obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var curNodes = Liquid.getCurNodes(liquid);        
            if(curNodes) {
                Liquid.setFormByNode(formObjOrName, liquid, curNodes[0]);
            }
        }
    },
    /**
     * Set the form's fields by liquid control node
     * @param formObj the form object
     * @param liquid the source control
     * @param node the source node
     * @return n/d
     * 
     * TODO: test
     */
    setFormByNode:function(formObjOrName, obj, node) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var formObj = null;
            if(formObjOrName instanceof HTMLElement) {
                formObj = formObjOrName;
            } else {
                formObj = document.getElementById(formObjOrName);
            }
            // searching for linkedLiquid
            var linkedLiquid = null;
            for(var i=0; i<glLiquids.length; i++) {
                if(glLiquids[i]) {
                    if(glLiquids[i].linkedForm) {
                        if(glLiquids[i].linkedForm.id === formObj.id && isDef(formObj.id)) {
                            linkedLiquid = glLiquids[i];
                        } else if(glLiquids[i].linkedForm.name === formObj.name && isDef(formObj.name)) {
                            linkedLiquid = glLiquids[i];
                        }
                    }
                }
            }
            if(formObj && liquid && node) {
                var disabled = false;
                frm_elements = formObj.elements;
                if(frm_elements && frm_elements.length) {
                    for (var i = 0; i < frm_elements.length; i++) {
                        var targetObj = frm_elements[i];
                        var targetName = Liquid.getFormElementId(targetObj);
                        if(targetName) {
                            targetName = targetName.toLowerCase();
                            for(var j=0; j<liquid.tableJson.columns.length; j++) {
                                var name = liquid.tableJson.columns[j].name;
                                if(name.toLowerCase() == targetName) {
                                    var value = node.data[j+1];
                                    Liquid.setHTMLElementValue(targetObj, value, disabled);
                                    if(linkedLiquid) {
                                        Liquid.setAddingField(linkedLiquid, name, value);
                                    }
                                }
                            }
                        }
                    }
                }
                if(linkedLiquid) {
                    Liquid.resetMofifications(linkedLiquid);
                }
            }
        }
    },
    /**
     * Insert or update the control by a form
     * @param liquid the source control
     * @param formObj the form object
     * @return n/d
     * 
     * TODO: test
     */
    updateControlByForm:function(obj, formObjOrName) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var formObj = null;
            if(formObjOrName instanceof HTMLElement) {
                formObj = formObjOrName;
            } else {
                formObj = document.getElementById(formObjOrName);
            }
            if(formObj && liquid) {
                var disabled = false;
                frm_elements = formObj.elements;
                if(frm_elements && frm_elements.length) {
                    for (var i = 0; i < frm_elements.length; i++) {
                        var targetObj = frm_elements[i];
                        var targetName = Liquid.getFormElementId(targetObj);
                        if(targetName) {
                            targetName = targetName.toLowerCase();
                            for(var j=0; j<liquid.tableJson.columns.length; j++) {
                                var name = liquid.tableJson.columns[j].name;
                                if(name.toLowerCase() == targetName) {
                                }
                            }
                        }
                    }
                }
            }
        }
    },            
    checkLayoutChildrenForRemove:function(liquid, obj) {
        if(obj) {
            if(obj.childNodes) {
                for (var j = 0; j < obj.childNodes.length; j++) {
                    try {
                        if(obj.childNodes[j].nodeType != 3) {
                            var foreignTable1B = obj.childNodes[j].getAttribute('foreignTable1B');
                            if(foreignTable1B) {
                                // restore opriginal parent
                                var foreignTableIndex = Number(obj.childNodes[j].getAttribute('foreignTableIndex'));
                                Liquid.setParentForeignTable(liquid, foreignTableIndex);
                            }
                            if(obj.childNodes[j].childNodes) {
                                Liquid.checkLayoutChildrenForRemove(liquid, obj.childNodes[j]);
                            }
                        }
                    } catch (e) { }
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
                    var fieldKey = subKey.substring(0, index);
                    fieldKey = fieldKey.replace(/'/g, "").replace(/"/g, "");
                    var linkedCol = Liquid.getColumn(liquid, fieldKey);
                    return linkedCol;
                }
            }
        }
    },
    getLayoutIndex:function(liquid, layoutName) {
        if(liquid) {
            if(isDef(liquid.tableJson.layouts)) {
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
    onLayoutFieldClick:function(event) {
        if(event) {
            var liquid = Liquid.getLiquid(event.target);
            if(liquid) {
                var lay_coord = Liquid.getLayoutCoords(liquid, event.target);
                if(lay_coord) {
                    if(lay_coord.layout) {
                        var obj = event.target;                    
                        var linkedField = obj.getAttribute('linkedfield');
                        var linkedName = obj.getAttribute('linkedname');
                        var linkedRow1B = obj.getAttribute('linkedrow1b');
                        var firstNodeId = lay_coord.layout.firstNodeId;
                        var baseIndex1B = Liquid.getNodeIndex(liquid, firstNodeId);
                        lay_coord.layout.currentRow1B = (linkedRow1B - baseIndex1B)+1;
                        lay_coord.layout.currentAbsoluteRow1B = linkedRow1B;
                    }
                }
            }
        }
    },
    onLayoutFieldChange:function(event) {
        if(event) {
            var liquid = Liquid.getLiquid(event.target);
            if(liquid) {
                var lay_coord = Liquid.getLayoutCoords(liquid, event.target);
                if(lay_coord.layout) {
                    var newValue = null;
                    var obj = event.target;                    
                    var linkedField = obj.getAttribute('linkedfield');
                    var linkedName = obj.getAttribute('linkedname');
                    var linkedRow1B = obj.getAttribute('linkedrow1b');
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
                            if(obj) {
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
                            }
                            if(doUpdate) {
                                var isFormX = Liquid.isFormX(liquid);
                                if(isFormX) {
                                    var validateResult = Liquid.validateField(liquid, col, newValue);
                                    if(validateResult !== null) {
                                        if(validateResult[0] >= 0) {
                                            //newValue = validateResult[1];
                                            Liquid.registerFieldChange(liquid, liquid.addingNode ? liquid.addingNode.__objectId : null, liquid.addingRow[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ], linkedField, null, newValue);
                                            Liquid.updateDependencies(liquid, col, null, event);
                                        }
                                    }
                                } else {
                                    if(baseIndex1B > 0) {
                                        var isddingNode = Liquid.isAddingNode(liquid, baseIndex1B-1+linkedRow1B-1, nodes, true);
                                        if(baseIndex1B-1+linkedRow1B-1 < liquid.nRows || isddingNode) {
                                            var data = nodes[baseIndex1B-1+linkedRow1B-1].data;                            
                                            if(baseIndex1B) {
                                                var validateResult = Liquid.validateField(liquid, col, newValue);
                                                if(validateResult !== null) {
                                                    if(validateResult[0] >= 0) {
                                                        // newValue = validateResult[1];
                                                        nodes[baseIndex1B-1+linkedRow1B-1].setDataValue(linkedField, validateResult[1]);
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
            var nameItems = obj instanceof HTMLElement ? obj.id.split(".") : obj.split(".");
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
            var nameItems = obj instanceof HTMLElement ? obj.id.split(".") : obj.split(".");
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
            var dp = jQ1124(controlName);
            try {
                jQ1124(obj).datetimepicker({
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
                        jQ1124(controlName).datetimepicker("option", opt);
                        jQ1124(controlName).css('z-index', 90000);
                        jQ1124().datetimepicker("value", value);
                        this.setOptions(opt);
                    }
                    ,onClose:function(o) { if(liquid) liquid.gridOptions.api.stopEditing(); }
                });
                if(bShow)
                    jQ1124(obj).datetimepicker("show");
            } catch(e) {
                console.error(e);
            }
        } else {
            controlName = '.ui-datepicker';
            var dp = jQ1124(controlName);
            jQ1124(controlName).css('z-index', 90000);
            jQ1124(obj).datepicker().datepicker("option", {
                 showAnim: "slideDown"
                ,inline: true
                ,date: value
                ,dateFormat: (typeof format !== "undefined" && format ? format : 'dd'+Liquid.dateSep+'mm'+Liquid.dateSep+'yy')
                ,changeMonth: true ,changeYear: true
                ,beforeShow:function(o) {
                   var opt = {};
                   if(col !== null) opt = Liquid.setDatePickerOptions(this, col);
                   jQ1124(obj).datepicker("option", opt);
                   setTimeout(function(){ jQ1124(controlName).css('z-index', 90000); }, 10);
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
                jQ1124(obj).datepicker("show");
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
                        liquid.suneditorDiv.style.zIndex = 99100;

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
                liquid.suneditorGridControl.linkedObj.innerHTML = Liquid.textToHTML(content);
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
                                        /*
                                        NO : this destroy the format
                                        var div = document.createElement("div");
                                        div.innerHTML = validateResult[1];
                                        content = div.textContent || div.innerText || "";
                                        delete div;
                                        */
                                    } else {
                                        content = validateResult[1];
                                    }
                                    liquid.suneditorNodes[iN].setDataValue(col.field, content);
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
    HTMLToText:function( text ) {
        if(text) {
            return text.replace("<br>", "\n").replace("</br>", "\n").replace("<br/>", "\n").replace("</p><p>", "\n").replace("</p>", ""); 
        }
        return text;
    },
    textToHTML:function( text ) {
        if(text) {
            return text.replace("\n", "<br/>"); 
        }
        return text;
    },
    setFilter:function(obj, columnName, filterValue, filterOperator) {
        var liquid = Liquid.getLiquid(obj);
        if (liquid) {
            var column = Liquid.getColumn(liquid, columnName);
            if (column) {
                var bAddFilter = true;
                for (var iFilter = 0; iFilter < liquid.filtersJson.length; iFilter++) {
                    var filtersJson = liquid.filtersJson[iFilter];
                    if (filtersJson) {
                        for (var i = 0; i < filtersJson.columns.length; i++) {
                            if (filtersJson.columns[i].name == columnName) {
                                var element = document.getElementById(liquid.controlId + ".filters." + (iFilter + 1) + "." + filtersJson.columns[i].runtimeName + ".filter");
                                if (element) {
                                    bAddFilter = false;
                                    if (element.value != filterValue) {
                                        element.value = filterValue;
                                    }
                                    if (isDef(filterOperator)) {
                                        filtersJson.columns[i].op = filterOperator;
                                    }
                                }
                                break;
                            }
                        }
                        if (bAddFilter == false) {
                            break;
                        }
                    }
                }
                if (bAddFilter) {
                    var ftIndex1B = Liquid.getForeignTableIndex(liquid);
                    var targetLiquid = liquid;
                    if (ftIndex1B) { // work on liquid.foreignTables[].options
                        targetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B - 1].controlId);
                    }
                    var filtersColumns = [ { name:columnName, tooltip:"", label:columnName, row:nCols ? (i / nCols) :'', col:nCols ? (i % nCols) : '', value: filterValue , op: filterOperator } ];
                    var nFilters = isDef(targetLiquid.filtersJson) ? targetLiquid.filtersJson.length : 0;
                    var curFilter = - 1;
                    if (nFilters <= 0) {
                        for (var i = 0; i < nFilters; i++) {
                            if (targetLiquid.filtersJson[i].name == "userFilters") {
                                curFilter = i;
                                break;
                            }
                        }
                    }
                    if (curFilter < 0) {
                        // Creating new filters group
                        var nRows = 0, nCols = 3;
                        var filtersName = ""
                        var newFiltersJson = { name:"userFilters", title:"", tooltip:"", icon:"", nRows:nRows, nCols:nCols, columns:filtersColumns };
                    
                        try {
                            console.log("INFO: new filters json : \n" + JSON.stringify(newFiltersJson));
                        } catch (e) {
                            console.error(e);
                        }
                        // adding the property...
                        Liquid.addProperty(liquid, ftIndex1B, "filters", newFiltersJson);
                    } else {
                        // Add to existing group of filters
                        LiquidEditing.addFilterToGroup(liquid, ftIndex1B, curFilter, filtersColumns, true);
                    }
                }
            } else {
                console.error("ERROR: setFilter() : column '" + columnName + "' not found in control:" + liquid.controlId);
            }
        } else {
            console.error("ERROR: setFilter() : control '" + liquid.controlId + "' not found");
        }
    },
    /**
     * filterMode = 'ReadOnly', 'ReadWrite', 'Write', 'RO', 'RW'
     */
    setFilterMode(obj, columnName, filterMode) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var column = Liquid.getColumn(liquid, columnName);
            if(column) {
                var filtersJson = liquid.filtersJson[liquid.curFilter];
                var bFoundFilter = false;
                for(var iFilter = 0; iFilter<liquid.filtersJson.length; iFilter++) {
                    var filtersJson = liquid.filtersJson[iFilter];
                    if(filtersJson) {
                        for (var i=0; i<filtersJson.columns.length; i++) {
                            if(filtersJson.columns[i].name == columnName) {
                                var element = document.getElementById(liquid.controlId + ".filters." +(iFilter+1) + "." + filtersJson.columns[i].runtimeName + ".filter");
                                if(element) {
                                    bFoundFilter = true;
                                    if(isDef(filterMode)) {
                                        filterMode = filterMode.toUpperCase();
                                        if(filterMode == 'READONLY' || filterMode == 'RO') {
                                            element.disabled = true;                                            
                                        } else if(filterMode == 'READWRITE' || filterMode == 'WRITE' || filterMode == 'RW') {
                                            element.disabled = false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                console.error("ERROR: setFilterMode() : column '"+columnName+"' not found in control:"+liquid.controlId);
            }
        } else {
            console.error("ERROR: setFilterMode() : control '"+liquid.controlId+"' not found");
        }
    },
    setFilterValues(obj, columnName, values) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var column = Liquid.getColumn(liquid, columnName);
            if(column) {
                var filtersJson = liquid.filtersJson[liquid.curFilter];
                var bFoundFilter = false;
                for(var iFilter = 0; iFilter<liquid.filtersJson.length; iFilter++) {
                    var filtersJson = liquid.filtersJson[iFilter];
                    if(filtersJson) {
                        for (var i=0; i<filtersJson.columns.length; i++) {
                            if(filtersJson.columns[i].name == columnName) {
                                filtersJson.columns[i].valuesList = values;                               
                                // Uppdating elemento html
                                var element = document.getElementById(liquid.controlId + ".filters." +(iFilter+1) + "." + filtersJson.columns[i].runtimeName + ".filter");
                                if(element) {
                                    bFoundFilter = true;
                                    if(isDef(values)) {
                                        if(typeof values === "object") {
                                            var html = Liquid.createFilterObject(liquid, null, iFilter, filtersJson.columns[i]);
                                            element.parentNode.innerHTML = html;
                                        } else {
                                            console.error("ERROR: setFilterValues() : values must be an object");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                console.error("ERROR: setFilterValues() : column '"+columnName+"' not found in control:"+liquid.controlId);
            }
        } else {
            console.error("ERROR: setFilterValues() : control '"+liquid.controlId+"' not found");
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
                    table: liquid.tableJson.table,
                    column: columnName,
                    showToast:true,
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
     * @param obj the control id or the class instance (LiquidCtrl)
     * @param ids the list of primary keys
     * @return n/d
     */
    onSetPreFilter:function(obj, ids) {
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
                            Liquid.loadData(liquid, null, "onSetPrefilter");
                        }
                    }
                };
            } catch (e) {
                console.error(e);
            }
        }
    },
    onGridResize:function(liquid, grid) {
        if(liquid) {
            if(grid) {
                var winHeight = grid.containerObj.offsetHeight;
                var winWidth = grid.containerObj.offsetWidth;
                if(winWidth > 0 && winHeight > 0) {
                    if(grid.top === "center") {
                        var top = (0 + winHeight/2.0 - (grid.gridObj.clientHeight > 0 ? grid.gridObj.clientHeight : grid.height.replace("px",""))/2);
                        if(top < 0) top = 0; // avoid scroll problem
                        grid.gridObj.style.top = top+'px';
                    } else {
                        grid.gridObj.style.top = ((grid.top ? grid.top : 0) + 0) + 'px';
                    }                        
                    if(grid.left === "center") {
                        var left = (0 + winWidth/2.0 - (grid.gridObj.clientWidth > 0 ? grid.gridObj.clientWidth : grid.width.replace("px",""))/2);
                        if(left < 0) left = 0; // avoid scroll problem
                        grid.gridObj.style.left = left+'px';
                    } else {
                        grid.gridObj.style.left = (grid.left ? grid.left : 0)+'px';
                    }
                    grid.resizeCounter++;
                }
            }
        }
    },
    onLayoutResize:function(liquid, layout) {
        if(liquid) {
            if(layout) {
                var aggridContainerHeight = (liquid.aggridContainerHeight > 0 ? liquid.aggridContainerHeight : 0);
                if(aggridContainerHeight > 0) {
                    layout.containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    if(!isDef(layout.resizeCounter)) layout.resizeCounter = 0;
                    layout.resizeCounter++;
                }
            }
        }
    },            
    onDocumentResize:function(liquid, document) {
        if(liquid) {
            if(document) {
                var aggridContainerHeight = (liquid.aggridContainerHeight > 0 ? liquid.aggridContainerHeight : 0);
                if(aggridContainerHeight > 0) {
                    document.containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    if(!isDef(document.resizeCounter)) document.resizeCounter = 0;
                    document.resizeCounter++;
                }
            }
        }
    },
    onChartResize:function(liquid, chart) {
        if(liquid) {
            if(chart) {
                var aggridContainerHeight = (liquid.aggridContainerHeight > 0 ? liquid.aggridContainerHeight : 0);
                if(aggridContainerHeight > 0) {
                    chart.containerObj.style.height = (aggridContainerHeight > 0 ? aggridContainerHeight : "0") + "px";
                    if(!isDef(chart.resizeCounter)) chart.resizeCounter = 0;
                    chart.resizeCounter++;
                }
            }
        }
    },
    onGridShow:function(liquid, grid) {
        if(liquid) {
            if(grid) {
                if(isDef(grid.columns)) {
                    for(var ic=0; ic<grid.columns.length; ic++) {
                        var gridObj = grid.columns[ic];
                        if(isDef(gridObj.query)) {
                            if(isDef(gridObj.linkedObj)) {
                                var lookupControlId = gridObj.linkedObj.getAttribute('controlId');
                                if(lookupControlId) {
                                    var lookupLiquid = Liquid.getLiquid(lookupControlId);
                                    if(lookupLiquid) {
                                        if(lookupLiquid.needResize) {
                                            Liquid.onResize(lookupLiquid);
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
    getCaptionTitle:function(liquid) {
        if(liquid) {
            var title = (isDef(liquid.tableJson.title) ? liquid.tableJson.title : (isDef(liquid.tableJson.caption) ? liquid.tableJson.caption : null));
            if(!title && isDef(liquid.tableJson.table))
                title = liquid.tableJson.table;
            return title;
        }
        return "";
    },
    updateCaption:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var rootLiquid = Liquid.getRootLiquid(liquid);
            var descriptonList = [];
            if(isDef(rootLiquid.currentForeignTable)) {
                if(rootLiquid.currentForeignTable < rootLiquid.FTTabList.length) {
                    var FTTab = rootLiquid.FTTabList[rootLiquid.currentForeignTable];
                    if(isDef(FTTab)) {
                        if(isDef(FTTab.controlId)) {
                            var ftLiquid = Liquid.getLiquid(FTTab.controlId);
                            while(isDef(ftLiquid)) {
                                var selectionData = Liquid.getSelectedPrimaryKeys(ftLiquid);
                                var selectionKey = selectionData[0];
                                var unselectionKey = selectionData[1];
                                var columns = null;
                                if(isDef(ftLiquid.tableJson.captionColumn)) {
                                    if(Array.isArray(ftLiquid.tableJson.captionColumn)) {
                                        columns = ftLiquid.tableJson.captionColumn;
                                    } else {
                                        columns = [ ftLiquid.tableJson.captionColumn ];
                                    }
                                } else if(isDef(ftLiquid.tableJson.captionColumns)) {
                                    if(Array.isArray(ftLiquid.tableJson.captionColumns)) {
                                        columns = ftLiquid.tableJson.captionColumns;
                                    } else {
                                        columns = [ ftLiquid.tableJson.captionColumns ];
                                    }
                                } else if(isDef(ftLiquid.tableJson.titleColumn)) {
                                    if(Array.isArray(ftLiquid.tableJson.titleColumn)) {
                                        columns = ftLiquid.tableJson.titleColumn;
                                    } else {
                                        columns = [ ftLiquid.tableJson.titleColumn ];
                                    }
                                } else if(isDef(ftLiquid.tableJson.titleColumns)) {
                                    if(Array.isArray(ftLiquid.tableJson.titleColumns)) {
                                        columns = ftLiquid.tableJson.titleColumns;
                                    } else {
                                        columns = [ ftLiquid.tableJson.titleColumns ];
                                    }
                                }
                                descriptonList.push( { descriptior:"", liquid:ftLiquid, selectionKey:selectionKey, unselectionKey:unselectionKey, columns } );
                                if(ftLiquid.controlId === rootLiquid.controlId) {
                                    break;
                                }
                                ftLiquid = ftLiquid.srcLiquid;
                            }
                        }
                    }
                }
            }
            var desc = "";
            if(descriptonList.length > 0) {
                for(var i=descriptonList.length-1; i>=0; i--) {
                    descriptonList[i].descriptior = Liquid.getSelectionDescription(descriptonList[i]);
                    title = Liquid.getCaptionTitle(descriptonList[i].liquid);
                    desc += (i != descriptonList.length-1 ? " > " : "") + title + " " + descriptonList[i].descriptior;
                }
                var captionId = rootLiquid.controlId + ".caption_title";
                var captionObj = document.getElementById(captionId);
                if(captionObj) {
                    captionObj.title = desc;
                    captionObj.innerHTML = desc;
                }
            }
        }
    },
    setCurrentTab:function(obj, currentTab) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            for(var it=0; it<liquid.tabList.length; it++) {
                var foundTab = false;
                if(typeof currentTab === 'string') {                            
                    if(liquid.tabList[it].name === currentTab || liquid.tabList[it].caption === currentTab) foundTab = true;
                } else if(typeof currentTab === 'number') {
                    if(it === currentTab) foundTab = true;
                }
                delete liquid.currentTab;
                if(foundTab) {
                    if(liquid.gridLoadCounter === 0) { // not yet ready
                        if(!isDef(liquid.sourceData)) liquid.sourceData = {};
                        liquid.sourceData.tempCurrentTab = currentTab;
                        return true;
                    } else {
                        liquid.currentTab = it;
                        Liquid.onGridTab( document.getElementById(liquid.tabList[it].id) );
                        return true;

                    }
                }
            }
            // search in foreign tables tabs
            if(isDef(liquid.foreignTables)) {
                for(var it=0; it<liquid.foreignTables.length; it++) {
                    if(liquid.foreignTables[it]) {
                        if(liquid.foreignTables[it].controlId) {
                            var ftLiquid = Liquid.getLiquid(liquid.foreignTables[it].controlId);
                            if(ftLiquid) {
                                if(Liquid.setCurrentTab(ftLiquid, currentTab)) return true;
                            } else {
                                var controlId = liquid.foreignTables[it].controlId;
                                setTimeout( function() { Liquid.setCurrentTab(controlId, currentTab); }, 200 );
                                // console.error("ERROR: liquid control '"+liquid.foreignTables[it].controlId+"' not found ... maybe not yet load");
                            }
                        }
                    }
                }
            }
        }
        return false;
    },
    changeCurrentGridTab:function(liquid, obj) {
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
    onGridTab:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var doResize = false;
            var bRestoreList = false;
            Liquid.changeCurrentGridTab(liquid, obj);
            var grid_coords = Liquid.getGridCoords(liquid, liquid.lastGridTabObj.id);
            if(grid_coords) {
                var gridObject = null;
                if(isDef(grid_coords.gridIndex)) {
                    liquid.currentTab = grid_coords.gridIndex+1;
                }
                if(grid_coords.grid) {
                    gridObject = grid_coords.grid;
                    if(!grid_coords.grid.resizeCounter) { // need resize ?
                        doResize = true;
                    }
                    Liquid.onGridShow(liquid, grid_coords.grid);
                } else if(grid_coords.layout) {
                    gridObject = grid_coords.layout;
                    if(!grid_coords.layout.resizeCounter) { // need resize ?
                        doResize = true;
                    }
                if(isDef(Liquid.onLayoutShow))
                    Liquid.onLayoutShow(liquid, grid_coords.layout);
                } else if(grid_coords.document) {
                    gridObject = grid_coords.document;
                    if(!grid_coords.document.resizeCounter) { // need resize ?
                        doResize = true;
                    }
                if(isDef(Liquid.onDocumentShow))
                    Liquid.onDocumentShow(liquid, grid_coords.document);
                } else if(grid_coords.chart) {
                    gridObject = grid_coords.chart;
                    if(!grid_coords.chart.resizeCounter) { // need resize ?
                        doResize = true;
                    }
                if(isDef(Liquid.onChartShow))
                    Liquid.onChartShow(liquid, grid_coords.chart);
                }
                if(gridObject) {
                    bRestoreList = Liquid.resizeIfDocked(liquid, gridObject);
                } else {
                    bRestoreList = true;
                }
            } else {
                // The list ...
                liquid.currentTab = 0;
                bRestoreList = true;
            }
            if(bRestoreList) {
                Liquid.setAggrigParent(liquid, null, null);
            }
            if(doResize) {
                setTimeout(function () { Liquid.onResize(liquid); }, 50 );
            }        
        }
    },resizeIfDocked:function(liquid, gridObject) {
        var bRestoreList = false;
        if(isDef(liquid)) {
                    if(isDef(gridObject.dock)) {
                        var parentNode = null;
                        if(gridObject.dock.side === 'left') {
                            liquid.dockerTblLeft.style.display = '';
                            parentNode = liquid.dockerTblLeft;
                            if(isDef(gridObject.dock.size)) {
                                liquid.dockerTblLeft.style.width = gridObject.dock.size;
                            }
                            if(isDef(gridObject.dock.minSize)) {
                                if(liquid.dockerTblLeft.style.offsetWidth < gridObject.dock.minSize) {
                                    liquid.dockerTblLeft.style.width = gridObject.dock.minSize;
                                }
                            }
                        } else if(gridObject.dock.side === 'right') {
                            liquid.dockerTblRight.style.display = '';
                            parentNode = liquid.dockerTblRight;
                        }
                        if(isDef(gridObject.dock.size)) {                                
                            parentNode.style.width = gridObject.dock.size;
                        }
                        if(parentNode) {
                            Liquid.setAggrigParent(liquid, parentNode, gridObject.dock);
                        } else {
                            bRestoreList = true;
                        }
                    } else {
                        bRestoreList = true;
                    }
                }
        return bRestoreList;
    },
    setAggrigParent:function(obj, parentNode, dock) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(parentNode) {
                if(isDef(dock)) {
                    if(isDef(dock.minWidth)) {
                        if(parentNode.offsetWidth < dock.minWidth) {
                            dock.parentNodeLastWidth = parentNode.style.width;
                            parentNode.style.width = dock.minWidth + "px";
                        }
                    }
                    if(isDef(dock.width)) {
                        if(parentNode.offsetWidth != dock.width) {
                            dock.parentNodeLastWidth = parentNode.style.width;
                            parentNode.style.width = dock.width + "px";
                        }
                    }
                    if(isDef(dock.minHeight)) {
                        if(parentNode.offsetHeight < dock.minHeight) {
                            dock.parentNodeLastHeight = parentNode.style.height;
                            parentNode.style.height = dock.minHeight + "px";
                        }
                    }
                    if(isDef(dock.height)) {
                        if(parentNode.offsetHeight != dock.height) {
                            dock.parentNodeLastHeight = parentNode.style.height;
                            parentNode.style.height = dock.height + "px";
                        }
                    }
                    if(isDef(dock.columns)) {
                        if(isDef(liquid.gridOptions)) {
                            if(isDef(liquid.gridOptions.api)) {
                                var allColumns = liquid.gridOptions.columnApi.getAllColumns();
                                if(allColumns && allColumns.length) {
                                    var columnsToHide = [];
                                    for(var i = 0; i < allColumns.length; i++) {
                                        columnsToHide.push( allColumns[i].colId );
                                    }
                                    liquid.gridOptions.columnApi.setColumnsVisible(columnsToHide, false);
                                    for(var i = 0; i < allColumns.length; i++) {
                                        var agGridColumn = allColumns[i];
                                        if(isDef(agGridColumn.field)) {
                                            var field = Number(agGridColumn.field);
                                            var column = liquid.tableJson.columns[field-1];
                                            if(column.name != agGridColumn.name) {
                                                console.error("setAggrigParent() : mis-handled column : " + column.name + " / " + agGridColumn.column);
                                            }
                                            column.colId = agGridColumn.colId;
                                            for(var j = 0; j < dock.columns.length; j++) {
                                                var label = null;
                                                var width = null;
                                                if(typeof dock.columns[j] === 'string') {
                                                    label = dock.columns[j];
                                                    if(label === column.name) {
                                                        liquid.gridOptions.columnApi.setColumnsVisible( [agGridColumn.colId], true);
                                                        break;
                                                    }
                                                } else {
                                                    label = dock.columns[j].name;
                                                    width = dock.columns[j].width;
                                                    if(label === column.name) {
                                                        if(dock.columns[j].visible !== false) {
                                                            liquid.gridOptions.columnApi.setColumnsVisible( [agGridColumn.colId], true);
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        } else {
                                            // column already not visible
                                        }
                                    }
                                }
                            }
                        }                                    
                    }
                    dock.parentNode = parentNode;
                    liquid.currentDock = dock;
                }
                parentNode.appendChild(liquid.listObj);
                /*
                for(var i=0; i<liquid.listObj.classList.length; i++) {
                    if(!parentNode.classList.contains(liquid.listObj.classList[i])) {
                        parentNode.classList.add(liquid.listObj.classList[i]);
                    }
                }
                */
                liquid.aggridContainerLastHeight = liquid.aggridContainerObj.style.height;
                // set at max height
                liquid.aggridContainerObj.style.height = "100%";
                liquid.aggridContainerDocked = true;
            } else {
                liquid.listRootObj.appendChild(liquid.listObj);
                if(isDef(liquid.currentDock)) {
                    if(isDef(liquid.currentDock.columns)) {
                        for(var j=0; j<liquid.tableJson.columns.length; j++) {
                            if(isDef(liquid.tableJson.columns[j].colId)) {
                                if(liquid.tableJson.columns[j].visible !== false) {
                                    liquid.gridOptions.columnApi.setColumnsVisible( [liquid.tableJson.columns[j].colId], true);
                                } else {
                                    liquid.gridOptions.setColumnsVisible( [liquid.tableJson.columns[j].colId], false);
                                }
                            }
                        }
                    }
                    if(liquid.currentDock.parentNode) {
                        liquid.currentDock.parentNode.style.width = liquid.currentDock.parentNodeLastWidth;
                        liquid.currentDock.parentNode.style.height = liquid.currentDock.parentNodeLastHeight;
                    }
                }
                if(isDef(liquid.currentDock)) {
                    if(isDef(liquid.currentDock.width)) {
                        liquid.currentDock.width = parentNode.offsetWidth;
                    }
                    if(isDef(liquid.currentDock.height)) {
                        liquid.currentDock.height = parentNode.offsetHeight;
                    }
                }
                // restore center docker
                if(liquid.outDivObj.offsetWidth > 0) {
                    liquid.dockerTblCenter.style.width = (liquid.outDivObj.offsetWidth - liquid.dockerTblRight.offsetWidth - liquid.dockerTblLeft.offsetWidth) + "px";
                }
                liquid.aggridContainerObj.style.height = liquid.aggridContainerLastHeight;
                liquid.aggridContainerDocked = false;
                liquid.currentDock = null;
            }
        }
    },
    onLayoutTab:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.tableJson.layouts) {
                Liquid.changeCurrentGridTab(liquid, obj);
                var lay_coords = Liquid.getLayoutCoords(liquid, obj);
                if(lay_coords) {
                    if(lay_coords.layout) {
                        if(lay_coords.layout.pendingLink) {
                            Liquid.refreshLayout(liquid, lay_coords.layout, true);
                            Liquid.onLayoutMode(lay_coords.layout.containerObj, null, "readonly");
                        } else if(lay_coords.layout.pendingRefresh) {                            
                            Liquid.refreshLayout(liquid, lay_coords.layout, false);
                            Liquid.onLayoutMode(lay_coords.layout.containerObj, null, "readonly");
                        }
                    }
                    if(liquid.tableJson.layouts[lay_coords.layout]) {
                        bRestoreList = Liquid.resizeIfDocked(liquid, liquid.tableJson.layouts[lay_coords.layout]);
                    } else {
                        bRestoreList = true;
                    }
                    if(bRestoreList) {
                        Liquid.setAggrigParent(liquid, null, null);
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
    onLayoutMode:function(obj, currentRow, mode) {
        var layIndex = -1;
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var nameItems = obj.id.split(".");
            if(nameItems.length > 2) {
                layIndex = nameItems[2] - 1;
                if(layIndex >= 0 && layIndex < liquid.tableJson.layouts.length) {
                    var layout = liquid.tableJson.layouts[layIndex];
                    if(layout.rowsContainer) {
                        for(var ir=0; ir<layout.rowCount; ir++) {
                            if(isDef(layout.rowsContainer[ir])) {
                                if(isDef(layout.rowsContainer[ir].objs)) {
                                    for(var ic=0; ic<layout.rowsContainer[ir].objs.length; ic++) {
                                        var processRow = true;
                                        if(!isDef(currentRow) || currentRow < 0 || currentRow == ir) {
                                            if(layout.rowsContainer[ir].isAdding) {
                                                if(currentRow != ir) {
                                                    // put readonly the adding row only by expliic call
                                                    processRow = false;
                                                }
                                            }
                                        } else {
                                            processRow = false;
                                        }
                                        if(processRow) {
                                            var itemObj = layout.rowsContainer[ir].objs[ic];
                                            var itemInputObj = layout.rowsContainer[ir].objsInput[ic];
                                            var itemSourceObj = layout.rowsContainer[ir].objsSource[ic];
                                            var itemResetObj = layout.rowsContainer[ir].objsReset[ic];
                                            var itemReloadObj = layout.rowsContainer[ir].objsReload[ic];
                                            var col = layout.rowsContainer[ir].cols[ic];
                                            var itemObj = itemInputObj ? itemInputObj : itemObj;
                                            if(itemObj) {
                                                if(mode === "write") {
                                                    if(col.readonly !== true) {
                                                        if(typeof col.foreignTable === 'undefined'
                                                                || !col.foreignTable
                                                                || col.foreignEdit === true
                                                                || col.foreignEdit === 'y'
                                                                || col.lookup !== 'undefined'
                                                                ) {
                                                            Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "write");
                                                        } else {
                                                        }
                                                    } else {
                                                        Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "readonly");
                                                    }
                                                } else {
                                                    Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], mode);
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
                    if(gdIndex >= 0) {
                        var grid = liquid.tableJson.grids[gdIndex];
                        if(isDef(grid.columns)) {
                            for(var ic=0; ic<grid.columns.length; ic++) {
                                Liquid.setGridFieldAsChanged(liquid, grid.columns[ic], false);
                                var itemObj = Liquid.getItemObj(grid.columns[ic]);
                                var itemInputObj = Liquid.getItemInputObj(grid.columns[ic]);
                                var itemSourceObj = Liquid.getItemSourceObj(grid.columns[ic]);
                                var itemResetObj = Liquid.getItemResetObj(grid.columns[ic]);
                                var itemReloadObj = Liquid.getItemReloadObj(grid.columns[ic]);
                                var col = grid.columns[ic].colLink1B > 0 ? liquid.tableJson.columns[grid.columns[ic].colLink1B - 1] : null;
                                if(itemObj) {
                                    if(mode === "write") {
                                        if(col) {
                                            if(col.readonly !== true && grid.columns[ic].readonly !== true) {
                                                if(typeof col.foreignTable === 'undefined'
                                                        || !col.foreignTable
                                                        || col.foreignEdit === true
                                                        || col.foreignEdit === 'y'
                                                        || col.lookup !== 'undefined'
                                                        ) {
                                                    Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "write");
                                                } else {
                                                    Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "readonly");
                                                }
                                            } else {
                                                Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "readonly");
                                            }
                                        } else {
                                            Liquid.handleGrigObjectMode(liquid, [itemObj, itemInputObj], [itemSourceObj, itemResetObj, itemReloadObj], "readonly");
                                        }
                                    } else {
                                        Liquid.handleGrigObjectMode(liquid, [itemObj], [itemSourceObj, itemResetObj, itemReloadObj], mode);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return gdIndex;
    },
    handleGrigObjectMode:function(liquid, itemObjs, itemCommandObjs, mode) {
        if(itemObjs) {
            var itemSourceObj = itemCommandObjs[0], itemResetObj = itemCommandObjs[1], itemReloadObj = itemCommandObjs[2];
            for(var io=0; io<itemObjs.length; io++) {
                var itemObj = itemObjs[io];
                if(itemObj) {
                    if(mode === "write") {
                        itemObj.classList.remove('liquidGridControlRO');
                        itemObj.classList.remove('liquidGridControlDel');
                        itemObj.classList.add('liquidGridControlRW');
                        try { itemObj.readOnly = false; } catch (e) { }
                        try { itemObj.disabled = false; } catch (e) { }
                        try { itemObj.draggable = false; } catch (e) { }
                        try { itemObj.parentNode.draggable = false; } catch (e) { }
                        try { itemObj.parentNode.parentNode.draggable = false; } catch (e) { }
                        if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; itemResetObj.style.width = '16px'; }
                        if(itemReloadObj) { itemReloadObj.disabled = false; itemReloadObj.style.filter = ''; itemReloadObj.style.width = '16px'; }
                        if(itemObj.classList.contains("liquidLookup")) {
                            for(var j=0; j<itemObj.parentNode.childNodes.length; j++) {
                                var obj = itemObj.parentNode.childNodes[j];
                                if(obj.classList.contains("liquidLookupIconContainer")) {                
                                    jQ1124(obj).animate( { zoom:1, top:-14}, 300, function(){ 
                                        obj.style.filter = "grayscale(0.0)";
                                        obj.style.boxShadow = "";
                                    });
                                }
                            }
                        }
                    } else {
                        itemObj.classList.remove('liquidGridControlRW');
                        itemObj.classList.remove('liquidGridControlDel');
                        itemObj.classList.add('liquidGridControlRO');
                        try { itemObj.readOnly = true; } catch (e) { }
                        try { itemObj.disabled = true; } catch (e) { }
                        try { itemObj.draggable = true; } catch (e) { }
                        try { itemObj.parentNode.draggable = true; } catch (e) { }
                        try { itemObj.parentNode.parentNode.draggable = true; } catch (e) { }
                        try { if(Liquid.projectMode) itemObj.draggable = true; } catch (e) { }
                        if(itemResetObj) { itemResetObj.disabled = false; itemResetObj.style.filter = ''; itemResetObj.style.width = '0px'; }
                        if(itemReloadObj) { itemReloadObj.disabled = false; itemReloadObj.style.filter = ''; itemReloadObj.style.width = '0px'; }
                        if(mode === "delete") {
                            itemObj.classList.add('liquidGridControlDel');
                        } else {
                            itemObj.classList.remove('liquidGridControlDel');
                        }
                        if(itemObj.classList.contains("liquidLookup")) {
                            for(var j=0; j<itemObj.parentNode.childNodes.length; j++) {
                                var obj = itemObj.parentNode.childNodes[j];
                                if(obj.classList.contains("liquidLookupIconContainer")) {
                                    jQ1124(obj).animate( { zoom:0.6, top:0 }, 300, function(){ 
                                        obj.style.filter = "grayscale(0.6)";
                                        obj.style.right = "";
                                        obj.style.boxShadow = "";
                                        // obj.style.boxShadow = "rgb(167, 167, 167) 5px 5px 7px 1px"; 
                                        });
                                }
                            }
                        }
                    }
                }
            }
        }
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
    refreshAll:function(obj, event, reason) {
        var liquid = Liquid.getLiquid(obj);
        Liquid.refreshGrids(liquid, event ? event.data : null, reason);
        Liquid.refreshLayouts(liquid, false);
        Liquid.refreshDocuments(liquid, false);
        Liquid.refreshCharts(liquid, false);
    },
    refreshGrids:function(obj, data, reason) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.tableJson.grids) {
                if(liquid.tableJson.grids.length > 0) {
                    for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                        Liquid.onGridRefresh(liquid, liquid.tableJson.grids[ig], data, reason);
                    }
                }
            }
        }
    },
    onGridRefresh:function(liquid, grid, data, reason) {
        if(grid) {
            if(grid.columns) {
                if(typeof data === 'undefined' || !data) {
                    var selNodes = Liquid.getCurNodes(liquid);
                    if(selNodes)
                        if(selNodes.length)
                            data = selNodes[0].data;
                }
                if(isDef(grid.columns)) {
                    for(var ic=0; ic<grid.columns.length; ic++) {
                        if(grid.columns[ic].linkedObj) {
                            Liquid.onGridRefreshField(liquid, grid, grid.columns[ic], data, reason);
                        }
                    }
                }
            }
        }
    },
    onGridRefreshField:function(liquid, grid, gridObj, data, reason) {
        if(liquid) {
            try {
                if(gridObj.colLink1B > 0) {
                    var itemObj = Liquid.getItemObj(gridObj);
                    var iCol = gridObj.colLink1B - 1;
                    var value = "";
                    if(data) {
                        if(iCol < liquid.tableJson.columns.length) {
                            if(Liquid.isDate(liquid.tableJson.columns[iCol].type)) {
                                value = data[liquid.tableJson.columns[iCol].field];
                            } else {
                                value = data[liquid.tableJson.columns[iCol].field];
                            }                            
                        }
                        Liquid.setHTMLElementValue(itemObj, value);
                    }
                } else {
                    // not linked to column
                    if(isDef(gridObj.query)) {
                        if(isDef(gridObj.linkedObj)) {
                            var lookupControlId = gridObj.linkedObj.getAttribute('controlId');
                            if(lookupControlId) {
                                var lookupLiquid = Liquid.getLiquid(lookupControlId);
                                if(isDef(lookupLiquid.tableJson.queryParamsMap)) { // look for query dependencies type
                                    var queryParamsMap = lookupLiquid.tableJson.queryParamsMap;
                                    if(isDef(queryParamsMap.queryParams)) {
                                        for(var i=0; i<queryParamsMap.queryParams.length; i++) {
                                            var queryParam = queryParamsMap.queryParams[i];
                                            if(isDef(queryParam.types)) {
                                                for(var ip=0; ip<queryParam.types.length; ip++) {
                                                    if(queryParam.types[ip] === "liquid.field") {
                                                        // re-execute query
                                                        Liquid.loadData(lookupLiquid, null, "refreshLinkedQuery");
                                                        return;
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
            } catch(e) { console.error("ERROR: onGridRefreshField() : "+e); }
        }
    },
    onGridContainerSizeChanged:function(obj, params) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.outDivObj) {
                if(isDef(params)) {
                    if(params.clientWidth <= 0) {
                        return;
                    }
                }
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
                            // liquid.gridOptions.columnApi.setColumnsVisible(columnsToShow, true);
                            // liquid.gridOptions.columnApi.setColumnsVisible(columnsToHide, false);
                            if(liquid.tableJson.autoSizeColumns === true) {
                                params.columnApi.autoSizeAllColumns(true);
                                var colsState = params.columnApi.getColumnState();
                                for(var i = 0; i < liquid.tableJson.columns.length; i++) {
                                    var width = colsState[i].width;
                                    params.columnApi.setColumnWidth(allColumns[i], (width > 0 ? width+5 : 0), finished=true);
                                }
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
                        Liquid.loadData(liquid.linkedLiquids[i], null, liquid.controlId+".refreshLinkedLiquid");
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
            if(liquidsToRefresh[i].tableJson.autoSelect !== true) {
                var curNodes = Liquid.getCurNodes(liquidsToRefresh[i]);
                Liquid.updateSelectionData(liquidsToRefresh[i]);
                Liquid.refreshGrids(liquidsToRefresh[i], curNodes && curNodes.length ? curNodes[0].data : null, "refreshLinked");
                Liquid.resetLayoutsContent(liquidsToRefresh[i], false, false);
                // Liquid.refreshLayouts(liquidsToRefresh[i], false);
                Liquid.refreshDocuments(liquidsToRefresh[i], false);
                Liquid.refreshCharts(liquidsToRefresh[i], false);
            } else {
                Liquid.resetLayoutsContent(liquidsToRefresh[i], false, false);
            }
        }
        Liquid.setForeignTablesModeCascade(liquidRoot);
    },
    // return 0 in non Input or TEXTAREA
    setHTMLElementValue:function(targetObj, value, disabled) {
        if(targetObj) {            
            if(targetObj.nodeName.toUpperCase() === 'INPUT' || targetObj.nodeName.toUpperCase() === 'TEXTAREA') {
                if(targetObj.type === 'checkbox') {
                    targetObj.checked = (value === 'true' || value === true || value === '1' ? true : false);
                } else if(targetObj.type === 'file') {
                    console.warn("WARNING : cannot set file of a form element " + targetObj.id);
                } else {                
                    if(targetObj.type === 'number') if (isDef(value)) if(isNaN(Number(value))) value = value.replace(/\,/g, ".");
                    targetObj.value = value
                }
                if(isDef(disabled)) targetObj.disabled = disabled;                    
                return 1;
            } else if(targetObj.nodeName.toUpperCase() === 'DIV' || targetObj.nodeName.toUpperCase() === 'SPAN' || targetObj.nodeName.toUpperCase() === 'TD' || targetObj.nodeName.toUpperCase() === 'P') {
                jQ1124(targetObj).html(value);
                // targetObj.innertHTML = value;
                // targetObj.innerText = String(value);
                if(isDef(disabled)) targetObj.disabled = disabled;
                return 0;
            } else {
                console.error("Unknown control type : " + targetObj.nodeName);
                targetObj.innerHTML = value;
            }
        }
    },            
    setAutoresizeColumn:function(obj, processChildren) {
        var liquid = Liquid.getLiquid(obj);
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
                var cRow  = document.getElementById(liquid.controlId + ".cRow");
                var nRows = document.getElementById(liquid.controlId + ".nRows");
                var cPage  = document.getElementById(liquid.controlId + ".cPage");
                var nPages  = document.getElementById(liquid.controlId + ".nPages");

                if(cRow) cRow.innerHTML = liquid.cRow + 1 + (liquid.pageSize > 0 ? liquid.cPage * liquid.pageSize : 0);
                if(nRows) nRows.innerHTML = liquid.nRows;
                if(cPage) cPage.value = liquid.cPage + 1;
                if(cPage) cPage.max = liquid.nPages;
                if(nPages) nPages.innerHTML = liquid.nPages;
                
                var prev = document.getElementById(liquid.controlId + ".prev");
                var first = document.getElementById(liquid.controlId + ".first");
                var next = document.getElementById(liquid.controlId + ".next");
                var last = document.getElementById(liquid.controlId + ".last");
                if(liquid.cPage+1 === liquid.nPages) {
                    if(next) {
                        with(next)
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    }
                    if(last) {
                        with(last)
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    }
                } else {
                    if(next) {
                        with(next)
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    }
                    if(last) {
                        with(last)
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    }
                }
                if(liquid.cPage === 0) {
                    if(prev) {
                        with(prev)
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    }
                    if(first) {
                        with(first)
                            style.color = "darkGray",
                            style.cursor = "not-allowed",
                            disabled = true;
                    }
                } else {
                    if(prev) {
                        with(prev)
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    }
                    if(first) {
                        with(first)
                            style.color = "",
                            style.cursor = "",
                            disabled = false;
                    }
                }
            }
        }
    },
    isAddingNode:function(liquid, rowIndex, nodes, bCheckCommand) {
        if(rowIndex+0 === liquid.nRows) {
            if(rowIndex < nodes.length) {
                if(liquid.addingNode) {
                    if(liquid.addingNode.id === nodes[rowIndex].id) {
                        if(bCheckCommand) {
                            if(isDef(liquid.currentCommand)) {
                                if(liquid.currentCommand.name === "insert") {
                                    if(liquid.currentCommand.step <= Liquid.CMD_VALIDATE) {
                                        return true;
                                    }
                                }
                            }
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
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
                this.titleShowTimeout = null;
            });
        }
    },
    dbtoHtmlDate:function(date) {
        return Liquid.dbtoHtmlDateFunc(date, Liquid.dateSep, Liquid.dateSep);
    },
    dbtoHtmlDateFunc:function(date, in_sep, out_sep) {
        try {
            if(isDef(date)) {
                var dateArray = date.split(' ');
                var year = dateArray[0].split(in_sep);
                var time = dateArray.length > 1 && dateArray[1] ? dateArray[1].split(Liquid.timeSep) : null;
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
        if(dateStr != null && dateStr.length) {
            var dt_parts = dateStr.split(" ");
            var d_parts = dt_parts[0].split(Liquid.dateSep);
            if(dt_parts.length > 1) {
                var t_parts = dt_parts[1].split(Liquid.timeSep);
                return new Date(d_parts[2], d_parts[1] - 1, d_parts[0], t_parts[0], t_parts[1], t_parts[2]);
            } else {
                return new Date(d_parts[2], d_parts[1] - 1, d_parts[0]);
            }
        } else {
            return new Date();
        }
    },
    fieldService:function(liquidControlOrId, field, newValue) {
        if(liquidControlOrId) {
            var foundRow1B = 0;
            var liquid = Liquid.getLiquid(liquidControlOrId);
            var data = null;
            var col =  null;
            if(liquidControlOrId instanceof HTMLElement) {
                foundRow1B = liquidControlOrId.getAttribute('linkedrow1b');
                if(foundRow1B) {
                    nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    data = nodes[foundRow1B-1].data;
                    col = Liquid.getColumn(liquid, field);
                }
            } else {
                var selNodes = Liquid.getCurNodes(liquid.srcLiquid);
                if(selNodes) {
                    if(selNodes.length) {
                        data = selNodes[0].data;
                        col = Liquid.getColumn(liquid, field);
                    }
                }            
            }
            if(data) {
                if(col) {
                    if(isDef(newValue)) {                            
                    }
                    return data[col.field];
                } else {
                    console.error("ERROR: field '"+field+"' not found in "+liquid.controlId);
                }
            }
        }
    },
    getField:function(liquidControlOrId, field) {
    },
    setField:function(liquidControlOrId, field, value) {
    },
    insertRow:function(liquidControlOrId) {
        if(liquidControlOrId) {
            var liquid = Liquid.getLiquid(liquidControlOrId);
            if(liquid) {
                if(isDef(liquid.currentCommand) && (liquid.currentCommand.name === "" || liquid.currentCommand.name === "insert")
                    || !isDef(liquid.currentCommand)
                    ) {
                    Liquid.onButton(liquid, { name:"insert" });
                } else {
                    Liquid.dialogBox( (liquid ? (liquid.parentObj ? liquid.parentObj : liquid.outDivObj) : liquid.outDivObj) ,
                                    "ERROR", 
                                    (Liquid.lang === 'eng' ? "Cannot break current command:"+liquid.currentCommand.name : "Interruzione comando corrente :"+liquid.currentCommand.name+" non supportata"),
                                    { text:"Ok", func:function() { } }, 
                                    );
                }
                return true;
            }
        }
        return false;
    },
    updateRow:function(liquidControlOrId, primaryKeyValue, bSenstivaCase) {
        var foundRow1B = Liquid.searchRow(liquidControlOrId, primaryKeyValue, bSenstivaCase);
        if(foundRow1B) {
            var liquid = Liquid.getLiquid(liquidControlOrId);
            if(liquid) {
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                if(foundRow1B <= nodes.length) {
                    var node = nodes[foundRow1B-1];
                    if(node) {
                        // set selected
                        if(isDef(liquid.currentCommand)) {
                            if(!node.isSelected()) {
                                // rollback
                                Liquid.onButton(liquid, { name:"return" });

                                node.setSelected(true);
                                setTimeout( function(){ 
                                    Liquid.updateRow(liquidControlOrId, primaryKeyValue, bSenstivaCase);
                                }, 500 );

                                return;
                            }
                        }
                        if(!node.isSelected()) {
                            // implicit refresh to layout to to row change
                            node.setSelected(true);
                            Liquid.processNodeSelected(liquid, node, node.isSelected());
                        }
                        // update current row in layputs
                        if(isDef(liquid.tableJson.layouts)) {
                            for(var il=0; il<liquid.tableJson.layouts.length; il++) {
                                var layout = liquid.tableJson.layouts[il];
                                layout.currentRow1B = foundRow1B;
                            }
                        }
                        if(isDef(liquid.currentCommand) && (liquid.currentCommand.name === "" || liquid.currentCommand.name === "update")
                            || !isDef(liquid.currentCommand)
                            ) {
                            Liquid.onButton(liquid, { name:"update" });
                        } else {
                            Liquid.dialogBox( (liquid ? (liquid.parentObj ? liquid.parentObj : liquid.outDivObj) : liquid.outDivObj) ,
                                            "ERROR", 
                                            (Liquid.lang === 'eng' ? "Cannot break current command:"+liquid.currentCommand.name : "Interruzione comando corrente :"+liquid.currentCommand.name+" non supportata"),
                                            { text:"Ok", func:function() { } }, 
                                            );
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    },
    rollback:function(liquidControlOrId) {
        var liquid = Liquid.getLiquid(liquidControlOrId);
        if(liquid) {
            Liquid.onButton(liquid, { name:"return" });
            return true;
        }
        return false;
    },
    deleteRow:function(liquidControlOrId, primaryKeyValue, bSenstivaCase) {
        var foundRow1B = Liquid.searchRow(liquidControlOrId, primaryKeyValue, bSenstivaCase);
        if(foundRow1B) {
            var liquid = Liquid.getLiquid(liquidControlOrId);
            if(liquid) {
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                if(foundRow1B <= nodes.length) {
                    var node = nodes[foundRow1B-1];
                    if(node) {
                        if(node.isSelected()) {
                            Liquid.refreshAll(liquid, event, "selectionChange");
                        } else {
                            node.setSelected(true);
                            Liquid.processNodeSelected(liquid, node, node.isSelected());
                        }
                        Liquid.processNodeSelected(liquid, node, node.isSelected());
                        liquid.deletingNodes = [ node ];
                        Liquid.command(liquid, "delete");
                        return true;
                    }
                }
            }
        }
        return false;
    },
    selectRow:function(liquidControlOrId, primaryKeyValue, bSenstivaCase) {
        var foundRow1B = Liquid.searchRow(liquidControlOrId, primaryKeyValue, bSenstivaCase);
        if(foundRow1B) {
            var liquid = Liquid.getLiquid(liquidControlOrId);
            if(liquid) {
                var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                if(foundRow1B <= nodes.length) {
                    var node = nodes[foundRow1B-1];
                    if(node) {
                        if(node.isSelected()) {
                            if(liquid.tableJson.autoSelect) {
                                // trigger selection anaway if row was autoselected
                                node.setSelected(false);
                                liquid.lastSelectedId = null;
                            }
                        }
                        node.setSelected(true);
                        Liquid.processNodeSelected(liquid, node, node.isSelected());
                        return true;
                    }
                }
            }
        }
        return false;
    },
    searchRow:function(liquidControlOrId, primaryKeyValue, bSenstivaCase) {
        if(liquidControlOrId) {
            if(isDef(primaryKeyValue)) {
                var liquid = Liquid.getLiquid(liquidControlOrId);
                if(liquid) {
                    nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    if(bSenstivaCase !== true) primaryKeyValue = primaryKeyValue.toUpperCase();
                    for(var i=0; i<nodes.length; i++) {
                        var id = nodes[i].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
                        var bFoundRow = false;
                        if(bSenstivaCase === true) {
                            if(id === primaryKeyValue) {
                                bFoundRow = true;
                            }
                        } else {
                            if(id.toUpperCase() === primaryKeyValue) {
                                bFoundRow = true;
                            }
                        }
                        if(bFoundRow) {                    
                            return i+1;
                        }
                    }
                    // TODO: maybe put of page, getting it from the server ...
                }
            } else {
                if(liquidControlOrId instanceof HTMLElement) {
                    foundRow1B = liquidControlOrId.getAttribute('linkedrow1b');
                    if(foundRow1B) {
                        return foundRow1B;
                    }
                }
            }
        }
    },
    createNewRowData:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var newData = {};
            for(var ic=0; ic<liquid.tableJson.columns.length; ic++) {
                var col = liquid.tableJson.columns[ic];
                Liquid.solveExpressionField(col, "default", liquid);
                newData[col.field] = (isDef(col.default) ? col.default : "");
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
            if(liquid.addingNode === null || typeof liquid.addingNode === 'undefined') { 
                // if not already done
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
                            if(col.isReflected !== true || isDef(col.default)) {
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
                    // liquid.nRows = nodes.length;
                    // recompute selection (incule/excluded)
                    Liquid.processNodeSelected(liquid, liquid.addingNode, true);
                    
                    // Disable all foreign tables children of
                    Liquid.setForeignTablesDisableCascade(liquid);                    
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
                } else {
                    // force refresh
                    Liquid.refreshAll(liquid, null, "selectionChange");
                }
                liquid.nRows = nodes.length;
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
            } else {
                liquid.selection.all = false;
            }
            liquid.selection.exclude = [];
            liquid.selection.include = [];
            liquid.selection.excludeObjectId = [];
            liquid.selection.includeObjectId = [];
        }
    },
    processNodeSelected:function(liquid, node, bSelected) {
        if(liquid) {
            var id = node.data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1" ];
            var __objectId = node.__objectId;
            var index = null;
            if(liquid.selection.all) {
                if(bSelected) {
                    if(liquid.gridOptions.rowSelection === "multiple") {
                        index = liquid.selection.exclude.indexOf(id);
                        if(index >= 0) liquid.selection.exclude.splice(index, 1);
                        index = liquid.selection.excludeObjectId.indexOf(__objectId);
                        if(index >= 0) liquid.selection.excludeObjectId.splice(index, 1);
                    }
                } else {                    
                    index = liquid.selection.exclude.indexOf(id);
                    if(index < 0) liquid.selection.exclude.push(id);
                    index = liquid.selection.excludeObjectId.indexOf(__objectId);
                    if(index < 0) liquid.selection.excludeObjectId.push(__objectId);
                    if(liquid.selection.exclude.length >= liquid.nRows) {
                        liquid.selection.all = false;
                        liquid.selection.include = [];
                        liquid.selection.includeObjectId = [];
                        liquid.selection.exclude = [];
                        liquid.selection.excludeObjectId = [];
                    }
                }
            } else {
                if(bSelected) {
                    if(liquid.gridOptions.rowSelection !== "multiple") {
                        liquid.selection.include = [];
                        liquid.selection.includeObjectId = [];
                    }
                    index = liquid.selection.include.indexOf(id);
                    if(index < 0) liquid.selection.include.push(id);
                    index = liquid.selection.include.indexOf(__objectId);
                    if(index < 0) liquid.selection.includeObjectId.push(__objectId);                    
                } else {                    
                    index = liquid.selection.include.indexOf(id);
                    if(index >= 0) liquid.selection.include.splice(index, 1);
                    index = liquid.selection.include.indexOf(__objectId);
                    if(index < 0) liquid.selection.includeObjectId.splice(index, 1);
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
                    if(index < 0) {
                        Liquid.addMirrorEvent(liquid, nodes[i]);
                        nodes[i].setSelected(true);
                    }
                } else {                    
                    var index = liquid.selection.include.indexOf(id);
                    if(index >= 0) {
                        Liquid.addMirrorEvent(liquid, nodes[i]);
                        nodes[i].setSelected(true);
                    }
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
                    +'&jSON=' + encodeURIComponent( JSON.stringify( { response:(typeof response !== 'undefined' ? String(response) : ""), cypher:curMessageInfo.cypher } ) )
                    );
            xhr.send();
        }
    },            
     /**
      * 
      * @param {type} htmlId
      * @param {type} callback (function callbackDialog(btnName) ... )
      * @returns {dialog gabdler)
      */
    Popup:function( htmlId, callback ) {
        
        var dialog = new Pupup(htmlId, callback);

        // Show Dialog Box
	dialog.showDialog();
        
        return dialog;
        
    },

    /**
        if(title.indexOf("QUESTION")>=0) icon = Liquid.getImagePath("question.png");
        if(title.indexOf("ERROR")>=0) icon = Liquid.getImagePath("error.png");
        if(title.indexOf("WARNING")>=0) icon = Liquid.getImagePath("warning.png");
        if(title.indexOf("INFO")>=0) icon = Liquid.getImagePath("info.png");
        if(title.indexOf("DEBUG")>=0) icon = Liquid.getImagePath("debug.png");

     * @param parentObj
     * @param title
     * @param message
     * @param onOk
     * @param onCancel
     * @returns {n|d}
     */
    messageBox:function(parentObj, title, message, onOk, onCancel) {
        return Liquid.dialogBox(parentObj, title, message, onOk, onCancel);
    },
    dialogBox:function(parentObj, title, message, onOk, onCancel) {
        var buttons = [ ];        
        if(onOk) buttons.push( { 
            text: (isDef(onOk.text) ? onOk.text : "Ok"), 
            click: function() { 
                try { (isDef(onOk) ? (isDef(onOk.func) ? onOk.func() : (typeof onOk === 'function' ? onOk() : "")) : ""); } catch (e) { console.error("ERROR:"+e); }
                jQ1124( this ).dialog( "close" ); 
            } 
        } );
        if(onCancel) buttons.push( { 
            text:(isDef(onCancel.text) ? onCancel.text : "Cancel"),
            click:function() { 
                try { (isDef(onCancel) ? (isDef(onCancel.func) ? onCancel.func() : (typeof onCancel === 'function' ? onCancel() : "")) : ""); } catch (e) { console.error("ERROR:"+e); }
                jQ1124( this ).dialog( "close" ); 
            } 
        } );
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
     * @param parentObj the id of the html element parent
     * @param title the title of dialog box
     * @param message the message of dialog box
     * @param onOk the callback called when ok button was pressed
     * @param onCancel the callback called when cancel button was pressed
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
            dialogConfirm.style.zIndex = 99100;
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
        try {
            Liquid.curMessageDlg = jQ1124( "#dialog-box" ).dialog({
                resizable: false,
                height: "auto",
                width: "auto",
                modal: true,
                buttons: buttons,
            });
            jQ1124( "#dialog-box" ).on('dialogclose', function(event) {
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
            // jQ1124('#dialog-box').dialog('option', 'position', 'center');
            // jQ1124('#dialog-box').parent().position({my:'center',of:'center',collison:'fit'});
            var objDlg = jQ1124('#dialog-box').parent();
            var clientHeight = objDlg.outerHeight();
            var clientWidth = objDlg.outerWidth();
            var winHeight = window.innerHeight;
            var winWidth = window.innerWidth;
            var top = (0 + winHeight/2.0 - (clientHeight > 0 ? clientHeight:0)/2);
            var left = (0 + winWidth/2.0 - (clientWidth > 0 ? clientWidth:0)/2);
            objDlg.css('position', 'fixed');
            objDlg.css('top', top > 0 ? top : 0);
            objDlg.css('left', left > 0 ? left : 0);
        } catch (e) {
            alert("Liquid ERROR: unable to show jQ1124(...).dialog\n\nMay be you are using incompatible version of jquery\n\nPlease check it your web page...\n\n\nOriginal message:\n\n"+message);
        }
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
    showDesktopNofity:function( msg ) {
        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notification");   
        } else if (Notification.permission === "granted") {
            var notification = new Notification(msg);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    var notification = new Notification(msg);
                }
            });
        }
    },            
    onErrorClick:function( obj ) {    
        var liquid = Liquid.getLiquid( obj );
        Liquid.dialogBox( (liquid ? (liquid.parentObj ? liquid.parentObj : liquid.outDivObj) : liquid.outDivObj) ,
                        "ERROR", 
                        (obj.innerText ? obj.innerText : obj.innerHTML),
                        { text:"Ok", func:function() { } }, 
                        );
    },            
    /**
     * Close a control
     * @param obj the control id or the class instance (LiquidCtrl)
     * @return n/d
     */
    close:function(obj) {
        if(!obj) obj = this;
        return Liquid.onClosing(obj);
    },
    onClosing:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            if(liquid.mode === "lookup") {
                Liquid.onCloseLookup(liquid, null);
                return;
            }
            if(liquid.askForSave) {
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
            for(var i=0; i<glLiquids.length; i++) {
                if(isDef(glLiquids[i].sourceData)) {
                    if(isDef(glLiquids[i].sourceData.parentLiquidId)) {
                        if(glLiquids[i].sourceData.parentLiquidId === liquid.controlId) {
                            Liquid.destroy(glLiquids[i]);
                        }
                    }
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
            var index = glLiquids.indexOf(liquid);
            if(index >= 0) glLiquids.splice(index, 1);
            delete liquid;
        }
    },
    onStart:function(obj) {
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {

            if(liquid.tableJson.modeless || liquid.tableJson.modless) {
                var id = "Liquid.backgroud.dlg";
                liquid.obscuringObj = document.getElementById(id);
                if(!liquid.obscuringObj) {
                    liquid.obscuringObj = document.createElement("div");
                    liquid.obscuringObj.id = id;
                }
                liquid.obscuringObj.style.display = '';
                liquid.obscuringObj.style.position = 'fixed';
                liquid.obscuringObj.style.height = liquid.obscuringObj.style.width = '100%';
                liquid.obscuringObj.style.top = liquid.obscuringObj.style.left = '0';
                liquid.obscuringObj.style.backgroundColor = 'rgba(127,127,127,0.7)';
                liquid.obscuringObj.style.zIndex = 99;
                liquid.outDivObj.style.zIndex = liquid.zIndex = 132;
                liquid.obscuringLastFilter = document.body.webkitFilter;
                document.body.webkitFilter = 'blur(5px)';
                document.body.insertBefore(liquid.obscuringObj, document.body.firstChild);
                liquid.focusedZIndex = 130;
                liquid.zIndex = liquid.focusedZIndex;

            } else {
                liquid.focusedZIndex = 30000;
            }

            if(liquid.absoluteLoadCounter === 0) 
                Liquid.onEvent(obj, "onFirstLoad", null, null);
            Liquid.onEvent(obj, "onLoad", null, null);
            if(liquid.outDivObj) {
                liquid.outDivObj.classList.remove('liquidHide');
                liquid.outDivObj.classList.add('liquidShow');
            }
            jQ1124( liquid.outDivObj ).slideDown( "fast" );
            setTimeout(function() { Liquid.onStarted(document.getElementById(liquid.controlId)); }, 500);
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
        
        // scroll listner
        if(document.body.addEventListener) { document.body.addEventListener('scroll', Liquid.onWindowScroll); } else { document.body.attachEvent('scroll', Liquid.onWindowScroll); }

        for(var i=0; i<glLiquidStartupTables.length; i++) {
            new LiquidCtrl(glLiquidStartupTables[i].controlId, glLiquidStartupTables[i].controlId, glLiquidStartupTables[i].json);
        }
        for(var i=0; i<glLiquidStartupWinX.length; i++) {
            Liquid.startWinX(glLiquidStartupWinX[i].controlId, glLiquidStartupWinX[i].jsonString, glLiquidStartupWinX[i].parentObjId, glLiquidStartupWinX[i].status, glLiquidStartupWinX[i].options);
        }
        for(var i=0; i<glLiquidStartupPopup.length; i++) {
            Liquid.startPopup(glLiquidStartupPopup[i].controlId, glLiquidStartupPopup[i].jsonString);
        }
        for(var i=0; i<glLiquidStartupMenuX.length; i++) {
            Liquid.startMenuX(glLiquidStartupMenuX[i].outDivObjOrId, glLiquidStartupMenuX[i].menuJson, glLiquidStartupMenuX[i].options);
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
     * @param {jsonStringOrB64Enc} the control definition json (clean string or base64 encoded)
     * @return {} n/d
     */
    startControl:function(controlId, jsonStringOrB64Enc) {
        if(!document.body) {
            glLiquidStartupTables.push( { controlId:controlId, json:jsonStringOrB64Enc } );
            return;
        }
        var jsonString = null;
        try { jsonString = atob(jsonStringOrB64Enc); } catch(e) { jsonString = jsonStringOrB64Enc; }
        new LiquidCtrl(controlId, controlId, jsonString);
    },
    /**
     * Start a control as popup
     * @param {controlId} the control id
     * @param {jsonStringOrB64Enc} the control definition json (clean string or base64 encoded)
     * @return {} n/d
     */
    startPopup:function(controlId, jsonStringOrB64Enc) {
        if(!document.body) {
            glLiquidStartupPopup.push( { controlId:controlId, jsonString:jsonStringOrB64Enc } );
            return;
        }

        var jsonString = null;
        try { jsonString = atob(jsonStringOrB64Enc); } catch(e) { jsonString = jsonStringOrB64Enc; }

    	var retVal = null;
        var refControlId = controlId.replace(/\./g, "-");
        var liquid = Liquid.getLiquid(refControlId);
        if(!liquid) {
            if(!jsonString) {
                var err = "missing control definition:"+refControlId;
                console.error("ERROR: "+err);
                alert(err);
            } else {
                retVal = new LiquidCtrl(refControlId, controlId, jsonString);
            }
        } else {
            retVal = liquid;
            Liquid.initializeLiquid(liquid);
            Liquid.onStart(liquid);
            if(liquid.autoLoad !== false)
                Liquid.loadData(liquid, null, "startPopup");
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
     * @param {jsonStringOrB64Enc} the control definition json (clean string or base64 encoded)
     * @param {parentId} the id of the html parent object
     * @param {status} the initial status of the winX (maximized, iconic, restored)
     * @param {options} overlay the options of the winX (json string)
     * @return {} n/d
     */
    startWinX:function(controlId, jsonStringOrB64Enc, parentId, status, options) {
        var retVal = null;

        var jsonString = null;
        try { jsonString = atob(jsonStringOrB64Enc); } catch(e) { jsonString = jsonStringOrB64Enc; }

        if(!isDef(parentId)) {
            parentId = 'WinXContainer';
        }
        if(parentId instanceof HTMLElement) parentId = parentId.id; // in the name of flexibility
        if(!document.body) {
            glLiquidStartupWinX.push( { controlId:controlId, jsonString:jsonString, parentId:parentId, status:status, options:options } );
            return;
        }
        // check parentid (container)
        if(!document.getElementById(parentId)) {
            var parentObj = document.querySelector('.liquidWinXContainer');
            if(parentObj) {
                parentId = parentObj.id;
            } else {
                alert("ERROR: unable to detect WinXContainer");
            }
        }
        var refControlId = controlId.replace(/\./g, "-");
        var liquid = Liquid.getLiquid(refControlId);
        if(!liquid) {
            if(!jsonString) {
                var err = "missing control definition:"+refControlId;
                console.error("ERROR: "+err);
                alert(err);
            } else {
                if(typeof jsonString === 'object') { // wrapping to content
                    if(isDef(jsonString.json)) {
                        jsonString = jsonString.json;
                    }
                }
                retVal = liquid = new LiquidCtrl(refControlId, controlId, jsonString
                                        , (isDef(options) ? { options:options } : null)
                                        , "winX", parentId);
                }
        } else {
            retVal = liquid;
            Liquid.initializeLiquid(liquid);
            Liquid.onStart(liquid);
            if(Liquid.reloadDataOnFocus) Liquid.loadData(liquid, null, "startWinX");
            Liquid.setFocus(liquid);            
        }
        var newLiquid = Liquid.getLiquid(liquid.controlId);
        if(newLiquid) {
            Liquid.setParent(newLiquid, parentId);
            Liquid.setWinXStatus(newLiquid, status);
            Liquid.createNavigatorsBar();
        } else console.error("ERROR: control:"+controlId+" not created");
        Liquid.createNavigatorsBar();
        return retVal;
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
    transferProperties:function(sourceObject, targetObject, propsToTransfer) {
        return Liquid.transferFeaturesProps(null, sourceObject, targetObject, propsToTransfer);
    },
    transferFeatures:function(liquid, sourceObject, targetObject) {
        var propsToTransfer = [ "columns", "commands", "filters", "preFilters", "grids", "documents", "layouts", "charts", "multipanels", "events", "actions" ];
        return Liquid.transferFeaturesProps(liquid, sourceObject, targetObject, propsToTransfer);
    },
    transferFeaturesProps:function(liquid, sourceObject, targetObject, propsToTransfer) {
        if(sourceObject) {
            if(targetObject) {
                // options transfer
                if(isDef(sourceObject.options)) {
                    for(var attrname in sourceObject.options) {
                        targetObject[attrname] = sourceObject.options[attrname];
                    }
                }
                // features transfer
                for(var ip=0; ip<propsToTransfer.length; ip++) {
                    if(isDef(sourceObject[propsToTransfer[ip]])) {
                        if(typeof targetObject[propsToTransfer[ip]] === 'undefined') {
                            targetObject[propsToTransfer[ip]] = sourceObject[propsToTransfer[ip]];
                        } else {
                            for(var attrname in sourceObject[propsToTransfer[ip]]) {
                                if(!sourceObject[propsToTransfer[ip]] instanceof HTMLElement) {
                                    targetObject[propsToTransfer[ip]][attrname] = sourceObject[propsToTransfer[ip]][attrname];
                                }
                            }
                        }
                    }
                }
                // solving links
                for(var ip=0; ip<propsToTransfer.length; ip++) {
                    if(isDef(targetObject[propsToTransfer[ip]])) {
                        if(typeof targetObject[propsToTransfer[ip]] === 'string') {
                            if(targetObject[propsToTransfer[ip]].trim().startsWith("@")) {
                                var globalVarName = targetObject[propsToTransfer[ip]].trim().substring(1);
                                var globalVar = Liquid.getObjectByName(liquid, globalVarName);
                                if(isDef(globalVar)) {
                                    targetObject[propsToTransfer[ip]] = globalVar;
                                } else {
                                    console.error("ERROR: "+globalVarName+" not found");
                                }
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
    mergeColumns(targetJson, sourceJson, bHideMissing ) {
        try {
            var sourceColumns = null;
            if(isDef(sourceJson.columns)) {
                sourceColumns = sourceJson.columns;
            } else if(isDef(sourceJson.rtColumns)) {
                sourceColumns = sourceJson.rtColumns;
            }
            if(isDef(sourceColumns)) {
                if(!isDef(targetJson.columns)) {
                    targetJson.columns = [];
                }
                if(bHideMissing) {
                    for(var ic=0; ic<targetJson.columns.length; ic++) {
                        targetJson.columns[ic].toHide = true;
                    }
                }
                for(var ic=0; ic<targetJson.columns.length; ic++) {
                    if(Liquid.getColumnFromColumns(sourceJson.table, sourceColumns, targetJson.columns[ic].name)) {
                        delete targetJson.columns[ic].toHide;
                    }
                }
                if(bHideMissing) {
                    for(var ic=0; ic<targetJson.columns.length; ic++) {
                        if(targetJson.columns[ic].toHide) {
                            targetJson.columns[ic].visible = false;
                        }
                    }
                }
            }
        } catch(e) { console.error(e); }
    },
    startLookup:function(controlId, sourceCol, lookupControlId, containerObjOrId, json, lookupField, options, linkType, fieldDescription, enviroment) {
        var liquid = null;
        var lookupLiquid = null;
        var lookupSourceControlId = null;
        var lookupSourceGlobalVar = null;
        var lookupSourceGlobalVarControlId = null;
        var parentGridName = null;
        var idColumnLinkedFields = null;
        var targetColumnLinkedObjIds = null;
        var idColumnLinkedObjIds = null;
        try {
            liquid = Liquid.getLiquid(controlId);
            lookupLiquid = Liquid.getLiquid(lookupControlId);
            if(lookupLiquid) {
                // control already exist ... create elementi inside containerObjOrId
                var containerObj = null;
                var containerId = null
                if(containerObjOrId instanceof HTMLElement) {
                    containerObj = containerObjOrId;
                    containerId = containerObj.id;
                } else {
                    containerObj = enviroment ? enviroment.document.getElementById(containerObjOrId) : document.getElementById(containerObjOrId);
                    containerId = containerObjId;
                }                
                lookupLiquid.tableJson.gridLink = (linkType === 'grid' ? containerId : null);
                lookupLiquid.tableJson.filtertLink = (linkType === 'filter' ? containerId : null);
                lookupLiquid.tableJson.layoutLink = (linkType === 'layout' ? containerId : null);
                Liquid.createLookupObjects(lookupLiquid, containerObj, containerId);
                return lookupLiquid;
            } else {
                // control not exist so empty html to rebuild correctly
                var comboObj = document.getElementById(lookupControlId+".lookup.combo");
                if(comboObj) {
                    comboObj.parentNode.removeChild(comboObj);
                }
            }
            if(json) {
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
                        registerControlId = lookupControlId;
                    } else {
                        for(var i=0; i<glLiquids.length; i++) { // by json in other control
                            if(glLiquids[i].controlId === json) {
                                // lookupJson = JSON.parse(JSON.stringify(glLiquids[i].tableJson));
                                lookupJson = deepClone(glLiquids[i].tableJson);
                                registerControlId = glLiquids[i].controlId;
                                lookupSourceControlId = registerControlId;
                                break;
                            }
                        }
                        if(!lookupJson) { // by json in global var or object
                            if(json.toLowerCase().endsWith(".json")) {
                                // wrap json prop to source var
                                json = json.substring(0, json.length-5);
                            }
                            var lookupObj = Liquid.getProperty(json);
                            if(lookupObj) {
                                if(isDef(lookupObj.dataset)) if(isDef(lookupObj.dataset.liquid)) { // by other liquid control
                                    for(var i=0; i<glLiquids.length; i++) {
                                        if(glLiquids[i].controlId === lookupObj.dataset.liquid) {
                                            lookupJson = deepClone(glLiquids[i].tableJson);
                                            registerControlId = glLiquids[i].controlId;
                                            lookupSourceControlId = registerControlId;
                                            break;
                                        }
                                    }
                                }
                            }
                            if(!lookupJson) { // by var or object
                                if(typeof lookupObj === 'string') {
                                    if(document.getElementById(lookupObj)) {                                        
                                        console.error("ERROR : cannot create lookup by HTMLElement ... is should be a liquid control\n Make sure control "+json+" exist and is just registered at this time"
                                                +"\n*** Please check control:"+controlId+" field:"+sourceCol.name
                                                +"\n\n N.B.: maybe you should load the control '"+lookupObj+"' before of '"+controlId+"'\n");
                                        if(containerObj) containerObj.title = containerObj.placeholder = "Lookup error : control " + json + " not found";
                                    }
                                } else {
                                    if(lookupObj instanceof HTMLElement) {
                                        console.error("ERROR : cannot create lookup by HTMLElement ... is should be a liquid control\n Make sure control "+json+" exist and is just registered at this time"
                                                +"\n*** Please check control:"+controlId+" field:"+sourceCol.name
                                                +"\n\n N.B.: maybe you should load the control '"+(lookupObj.id ? lookupObj.id : lookupObj.name)+"' before of '"+controlId+"'\n");
                                         if(containerObj) containerObj.title = containerObj.placeholder = "Lookup error : control " + json + " not found";
                                    }
                                }
                                if(typeof lookupObj === 'object') {
                                    if(isDef(lookupObj.json)) { // look inside our global var from server siide { controlId:... json:... }
                                        lookupSourceGlobalVarControlId = lookupObj.controlId;
                                        lookupObj = lookupObj.json;
                                    }
                                }                                
                                lookupJson = typeof lookupObj === 'string' ? JSON.parse(lookupObj) : lookupObj;
                                registerControlId = lookupControlId;
                                lookupSourceGlobalVar = json;
                                
                                if(!isDef(lookupSourceGlobalVarControlId)) {
                                    if(isDef(lookupJson)) {
                                        if(isDef(lookupJson.controlId)) {
                                            lookupSourceGlobalVarControlId = lookupJson.controlId;
                                        } else {
                                            console.warn("WARNING : unable to detect lookupSourceGlobalVarControlId on '"+containerObjId+"'");
                                        }
                                    }
                                }
                            }
                        }
                        if(!lookupJson) { // search in global var deep inside
                            var database = liquid.tableJson.database;
                            var schema = liquid.tableJson.schema;
                            for(var attrname in window) {
                                if(attrname.startsWith("gl") && attrname.endsWith("JSON")) {
                                    if(isDef(window[attrname].controlId)) {
                                        if(isDef(window[attrname].json)) {
                                            if(window[attrname].controlId === json) {
                                                lookupJson = JSON.parse(window[attrname].json);
                                                if(!registerControlId) registerControlId = window[attrname].controlId;
                                                lookupSourceGlobalVar = window[attrname];
                                                lookupSourceGlobalVarControlId = window[attrname].controlId;
                                                // lookupSourceControlId = window[attrname].controlId;
                                                break;
                                            } else {
                                                if(!isDef(window[attrname].jsonObj)) {
                                                    try { window[attrname].jsonObj = JSON.parse(window[attrname].json); } catch (e) {}
                                                }
                                                if(isDef(window[attrname].jsonObj)) {
                                                    if(window[attrname].jsonObj.database === database || !isDef(database) || !isDef(window[attrname].jsonObj.database)) {
                                                        if(window[attrname].jsonObj.schema === schema || !isDef(schema) || !isDef(window[attrname].jsonObj.schema)) {
                                                            if(window[attrname].jsonObj.table === json) {
                                                                // finally catch it
                                                                lookupJson = JSON.parse(window[attrname].json);
                                                                if(!registerControlId) registerControlId = window[attrname].controlId;
                                                                lookupSourceGlobalVar = window[attrname];
                                                                lookupSourceGlobalVarControlId = window[attrname].controlId;
                                                                // lookupSourceControlId = window[attrname].controlId;
                                                                break;
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
                    if(!lookupJson) {
                        // create default control on table
                        var columns = isDef(options) ? options.columns : [];
                        if(isDef(sourceCol)) {
                            if(isDef(sourceCol.foreignColumn)) {
                                if(columns.indexOf(sourceCol.foreignColumn) < 0) {
                                    // columns.push( { name: sourceCol.foreignColumn } );
                                }
                            }
                        }
                        lookupJson = { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:sourceCol.foreignTable, columns:columns, autoFitColumns:true, width:"auto" };
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
                            // Let autoload data
                            // lookupJson.autoLoad = false;
                            if(isDef(json.lookupField))
                                lookupJson.lookupFiled = json.lookupField;
                            if(isDef(json.lookupId))
                                lookupJson.lookupId = json.lookupId;
                            if(isDef(lookupField))
                                lookupJson.lookupFiled = lookupField;
                            if(isDef(options)) {
                                if(isDef(options.columns) || isDef(options.rtColumns)) {
                                    //
                                    // need all columns to work fine (grid/layout/commands*events etc..
                                    // special transfer for columns : add all columns setting visble = false for undetected
                                    //
                                    Liquid.mergeColumns(lookupJson, options, true );
                                    // multiple row = multiple instance .. archive it far as .columns, Liquid.overlayObjectContent shouldn't copy it
                                    if(isDef(options.columns)) {
                                        options.rtColumns = options.columns
                                        delete options.columns;
                                    }
                                }
                                
                                // rest of the options transfer
                                Liquid.overlayObjectContent(lookupJson, options);
                            }
                            if(isDef(lookupJson.idColumn) || isDef(lookupJson.targetColumn)) {
                                //
                                // Manage idColumn and targetColumn : search in all grids, all columns
                                //
                                if(linkType === 'grid') {
                                    // Link to tableJson.grid[].columns
                                    if(liquid.tableJson.grids) {
                                        var aliasTargetColumn = liquid.tableJson.table + "." + lookupJson.targetColumn;
                                        var aliasIdColumn = lookupJson.table + "." + lookupJson.idColumn;
                                        for(var ig = 0; ig < liquid.tableJson.grids.length; ig++) {
                                            var grid = liquid.tableJson.grids[ig];
                                            var columns = grid.columns;
                                            parentGridName = grid.name;
                                            if(isDef(columns)) {
                                                var isTargetColumnFound = false, isSourceColumnFound = false;
                                                for(var ic=0; ic<columns.length; ic++) {
                                                    try {
                                                        if( columns[ic].name === aliasTargetColumn || columns[ic].name === lookupJson.targetColumn || columns[ic].field === lookupJson.targetColumn) {
                                                            // link to tagret                                                
                                                            if(!isDef(targetColumnLinkedObjIds)) targetColumnLinkedObjIds = [];
                                                            targetColumnLinkedObjIds.push(columns[ic].linkedObj.id);
                                                            isTargetColumnFound = true;
                                                        }
                                                        if(columns[ic].name === aliasIdColumn || columns[ic].name === lookupJson.idColumn || columns[ic].field === lookupJson.idColumn) {
                                                            // link to external column                                                 
                                                            if(!isDef(idColumnLinkedObjIds)) idColumnLinkedObjIds = [];
                                                            idColumnLinkedObjIds.push(columns[ic].linkedObj.id);
                                                            isSourceColumnFound = true;
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }
                                                if(!isTargetColumnFound) {
                                                    if(isDef(lookupJson.targetColumn)) {
                                                        console.debug("DEBUG : unable to find target column \"" + lookupJson.targetColumn + "\" on control:" + controlId + " field:" + lookupControlId + " check:" + fieldDescription);
                                                    }
                                                }
                                                if(!isSourceColumnFound) {
                                                    if(isDef(lookupJson.idColumn)) {
                                                        console.debug("DEBUG : unable to find id column \"" + lookupJson.idColumn + "\" on control:" + controlId + " field:" + lookupControlId + " check:" + fieldDescription);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                // Link to tableJson.columns
                                if(liquid.tableJson.columns) {
                                    var columns = liquid.tableJson.columns;
                                    var aliasTargetColumn = liquid.tableJson.table + "." + lookupJson.targetColumn;
                                    var targetColumns = [];
                                    if(isDef(columns)) {
                                        for (var ic = 0; ic < columns.length; ic++) {
                                            var colName = isDef(columns[ic].runtimeName) ? columns[ic].runtimeName : columns[ic].name;
                                            var aliasTargetParts = null;
                                            var aliasTargetColumn2 = null;
                                            if (isDef(lookupJson.targetColumn)) {
                                                aliasTargetParts = lookupJson.targetColumn.split(".");
                                                aliasTargetColumn2 = aliasTargetParts.length > 1 ? aliasTargetParts[1] : null;
                                            }
                                            try {
                                                var isIdColumnDefined = isDef(lookupJson.idColumn);
                                                var isTargetColumn = (colName === lookupJson.targetColumn || colName === aliasTargetColumn || colName === aliasTargetColumn2 || columns[ic].field === lookupJson.targetColumn);

                                                if (isTargetColumn) {
                                                    liquid.tableJson.columns[ic].isReflected = true;
                                                    targetColumns.push(columns[ic]);

                                                    if (isIdColumnDefined) {
                                                        if (!idColumnLinkedFields) idColumnLinkedFields = [];
                                                        idColumnLinkedFields.push({
                                                            controlId: liquid.controlId,
                                                            targetField: columns[ic].field,
                                                            targetFieldName: columns[ic].name
                                                        });
                                                    }
                                                }

                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }
                                    }
                                }
                            }                            
                            var sourceData = { // Link to the source
                                 lookupSourceControlId:lookupSourceControlId
                                ,lookupSourceGlobalVar:lookupSourceGlobalVar
                                ,lookupSourceGlobalVarControlId:lookupSourceGlobalVarControlId
                                ,parentLiquidId:liquid.controlId
                                ,parentColumn:(isDef(sourceCol) ? sourceCol.name : null)
                                ,parentGridName:parentGridName
                                ,idColumnLinkedFields:idColumnLinkedFields
                                ,idColumnLinkedObjIds:idColumnLinkedObjIds
                                ,targetColumnLinkedObjIds:targetColumnLinkedObjIds
                            };
                            lookupJson.token = liquid.tableJson.token;
                            lookupLiquid = new LiquidCtrl( lookupControlId, containerObj, JSON.stringify(lookupJson)
                                                            ,sourceData
                                                            ,"lookup", null);
                            lookupLiquid.callingLiquid = liquid;
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        console.error("ERROR : unable to find lookup \"" + json + "\" on control:" + controlId + " field:" + lookupControlId + " check:" + fieldDescription);
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
     * @param {menuJsonStringOrB64Enc} the control definition json (string)
     * @return {} n/d
     */
    startMenuX:function(outDivObjOrId, menuJsonStringOrB64Enc, options) {
        if(!document.body) {
            glLiquidStartupMenuX.push( { outDivObjOrId:outDivObjOrId, menuJson:menuJson, options:options } );
            return;
        }
        try { menuJson = atob(menuJsonStringOrB64Enc); } catch(e) { menuJson = menuJsonStringOrB64Enc; }
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
                        accordion.activeIndex = 0;
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
                                if(item.open === true) {
                                    accordion.activeIndex = ia;
                                }
                            }
                        }
                    }                    
                    jQ1124( accordionObj ).accordion( { active: accordion.activeIndex } );
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
                        if(menuObj) jQ1124( menuObj ).slideDown( "fast", function(){ menuContainer.style.display = menuX.display; Liquid.setMenuIcon(obj, menuX, menuContainer, menuIconContainer, false, true); });
                    } else {
                        Liquid.setMenuIcon(obj, menuX, menuContainer, menuIconContainer, true, true);
                        menuObj.classList.add("liquidMenuXClosed");
                        if(menuObj) jQ1124( menuObj ).slideUp( "fast", function(){ menuObj.style.display = menuX.display; menuContainer.style.display = 'none'; });
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
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ left: 0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.right=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'right') {                            
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ right: 0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.left=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'top') {
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'bottom') {
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                }
            } else {
                if(menuX.menuJson.type === 'left') {
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ right:0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.left=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'right') {                            
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ left:0 }, bAnimation===false?0:300, function(){ menuIconContainer.style.right=''; Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'top') {
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
                } else if(menuX.menuJson.type === 'bottom') {
                    if(menuIconContainer) jQ1124( menuIconContainer ).animate({ }, bAnimation===false?0:300, function(){ Liquid.changeMenuIcon(obj, menuX, menuX.newState); });
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
    handleResponse:function(liquid, title, resultJson, bShowMessage, hShowConsole, bHandleClientSite, bShowMessage) {
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
            if(bShowMessage) {
                Liquid.dialogBox(liquid.parentObj ? liquid.parentObj : liquid.outDivObj,
                                "ERROR", 
                                err,
                                { text:"Ok", func:function() { } }, 
                                );
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
                    var liquidCommandParams = Liquid.buildCommandParams(liquid, command, null);
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
                                                Liquid.handleResponse(liquid, "startWorker", resultJson, true, true, true, true);
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
                                                    Liquid.handleResponse(liquid, "getWorker result", resultJson, true, true, true, true);
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
                        try {
                            var sql = "INSERT INTO CLIPBOARD (controlId,columns,rows,date) VALUES ("
                                    + "'" + liquid.controlId + "'"
                                    + ",'" + btoa(JSON.stringify(liquid.tableJson.columns))+"'"
                                    + ",'" + btoa(Liquid.serializedRow(liquid, true)) + "'"
                                    + ",'" + date.toISOString() + "'"
                                    + ")";
                            tx.executeSql(sql, [], function (tx, results) {
                        Liquid.copyToClipBoradDone(liquid);
                            }, function (tx, results) {
                                console.error(results);
                            });
                        } catch(e) { console.error("ERROR: "+e); }
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
            Liquid.showToast(Liquid.appTitle, msg, "success");
        } else {
            var msg = Liquid.lang === 'eng' ? ("No items selected") : ("Nessuna riga selezionata" );
            Liquid.showToast(Liquid.appTitle, msg, "warning");
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
    pasteFromClipBoradExec:function(liquid, controlId, columnsB64, rowsB64) {
        if(liquid) {
            if(controlId) {
                var sourceLiquid = Liquid.getLiquid(controlId);
                var columns = atob(columnsB64);
                var rows = atob(rowsB64);
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
                                    
                                    Liquid.resetMofifications(liquid);
                                    
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
    writeUserData:function(field, value, note, callback) {
        return this.saveUserData(field, value, note, callback);
    },
    saveUserData:function(field, value, note, callback) {
        if(field) {
            if(glLiquidDBEnable) {
                var date = new Date();
                Liquid.getDB();
                if(glLiquidDB) {
                    glLiquidDB.transaction(function (tx) {
                        try {
                            let valueB64 = btoa(JSON.stringify(value));
                            let noteB64 = btoa(JSON.stringify(note));
                            var sqlDelete = "DELETE FROM USERDATA WHERE field='" + btoa(field)+"'";
                            var sqlInsert = "INSERT INTO USERDATA (field,value,note,date) VALUES ("
                                + "'" + btoa(field)+"'"
                                + ",'" + valueB64 + "'"
                                + ",'" + noteB64 + "'"
                                + ",'" + date.toISOString() + "'"
                                + ");";
                            tx.executeSql(sqlDelete, [], function (tx, results) {
                                tx.executeSql(sqlInsert, [], function (tx, results) {
                                    Liquid.saveUserDataDone(field, callback);
                                }, function (tx, results) {
                                    console.error(results);
                                });
                            }, function (tx, results) {
                                console.error(results);
                            });
                        } catch(e) { console.error("ERROR: "+e); }
                    }, null);
                } else if(glLiquidIDB) {
                    var transaction = glLiquidIDB.transaction(["USERDATA"], "readwrite");
                    var objectStore = transaction.objectStore("USERDATA");
                    var data = { field:btoa(field), value:btoa(JSON.stringify(value)), note:btoa(note), date:date.toISOString() };
                    var request = objectStore.add(data);
                    if(request.readyState === 'done') {
                        Liquid.saveUserDataDone(field, callback);
                    } else {
                        request.onerror = function(event) {
                            console.error("IndexedDB error:"+event.target.error.message);
                        };
                        request.onsuccess = function(event) {
                            Liquid.saveUserDataDone(field, callback);
                        };
                    }
                }
            }
        }
    },
    saveUserDataDone:function(field, callback) {
        if(callback) {
            callback();
        } else {
            if (field) {
                var msg = Liquid.lang === 'eng' ? ("Data saved") : ("Dati salvati");
                Liquid.showToast(Liquid.appTitle, msg, "success");
            }
        }
    },
    readUserData:function(field, callback) {
        return this.loadUserData(field, callback);
    },
    loadUserData:function(field, callback) {
        if(field) {
            let fieldB64 = btoa(field);
            if(glLiquidDBEnable) {
                Liquid.getDB();
                if(glLiquidDB) {
                    glLiquidDB.transaction(function (tx) {
                        tx.executeSql("SELECT * FROM USERDATA WHERE field='"+fieldB64+"'", [], function (tx, results) {
                            for (var i=0; i<results.rows.length; i++) {
                                Liquid.readUserDataExec( results.rows.item(i).id, results.rows.item(i).field, results.rows.item(i).value, results.rows.item(i).note, results.rows.item(i).date, callback );
                            }
                        }, null);
                    });
                } else if(glLiquidIDB) {
                    var transaction = glLiquidIDB.transaction(["USERDATA"], "readwrite");
                    var objectStore = transaction.objectStore("USERDATA");
                    var request = objectStore.getAll();
                    if(request.readyState === 'done') {
                        Liquid.readUserDataProcessCursors(fieldB64, request.result, callback);
                    } else {
                        request.onerror = function(event) {
                            console.error("ERROR: readUserData() error: "+event);
                        };
                        request.onsuccess = function(event) {
                            Liquid.readUserDataProcessCursors(fieldB64, event.target.result, callback);
                        };
                    }
                }
            }
        }
    },
    readUserDataProcessCursors:function(fieldB64, cursors, callback) {
        for(var ic=0; ic<cursors.length; ic++) {
            let cursor = cursors[ic];
            if (cursor) {
                if(fieldB64 == cursor.field) {
                    Liquid.readUserDataExec(cursor.Id, cursor.field, cursor.value, cursor.note, cursor.date, callback);
                }
            }
        }
    },
    readUserDataExec:function(id, field, value, note, date, callback) {
        if(id) {
            if(field) {
                if(callback) {
                    callback(atob(field), atob(value), atob(note), date);
                }
            } else {
                console.error("ERROR: readUserData(): controlId "+controlId+" not found");
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
                            tx.executeSql('CREATE TABLE IF NOT EXISTS USERDATA (id INTEGER PRIMARY KEY,field TEXT,note TEXT, value TEXT, date DATETIME)');
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
                                    if (!glLiquidIDB.objectStoreNames.contains('USERDATA')) {
                                        var objStoreClipboard = glLiquidIDB.createObjectStore("USERDATA", { autoIncrement : true } );
                                        objStoreClipboard.createIndex('id', 'id', {keyPath: 'id', autoIncrement:true});
                                        objStoreClipboard.createIndex("field", "controlId", { unique: false });
                                        objStoreClipboard.createIndex("note", "command", { unique: false });
                                        objStoreClipboard.createIndex("value", "rows", { unique: false });
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
        if(obj) {
            obj.draggable = true;
            obj.ondragstart = function(event) { Liquid.onDragStart(event); };
            // obj.style.backgroundColor = 'blue';
        }
    },
    onAllowDrop:function(event) {
        event.preventDefault();
    },
    onDragStart:function(event) {
        if(event.target.id) {
            event.dataTransfer.setData("sourceObjId", event.target.id);
            event.dataTransfer.setData("pageX", event.pageX);
            event.dataTransfer.setData("pageY", event.pageY);
        } else {
            console.error("ERROR: unable to start drag .. empty id");
        }
    },
    onDrop:function(event) {
        if(event.target) {
            var sourceObjId = event.dataTransfer.getData("sourceObjId");
            var sPageX = event.dataTransfer.getData("pageX");
            var sPageY = event.dataTransfer.getData("pageY");
            var sourceObj = document.getElementById(sourceObjId);
            
            if (event.ctrlKey || event.altKey) {
                // drag to new position
                duplicateObject = false;
                
                if (event.ctrlKey) {
                    duplicateObject = true;
                }
                if(sourceObj) {
                    if(    sourceObj.classList.contains('liquidGridControl')
                        || sourceObj.classList.contains('liquidGridLabel')
                        || sourceObj.classList.contains('liquidGridCell')) {
                        var liquid = Liquid.getLiquid(sourceObjId);
                        if(isDef(liquid.currentCommand)) {
                            alert("Please exit from current commad before drag grid'fields");
                            return;
                        }                        
                        var grid_coords = Liquid.getGridCoords(liquid, sourceObjId);
                        if(grid_coords) {
                            if(!isDef(grid_coords.control)) {
                                try {
                                    if(sourceObj.classList.contains('liquidLookup')) {
                                        var source_obj_id = document.getElementById(sourceObjId).parentNode.parentNode.id;
                                        liquid = Liquid.getLiquid(source_obj_id);
                                        grid_coords = Liquid.getGridCoords(liquid, source_obj_id); 
                                    }
                                } catch(e) {};
                            }
                            if(grid_coords.control) {
                                var sourceGridCol = liquid.tableJsonSource.grids[grid_coords.gridIndex].columns[grid_coords.itemIndex];
                                if(sourceGridCol){
                                    var targetObj = null;
                                    
                                    if(duplicateObject) {
                                        var new_col = deepClone( sourceGridCol );
                                        new_col.name += "_copy";
                                        if(isDef(new_col.label)) new_col.label += "_copy";
                                        liquid.tableJsonSource.grids[grid_coords.gridIndex].columns.push( new_col );
                                        sourceGridCol = liquid.tableJsonSource.grids[grid_coords.gridIndex].columns[ liquid.tableJsonSource.grids[grid_coords.gridIndex].columns.length-1 ];
                                    }
                                    
                                    if(sourceObj.classList.contains('liquidGridControl') || sourceObj.classList.contains('liquidGridCell')) {
                                        if(!isDef(sourceGridCol.fieldData)) sourceGridCol.fieldData = {};
                                        targetObj = sourceGridCol.fieldData;
                                    } else if(sourceObj.classList.contains('liquidGridLabel')) {
                                        if(!isDef(sourceGridCol.labelData)) sourceGridCol.labelData = {};
                                        targetObj = sourceGridCol.labelData;
                                    }
                                    if(targetObj) {
                                        var dragX = event.pageX, dragY = event.pageY;
                                        var offsetLeft = sourceObj.offsetLeft;
                                        var offsetTop = sourceObj.offsetTop;
                                        if(!isDef(targetObj.position)) {
                                            targetObj.width = sourceObj.offsetWidth;
                                            targetObj.height = sourceObj.offsetHeight;
                                            offsetLeft = sourceObj.offsetLeft + sourceObj.parentNode.parentNode.offsetLeft;
                                            offsetTop = sourceObj.offsetTop + sourceObj.parentNode.parentNode.offsetTop;
                                        }                                    
                                        targetObj.position = "absolute";
                                        targetObj.positionX = offsetLeft + dragX-Number(sPageX);
                                        targetObj.positionY = offsetTop + dragY-Number(sPageY);
                                        // set as running free
                                        // sourceGridCol.row = sourceGridCol.col = -1;
                                        
                                        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
                                        Liquid.updateProperty(liquid, ftIndex1B, "grids", grid_coords.gridIndex, liquid.tableJsonSource.grids[grid_coords.gridIndex]);
                                        Liquid.setAskForSave(liquid, true);
                                        
                                        if(!isDef(liquid.sourceData)) liquid.sourceData = {};
                                        liquid.sourceData.tempCurrentTab = grid_coords.gridIndex+1;
                                        Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                                    }
                                    return;
                                }
                            }
                        }
                    }
                }
            }
            
            var liquidMenuX = Liquid.getLiquid(event.target.id);
            if(liquidMenuX) {
                if(event.target.classList.contains('liquidMenuX') || event.target.classList.contains('liquidMenuXContainer')) {
                    if(sourceObj) {
                        var liquid = Liquid.getLiquid(sourceObjId);
                        if(liquid) {
                            var WinXContainerId = liquid.parentObjId;
                            var controlId = liquid.controlId;
                            var controlName = liquid.tableJson.name ? liquid.tableJson.name : liquid.tableJson.caption;
                            var winXJsonString = liquid.tableJsonVariableName;
                            var winStatus = "maximized";
                            if(winXJsonString === null) {
                                winXJsonString = controlId.replace(/\ /g, "_").replace(/\-/g, "_").replace(/\./g, "_")+"_JSON";
                                window[winXJsonString] = JSON.stringify(liquid.tableJsonSource);
                                alert("WARNING : adding runtime window : you should store it inside variable : ", winXJsonString);
                            }
                            var clientCmd = "Liquid.startWinX('"+controlId+"', "+winXJsonString+", '"+WinXContainerId+"', '"+winStatus+"')";
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
                    return;
                }
            }
            if(event.target.classList.contains('liquidGridControl') || event.target.classList.contains('liquidGridLabel') || event.target.classList.contains('LiquidGridCellTD')) {
                if(sourceObj) {
                    var liquid = Liquid.getLiquid(sourceObjId);
                    if(isDef(liquid.currentCommand)) {
                        alert("Please exit from current commad before drag grid'fields");
                        return;
                    }                        
                    var grid_coords = Liquid.getGridCoords(liquid, sourceObjId);
                    if(grid_coords) {
                        if(grid_coords.control) {
                            var sourceGridCol = liquid.tableJsonSource.grids[grid_coords.gridIndex].columns[grid_coords.itemIndex];
                            if(sourceGridCol){
                                var target_grid_coords = Liquid.getGridCoords(liquid, event.target.id);
                                if(target_grid_coords) {
                                    if(isDef(target_grid_coords.control)) {
                                        var targetGridCol = liquid.tableJsonSource.grids[target_grid_coords.gridIndex].columns[target_grid_coords.itemIndex];
                                        if(targetGridCol) {
                                            if(sourceGridCol.row === targetGridCol.row && sourceGridCol.col === targetGridCol.col) return;                                            
                                            if(confirm(Liquid.swapCellsMessage)) {
                                                var t = targetGridCol.row;
                                                targetGridCol.row = sourceGridCol.row;
                                                sourceGridCol.row = t;
                                                t = targetGridCol.col;
                                                targetGridCol.col = sourceGridCol.col;
                                                sourceGridCol.col = t;
                                                Liquid.setAskForSave(liquid, true);
                                                // update the source
                                                if(isDef(liquid.sourceData)) {
                                                    if(isDef(liquid.sourceData.rootControlId)) {
                                                        if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                                                            var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                                                            if(sourceLiquid) {
                                                                var sourceForeignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                                                                if(sourceForeignTable) {
                                                                    if(isDef(sourceForeignTable.options)) {
                                                                        if(isDef(sourceForeignTable.options.grids)) {
                                                                            var sourceGridCol = sourceForeignTable.options.grids[grid_coords.gridIndex].columns[grid_coords.itemIndex];
                                                                            var targetGridCol = sourceForeignTable.options.grids[target_grid_coords.gridIndex].columns[target_grid_coords.itemIndex];
                                                                            var t = targetGridCol.row;
                                                                            targetGridCol.row = sourceGridCol.row;
                                                                            sourceGridCol.row = t;
                                                                            t = targetGridCol.col;
                                                                            targetGridCol.col = sourceGridCol.col;
                                                                            sourceGridCol.col = t;
                                                                            Liquid.setAskForSave(sourceLiquid, true);
                                                                            
                                                                        } else {
                                                                            console.error("ERROR : source grid update failed .. grid not found");
                                                                        }
                                                                    } else {
                                                                        console.error("ERROR : source grid update failed .. options not found");
                                                                    }
                                                                } else {
                                                                    console.error("ERROR : source grid update failed .. sourceForeignTable not found");
                                                                }
                                                            } else {
                                                                console.error("ERROR : source grid update failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                                                            }
                                                        } else {
                                                            console.error("ERROR : source grid update failed .. source foreign table not indexed");
                                                        }
                                                    } else {
                                                        console.error("ERROR : source grid update failed .. rootControlId not defined");
                                                    }
                                                }
                                                liquid.sourceData.tempCurrentTab = target_grid_coords.gridIndex+1;
                                                // Liquid.rebuildGrid(liquid, target_grid_coords.gridIndex);
                                                Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                                            }
                                        }
                                    } else if(isDef(target_grid_coords.cellRow) && isDef(target_grid_coords.cellCol)) {
                                        if(confirm(Liquid.moveCellsMessage)) {
                                            sourceGridCol.row = target_grid_coords.cellRow;
                                            sourceGridCol.col = target_grid_coords.cellCol;
                                            Liquid.setAskForSave(liquid, true);
                                            // update the source
                                            if(isDef(liquid.sourceData)) {
                                                if(isDef(liquid.sourceData.rootControlId)) {
                                                    if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                                                        var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                                                        if(sourceLiquid) {
                                                            var sourceForeignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                                                            if(sourceForeignTable) {
                                                                if(isDef(sourceForeignTable.options)) {
                                                                    if(isDef(sourceForeignTable.options.grids)) {
                                                                        var sourceGridCol = sourceForeignTable.options.grids[grid_coords.gridIndex].columns[grid_coords.itemIndex];
                                                                        sourceGridCol.row = target_grid_coords.cellRow;
                                                                        sourceGridCol.col = target_grid_coords.cellCol;
                                                                        Liquid.setAskForSave(sourceLiquid, true);
                                                                    } else {
                                                                        console.error("ERROR : source grid update failed .. grid not found");
                                                                    }
                                                                } else {
                                                                    console.error("ERROR : source grid update failed .. options not found");
                                                                }
                                                            } else {
                                                                console.error("ERROR : source grid update failed .. sourceForeignTable not found");
                                                            }
                                                        } else {
                                                            console.error("ERROR : source grid update failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                                                        }
                                                    } else {
                                                        console.error("ERROR : source grid update failed .. source foreign table not indexed");
                                                    }
                                                } else {
                                                    console.error("ERROR : source grid update failed .. rootControlId not defined");
                                                }
                                            }
                                            liquid.sourceData.tempCurrentTab = target_grid_coords.gridIndex+1;
                                            // Liquid.rebuildGrid(liquid, target_grid_coords.gridIndex);
                                            Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                                        }
                                    }
                                } else {
                                    console.error("ERROR: target coords not detected");
                                }
                            }
                        }
                    } else {
                        console.error("ERROR: source coords not detected");
                    }
                } else {
                    console.error("ERROR: control type not recognized");
                }
            } 
            
            if(event.target.classList.contains('liquidWinXContainer')) {
                if(event.dataTransfer.items) {
                    for (var i = 0; i < event.dataTransfer.items.length; i++) {
                        if(event.dataTransfer.items[i].kind === 'file') {
                            var file = event.dataTransfer.items[i].getAsFile();
                            LiquidEditing.onNewWindowFromFileJson(event.target.id, "winX", event.target.id, file);
                            // console.log('... file[' + i + '].name = ' + file.name);
                        }
                    }
                } else {
                    for (var i = 0; i < event.dataTransfer.files.length; i++) {
                        var file = event.dataTransfer.files[i];
                        LiquidEditing.onNewWindowFromFileJson(event.target.id, "winX", event.target.id, file);
                        // console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
                    }
                }
            }
        }
        event.stopPropagation();
        event.preventDefault();
    },
    setAskForSave:function(liquidOrControlId, askForSave) {
        liquid = Liquid.getLiquid(liquidOrControlId);
        if(liquid) {
            while(liquid.srcLiquid) liquid = liquid.srcLiquid;
            liquid.askForSave = askForSave;
        }
    },
    rebuildGrid:function(liquidOrControlId, gridIndex) { // TODO : test
        liquid = Liquid.getLiquid(liquidOrControlId);
        if(liquid) {
            var gridContainer = liquid.tableJson.grids[gridIndex].gridObj.parentNode;
            gridContainer.innerHTML = "";
            liquid.tableJson.grids[gridIndex].gridObj = Liquid.createGrid(liquid, liquid.tableJson.grids[gridIndex], gridIndex + 1, liquid.tableJson.grids[gridIndex].containerObj);
            gridContainer.appendChild(liquid.tableJson.grids[gridIndex].gridObj);
        }
    },            
    rebuild:function(liquidOrControlId, outDivObjOrId, tableJson) {
        liquid = Liquid.getLiquid(liquidOrControlId);
        if(liquid) {
            if(outDivObjOrId) {
                setTimeout(function(){ Liquid.doRebuild(liquid, outDivObjOrId, tableJson); }, 250);
            }
        }
    },
    doRebuild:function(liquid, outDivObjOrId, tableJson) {
        if(liquid){
            if(outDivObjOrId) {
                var controlId=liquid.controlId;
                var sourceData = { 
                     liquidOrId:liquid.srcLiquid
                    ,foreignWrk:liquid.srcForeignWrk
                    ,foreignTable:liquid.srcForeignTable
                    ,foreignColumn:liquid.srcForeignColumn
                    ,column:liquid.srcColumn
                    ,rootControlId:liquid.rootControlId
                    ,sourceForeignTablesIndexes1B:isDef(liquid.sourceData) ? liquid.sourceData.sourceForeignTablesIndexes1B : null
                    ,columnsApiParams:isDef(liquid.sourceData) ? liquid.sourceData.columnsApiParams : null
                    ,columnsApi:isDef(liquid.sourceData) ? liquid.sourceData.columnsApi : Liquid.columnsApi
                    ,gridsApiParams:isDef(liquid.sourceData) ? liquid.sourceData.gridsApiParams : null
                    ,gridsApi:isDef(liquid.sourceData) ? liquid.sourceData.gridsApi : Liquid.gridsApi
                    ,tempCurrentTab:isDef(liquid.sourceData) ? liquid.sourceData.tempCurrentTab : null
                    ,isRebuilding:true
                    ,askForSave:liquid.askForSave 
                };
                if(liquid.outDivObj)
                    liquid.outDivObj.innerHTML = "";
                if(liquid instanceof LiquidCtrl) {
                    if(Liquid.debug) {
                        console.info("REBUILDING: controlId:"+liquid.controlId+" - token:"+liquid.tableJson.token);
                    }
                    tableJson.token = liquid.tableJson.token;
                    Liquid.destroy(liquid);                    
                    new LiquidCtrl( controlId, outDivObjOrId, JSON.stringify(tableJson)
                                    , sourceData
                                    , liquid.mode, liquid.parentObjId );
                                    
                    if(Liquid.debug) {
                        liquid = Liquid.getLiquid(controlId);
                        console.info("REBUILDING: DONE ... token:"+liquid.tableJson.token);
                    }
                                    
                } else if(liquid instanceof LiquidMenuXCtrl) {
                    tableJson.token = liquid.menuJson.token;
                    Liquid.destroy(liquid);                    
                    new LiquidMenuXCtrl(outDivObjOrId, JSON.stringify(tableJson), liquid.options  );
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
    showFrame:function(frameId) {
        if(glLastFrameId) {
            if(glLastFrameId !== frameId) {
                var LastFrameId = glLastFrameId;
                jQ1124( "#"+LastFrameId ).slideUp( "fast", function() {
                    jQ1124( "#"+LastFrameId ).css("display","none");
                });
            }
        }
        jQ1124( "#"+frameId ).css("display","");
        jQ1124( "#"+frameId ).css("overflow","visible");
        jQ1124( "#"+frameId ).css("visibility","visible");
        jQ1124( "#"+frameId ).slideDown( "fast", function() {
            glLastFrameId = frameId;
        });
    },
    removeRuntimeProps:function(liquid) {
        return Liquid.removeRuntimeTableJsonProps(liquid.tableJson);
    },
    removeRuntimeTableJsonProps:function(tableJson) {
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
        delete tableJson.token;
        delete tableJson.idColumnField;
        delete tableJson.primaryKeyField;
        delete tableJson.columnsResolved;
        delete tableJson.columnsResolvedBy;
        delete tableJson.tableJsonVariableName;
        delete tableJson.selection;
        delete tableJson.selections;
        delete tableJson.parentObjId;
        return true;
    },
    onSaveToCSV:function(obj) {
        LiquidEditing.onContextMenuClose();
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            liquid.gridOptions.api.exportDataAsCsv();
        }
    },
    /**
     * 
     * Handle the request to the server by ajax oer websocket
     * 
     * @param {type} liquid : the workspace
     * @param {type} xhr the XML Http request
     * @param {type} method : GET or POST
     * @param {type} url
     * @param {type} async : true or false
     * @param {type} data : the body data
     * @param {type} onreadystatechange : the callback
     * @returns {} 
     */
    sendRequest:function(liquid, paramsObject, method, url, async, data, onReadyStateChange, reason, onUploadingProgress, onDownloadingProgress, onCompleted, onFailed, onCancelled) {
        var thisLiquid = liquid;
        if(typeof glLiquidWebSocket !== 'undefined' && glLiquidWebSocket && async == true) {
            // Websocket
            var bCompress = false;
            var token = LiquidStreamer.generate_token(32);
            var request = JSON.stringify( { method:method, url:url, data:data, sessionId:LiquidStreamer.sessionId, token:token } );
            var gzRequest = null;
            if(bCompress) {
                var gzip = new Zlib.Gzip(request);
                gzRequest = gzip.compress();
            } else {
                gzRequest = request;
            }
            var buffer = new ArrayBuffer(4 + 2 + gzRequest.length);
            var requestToSend = new DataView(buffer);
            requestToSend.setUint32(0, gzRequest.length);
            requestToSend.setUint16(4, (bCompress?1:0));
            if(bCompress) {
                for(var i=0; i<gzRequest.length; i++) {
                    // requestToSend.setInt8(4+2+i, gzRequest[i]);
                    requestToSend.setUint8(4+2+i, gzRequest[i]);
                    // requestToSend.buffer[4+2+i] = gzRequest[i];
                    // buffer[4+2+i] = gzRequest[i];
                }
            } else {
                for(var i=0; i<gzRequest.length; i++) {
                    // requestToSend.setInt8(4+2+i, gzRequest[i]);
                    requestToSend.setUint8(4+2+i, gzRequest.charCodeAt(i));
                }            
            }

            // store parameters
            if(!isDef(liquid.xhr))
                liquid.xhr = {};
            liquid.xhr.params = paramsObject;
            
            // create the queue object
            var queue = LiquidStreamer.queueAppendLiquidStreamer( token, reason, onReadyStateChange, onUploadingProgress, onDownloadingProgress, onCompleted, onFailed, onCancelled, liquid, async );
            // send data
            LiquidStreamer.sendLiquidStreamer(buffer, requestToSend.byteLength, queue, async);
        } else {
            // Ajax
            // if(!liquid.xhr) liquid.xhr = new XMLHttpRequest();
            
            // store parameters
            // if(!isDef(liquid.xhr)) liquid.xhr = {};
            
            // if(Liquid.wait_for_xhr_ready(liquid, reason)) {

            var xhr = new XMLHttpRequest();
            var xhrDescription = reason;
            var xhrCount = 0;
            
            {
                if(isDef(onUploadingProgress)) xhr.upload.addEventListener("progress", function(event){ onUploadingProgress(liquid, event); }, false);
                if(isDef(onDownloadingProgress)) xhr.addEventListener("progress", function(event){ onDownloadingProgress(liquid, event); }, false);
                if(isDef(onCompleted)) xhr.addEventListener("load", function(event){ onCompleted(liquid, event); }, false);
                if(isDef(onFailed)) xhr.addEventListener("error", function(event){ onFailed(liquid, event); }, false);
                if(isDef(onCancelled)) xhr.addEventListener("abort", function(event){ onCancelled(liquid, event); }, false);

                if(isDef(paramsObject)) xhr.params = paramsObject;
                if(isDef(onReadyStateChange)) xhr.onReadyStateChange = onReadyStateChange;

                xhr.open(method, url, async);
                if(async) {
                    xhr.onreadystatechange = function() {
                        return xhr.onReadyStateChange(thisLiquid, xhr);
                    }
                }
                xhr.send(data);
                // Liquid.release_xhr(liquid);
                if(!async) {
                    return xhr.onReadyStateChange(liquid, xhr);
                }
            } /* else {
                console.error("ERROR: sendRequest(): potential duplicate call on control '"+liquid.controlId
                        +"'\n\nplease avoid multiple call on the same control"
                        +"'\n\nprevoius call: "+xhrDescription
                        +"'\n\ncurrent call: "+reason
                        );
                if(xhrCount < 10) {
                    xhrCount++;
                    setTimeout(function() { 
                        Liquid.sendRequest(liquid, paramsObject, method, url, async, data, onReadyStateChange, reason, onUploadingProgress, onDownloadingProgress, onCompleted, onFailed, onCancelled);
                    }, 3000);
                } else {
                    alert("!!! " + liquid.controlId+" is till waiting for last operaion:"+xhrDescription+ " !!!");
                }
            }
            */
        }
    },
    /**
     * 
     * logout the current user
     * 
     * @param {type} reload : if true rekiad the page
     * @returns {} 
     */
    logout:function(reload) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', glLiquidServlet + '?operation=logout', false);
        xhr.send();
        if(xhr.status === 200) {
            try {
                if(xhr.responseText) {
                    console.message(xhr.responseText);
                } else {
                    console.error(xhr.responseText);
                }
            } catch (e) {
                console.error(xhr.responseText);
            }
            if(reload) {
                Liquid.disableUnloadPagePrompt();
                window.location.reload();
            }
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
        var controlId = divObj.getAttribute('controlId');
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
    var out = "";
    var list = this.split("_");
    for(var i=0; i<list.length; i++) {
        if(i) 
            out += capitalizeFirstLetter(list[i]);
        else 
            out += list[i];
    }
    return out;
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
    if(isNaN(Number(params.value))) params.value = params.value.replace(/\,/g, ".");
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
        // jQ1124(this.eInput).append(this.dp);
        // jQ1124(this.dp).css('position', 'unset');
        // jQ1124(this.dp).css('display', 'block');
        // jQ1124(this.dp).css('width', '100%');
        // jQ1124(this.dp).css('height', '100%');
        // jQ1124(this.dp).css('top', '0');
        // jQ1124(this.dp).css('left', '0');
    }
    this.eInputX.focus();
    this.eInputX.select();
};
DateEditor.prototype.getValue = function() { return this.eInputX.value; };
DateEditor.prototype.destroy = function() { /*this.dp.parentNode.removeChild(this.dp);*/ };
DateEditor.prototype.isPopup = function() { return true; };
DateEditor.prototype.getControlObj = function(controlName, linkedObj) {
    var dpList = jQ1124(this.controlName);
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
    
    if(this.table && this.column) {

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
                            Liquid.showToast(Liquid.appTitle, msg, "success");
                        } else {
                            var msg = Liquid.lang === 'eng' ? ("Reading "+this.liquid.tableJson.table+"."+this.column+" done</br></br>No items found") : ("Lettura "+this.liquid.tableJson.table+"."+this.column+" completata</br></br>Nessuna riga trovata" );
                            Liquid.showToast(Liquid.appTitle, msg, "warning");
                        }
                    }

                    if(resultJson.error) {
                        var err = "";
                        try { err = atob(httpResultJson.error); } catch(e) { err = httpResultJson.error; }
                        console.error("Error reading data: " + err);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
    } else {
        params.colDef.cellEditorParams.values = params.values;
        params.colDef.cellEditorParams.codes = params.codes;        
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
            var selNodes = [ this.node ];
            if(selNodes && selNodes.length > 0) {
                for(var node=0; node<selNodes.length; node++) {
                    if(selNodes[node].data[this.targetColumnIndex] !== this.eInput.value) {
                        var validateResult = Liquid.validateField(this.liquid, this.liquid.tableJson.columns[this.iCol], this.eInput.value);
                        if(validateResult !== null) {
                            if(validateResult[0] >= 0) {
                                this.eInput.value = validateResult[1];
                                // selNodes[node].data[this.targetColumnIndex] = this.eInput.value;
                                selNodes[node].setDataValue(String(this.iCol + 1), this.eInput.value);
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
                            // selNodes[node].data[this.targetField] = this.eInput.value;
                            selNodes[node].setDataValue(this.targetField, this.eInput.value);
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
        this.dlg = LiquidEditing.createSystemEditorsDialog(this.liquid, this.resultId);
    } else if(params.colDef.cellEditorParams.type === "systemLookups") {
        this.dlg = LiquidEditing.createSystemLookupDialog(this.liquid, this.resultId);
    } else if(params.colDef.cellEditorParams.type === "systemOptions") {
        this.dlg = LiquidEditing.createSystemOptionsDialog(this.liquid, this.resultId);
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
	try {
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
	    
	    var gridHeaderMenu = true;
	    if(liquid) {
	    	gridHeaderMenu = liquid.tableJson.gridHeaderMenu;
	    }
	    this.eGui.innerHTML = ''
	        +'<div style=\"display:inline-flex\">'
	        +(agParams.enableMenu ? '<div class="customHeaderMenuButton" style=\"'+style+'\">' + (gridHeaderMenu !== false ? this.agParams.menuIcon : "") + '</div>' : "")
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
	    	 if(this.eMenuButton) {
	    		 this.onMenuClickListener = this.onMenuClick.bind(this);
	    		 this.eMenuButton.addEventListener('click', this.onMenuClickListener);
	    	 }
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
	} catch(e) { console.error(e); }
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
    
    var colIndex1B = Number(this.agParams.column.colDef.field);
    var columnName = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].name : "";
    var sortColumnsMode = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode : "asc";
    if(columnName) {
        if(sortColumnsMode === "asc") this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "desc";
        else this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "asc";
    }
    
    if(sortServer === 'server') {
        if(typeof this.agParams.liquidLink.sortColumns === 'undefined' || !this.agParams.liquidLink.sortColumns)
            this.agParams.liquidLink.sortColumns = [];
        if(columnName) {
            if(event.shiftKey || event.ctrlKey) {
                if(this.agParams.liquidLink.sortColumns.indexOf(columnName) < 0) 
                    this.agParams.liquidLink.sortColumns.push(columnName);
            } else {
                this.agParams.liquidLink.sortColumns = [ columnName ];
            }
            this.agParams.liquidLink.sortColumnsMode = this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode;
        }
        Liquid.loadData(this.agParams.liquidLink, null, "onSortRequested");
    } else {
        if(order==='auto') {
            if(sortColumnsMode === "asc") {
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
if(window.addEventListener) { window.addEventListener('scroll', Liquid.onWindowScroll); } else { window.attachEvent('scroll', Liquid.onWindowScroll); }
if(document.addEventListener) { document.addEventListener('contextmenu', function(e) { if(typeof(LiquidEditing)!=='undefined') if(LiquidEditing.onContextMenu(e)) e.preventDefault(); }, false ); } else { document.attachEvent('contextmenu', function() { if(isDef(LiquidEditing)) if(LiquidEditing.onContextMenu(window.event)) window.event.returnValue = false; }); }



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

function getCurrentTimetick() {
    return ((new Date().getTime() * 1000) + 621355968000000000);        
}

// set language
Liquid.setLanguage( navigator.language || navigator.userLanguage );