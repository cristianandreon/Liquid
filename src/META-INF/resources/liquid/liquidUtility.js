/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */



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
    var list = this.replace("-", "_").replace(" ", "_").split("_");
    for(let i=0; i<list.length; i++) {
        if(i)
            out += capitalizeFirstLetter(list[i]);
        else
            out += list[i].toLowerCase();
    }
    return out;
};

String.prototype.toDescriptionCase = function() {
    var out = "";
    var list = this.replaceAll("-", " ").replaceAll("_", " ").split(" ");
    for(let i=0; i<list.length; i++) {
        if(i)
            out += " " + list[i].toLowerCase();
        else
            out += capitalizeFirstLetter(list[i])
    }
    return out;
};

String.prototype.camelCasetoDescriptionCase = function() {
    var out = "";
    var list = this.replace(/([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/g, '!$&').split('!');
    for(let i=0; i<list.length; i++) {
        if(i)
            out += " " + list[i].toLowerCase();
        else
            out += capitalizeFirstLetter(list[i])
    }
    return out;
};


const capitalizeFirstLetter = (s) => {
    if(typeof s !== 'string')
        return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/ /g, "").toLowerCase();
};
const capitalizeOnlyFirstLetter = (s) => {
    if(typeof s !== 'string')
        return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/ /g, "");
};



// Editors


function DatalistEditor() {}
DatalistEditor.prototype.init = function(params) {
    this.eInput = document.createElement('input');
    this.eInput.style.color = 'blue';
    this.eInput.style.minWidth = '500px';
    this.eInput.style.minHeight = '30px';
    this.eInput.style.zIndex = 30000;
    this.eInput.autocomplete = "off";
    this.create_datalist_from_column(params.liquid, params.column.colId);
    this.onmousedown = function (e) {
        this.placeholder = this.value;
        if (!this.readOnly && !this.disabled) this.value = ''
    };
    this.onblur = function (e) {
        if (!this.value) this.value = this.placeholder;
    };
    this.params = params;
};
DatalistEditor.prototype.getGui = function() {
    return this.eInput;
};
DatalistEditor.prototype.afterGuiAttached = function() {
    this.eInput.focus();
    this.eInput.select();
    this.eInput.parentNode.appendChild(this.eDatalist);
    this.eInput.setAttribute('list', this.eDatalist.id);
    this.eInput.click();
    if(this.params.charPress) {
        this.eInput.value = this.params.charPress;
    } else {
        this.eInput.value = this.params.value;
    }
};
DatalistEditor.prototype.getValue = function() { return this.eInput.value; };
DatalistEditor.prototype.destroy = function() {};
DatalistEditor.prototype.isPopup = function() {
    return false;
};

DatalistEditor.prototype.create_datalist_from_column = function(liquid, colId) {
    this.eDatalist = document.createElement('datalist');
    this.eDatalist.id = "liquid.editor.datalistEditor.datalist";
    var nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
    var values = [];
    for (var i = 0; i < nodes.length; i++) {
        if(nodes[i].data[colId]) {
            var opt = document.createElement('option');
            if(!values.contains(nodes[i].data[colId])) {
                opt.text = nodes[i].data[colId];
                this.eDatalist.appendChild(opt);
                values.push(nodes[i].data[colId]);
            }
        }
    }
}



function MultiLineEditor() {}

MultiLineEditor.prototype.init = function(params) {
    this.eInput = document.createElement('textarea');
    this.eInput.rows="5";
    this.eInput.cols="20";
    this.eInput.multiline = true;
    this.eInput.value = params.value;
    this.eInput.style.color = 'red';
    this.eInput.style.minWidth = '500px';
    this.eInput.style.minHeight = '200px';
    this.eInput.style.zIndex = 30000;

};
MultiLineEditor.prototype.getGui = function() {
    return this.eInput;
};
MultiLineEditor.prototype.afterGuiAttached = function() {
    this.eInput.focus();
    this.eInput.select();
};
MultiLineEditor.prototype.getValue = function() { return this.eInput.value; };
MultiLineEditor.prototype.destroy = function() {};
MultiLineEditor.prototype.isPopup = function() {
    return false;
};


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

        let controlId = this.liquid.controlId;
        // var lookupControlId = this.liquid.controlId + "_" + "list" + "_" + lookupControlName.replace(/\./g, "_");
        let srcForeignWrk = (typeof this.liquid.srcForeignWrk !== "undefined" && this.liquid.srcForeignWrk ? this.liquid.srcForeignWrk : null);
        let sortColumns = null;
        let sortColumnsMode = null;
        if(isDef(this.liquid.tableJson.columns[this.iCol].lookup)) {
            if(!isDef(this.liquid.tableJson.columns[this.iCol].lookup.controlId)) {
                for (var i = 0; i < glLiquids.length; i++) {
                    if (isDef(glLiquids[i].tableJson)) {
                        if (glLiquids[i].tableJson.table === this.liquid.tableJson.columns[this.iCol].lookup.foreignTable) {
                            this.liquid.tableJson.columns[this.iCol].lookup.controlId = glLiquids[i].controlId;
                            break;
                        }
                    }
                }
            }
            controlId = this.liquid.tableJson.columns[this.iCol].lookup.controlId;
            srcForeignWrk = null;
        }
        for (var i = 0; i < glLiquids.length; i++) {
            if(glLiquids[i].controlId == controlId) {
                if (isDef(glLiquids[i].tableJson)) {
                    sortColumns = glLiquids[i].tableJson.sortColumns;
                    sortColumnsMode = glLiquids[i].tableJson.sortColumnsMode;
                }
                break;
            }
        }
        var xhr = new XMLHttpRequest();
        if(params.colDef.cellEditorParams.cache === false || typeof params.colDef.cellEditorParams.values === 'undefined' || params.colDef.cellEditorParams.values === null) {
            xhr.open('POST', glLiquidServlet + '?operation=get'
                + '&controlId=' + controlId
                + (srcForeignWrk != null ? '&tblWrk=' + srcForeignWrk : '')
                + (this.table ? '&targetTable=' + this.table : "")
                + '&targetColumn=' + this.column
                + (this.idColumn ? '&idColumn=' + this.idColumn : '')
                + '&targetMode=' + params.colDef.cellEditorParams.editor
                + '&extendedMetadata=false'
                + (sortColumns ? '&sortColumns=' + sortColumns : '')
                + (sortColumnsMode ? '&sortColumnsMode=' + sortColumnsMode : '')
                ,(typeof params.async !== 'undefined' ? params.async : false)
            );
            xhr.setRequestHeader("X-Timezone-Offset", new Date().getTimezoneOffset());
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
                        for(let i=0; i<resultJson.resultSet.length; i++) {
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
                            if(Liquid.debug) {
                                var msg = Liquid.lang === 'eng' ? ("Reading " + this.liquid.tableJson.table + "." + this.column + " done</br></br>Found " + values.length + "item(s)") : ("Lettura " + this.liquid.tableJson.table + "." + this.column + " completata</br></br>Trovat" + (values.length === 1 ? "a" : "e") + " " + values.length + " rig" + (values.length === 1 ? "a" : "he"));
                                Liquid.showToast(Liquid.appTitle, msg, "success");
                            }
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
            } else {
                let err = "ERROR: failed to read tables (error:" + xhr.status +")"
                Liquid.showToast(Liquid.appTitle, err, "error");
                console.error(err);
            }
        }
    } else {
        if(isDef(params.values) || isDef(params.codes)) {
            params.colDef.cellEditorParams.values = params.values;
            params.colDef.cellEditorParams.codes = params.codes;
        }
    }
    if(typeof params.headless === 'undefined' || !params.headless) {
        var values = (params.colDef.cellEditorParams ? params.colDef.cellEditorParams.values : null);
        var codes = (params.colDef.cellEditorParams ? params.colDef.cellEditorParams.codes : null);
        if(values) {
            for(let i=0; i<values.length; i++) {
                var opt = document.createElement('option');
                opt.text = values[i];
                if(codes)
                    opt.value = codes[i];
                if(params.data[params.colDef.cellEditorParams.iCol + 1] === opt.text)
                    opt.selected = 'selected';
                this.eInput.add(opt);
                this.onmousedown=function(e) { this.placeholder=this.value; if(!this.readOnly && !this.disabled) this.value ='' };
                this.onblur=function(e) { if(!this.value) this.value=this.placeholder; };
            }
        }
    }
};
SelectEditor.prototype.getGui = function() { return this.eInput; };
SelectEditor.prototype.afterGuiAttached = function() { this.eInput.focus(); };
SelectEditor.prototype.getValue = function () {
    if (this.cellEditorParams.idColumn && this.cellEditorParams.targetColumn) {
        var fullTargetColumn = this.liquid.tableJson.table + "." + this.cellEditorParams.targetColumn;
        for (let i = 0; i < this.liquid.tableJson.columns.length; i++) {
            if (this.liquid.tableJson.columns[i].name === this.cellEditorParams.targetColumn || this.liquid.tableJson.columns[i].name === fullTargetColumn) {
                this.targetColumnIndex = this.liquid.tableJson.columns[i].field;
                break;
            }
        }
        if (this.targetColumnIndex) {
            if (isDef(this.iCol)) {
                this.liquid.tableJson.columns[this.iCol].isReflected = true;
            }
            var selNodes = [this.node];
            if (selNodes && selNodes.length > 0) {
                for (let node = 0; node < selNodes.length; node++) {
                    if (selNodes[node].data[this.targetColumnIndex] !== this.eInput.value) {
                        var validateResult = Liquid.validateFieldSync(this.liquid, this.liquid.tableJson.columns[this.iCol], this.eInput.value);
                        if (validateResult !== null) {
                            if (validateResult[0] >= 0) {
                                this.eInput.value = validateResult[1];
                                // selNodes[node].data[this.targetColumnIndex] = this.eInput.value;
                                selNodes[node].setDataValue(String(this.iCol + 1), this.eInput.value);
                                Liquid.registerFieldChange(this.liquid, null, selNodes[node].data[this.liquid.tableJson.primaryKeyField ? this.liquid.tableJson.primaryKeyField : null], String(this.iCol + 1), null, this.eInput.value);
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
    } catch (e) {
    }
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
        for(let node=0; node<selNodes.length; node++) {
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
            for(let node=0; node<selNodes.length; node++) {
                if(selNodes[node].data[this.targetField] !== this.eInput.value) {
                    var validateResult = Liquid.validateField(this.liquid, this.liquid.tableJson.columns[this.targetField], this.eInput.value);
                    if(validateResult !== null) {
                        if(validateResult[0] >= 0) {
                            this.eInput.value = validateResult[1];
                            // selNodes[node].data[this.targetField] = this.eInput.value;
                            selNodes[node].setDataValue(this.targetField, this.eInput.value);
                            Liquid.registerFieldChange(this.liquid, null, selNodes[node].data[ this.liquid.tableJson.primaryKeyField ? this.liquid.tableJson.primaryKeyField : null ], this.targetField, null, this.eInput.value);
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

    Liquid.showDlg(this.dlg);

    var selNodes = Liquid.getCurNodes(this.liquid);
    if(selNodes && selNodes.length > 0) {
        for(let node=0; node<selNodes.length; node++) {
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
        Liquid.onEvent(this.agParams.liquidLink, "onSorting", null, null, null, true);
    } catch(e) { console.error(e); }
    var sortSide = '';
    if(this.agParams.liquidLink)
        if(this.agParams.liquidLink.nPages > 1) sortSide = 'server';
        else if(isDef(this.agParams.liquidLink.tableJson.sortMode)) sortSide = this.agParams.liquidLink.tableJson.sortMode;

    var colIndex1B = Number(this.agParams.column.colDef.field);
    var columnName = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].name : "";
    var sortColumnsMode = colIndex1B > 0 ? this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode : "asc";
    if(columnName) {
        if(sortColumnsMode === "asc") this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "desc";
        else this.agParams.liquidLink.tableJson.columns[colIndex1B-1].sortMode = "asc";
    }

    if(sortSide === 'server') {
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
    return (typeof __var === 'undefined' || __var === null || __var === 'null') ? false : true;
}

function isDefOrNull(__var) {
    return (typeof __var !== 'undefined') ? true : false;
}


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

/**
 * Show image in canvas
 * @param canvas
 * @param url
 */
function load_image_to_canvas(canvas, url, mode) {
    var img = new Image();
    var context = canvas.getContext('2d');
    img.canvas = canvas;
    img.mode = mode;
    img.onload = function(event){
        try {
            if(this.width > 2048 || this.height > 2048) {
                console.warn("LIQUID : Image too large : "+this.width+"x"+this.height + " at "+this.src);
            }
            if(this.mode === 'original') {
                context.drawImage(this, 0, 0, this.width, this.height);
            } else if(this.mode === 'auto') {
                // context.drawImage(this, 0, 0, this.width, this.height, this.canvas.width, this.canvas.height);
                drawImageProp(context, this, 0, 0, this.canvas.width, this.canvas.height, 0.5, 0.5);
            } else{
                context.drawImage(this, 0, 0);
            }
        } catch (e) {
            console.error(e);
            try {
                // context.drawImage(this, 0, 0, this.canvas.width, this.canvas.height, this.canvas.width, this.canvas.height);
                drawImageProp(context, this, this.canvas.width, this.canvas.height, 0.5, 0.5);
            } catch (e) {
                context.drawImage(this, 0, 0);
            }
        }
    };
    img.src = url;
}


function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {

    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // decide which gap to fill
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
}

/**
 * Show pdf in canvas
 * @param canvas
 * @param url
 */
function load_pdf_to_canvas(canvas, url) {
    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    // var pdfjsLib = window['/PDF.js/build/pdf'];
    if(url) {
        var pdfjsLib = window.pdfjsLib;
        if (pdfjsLib) {

            // The workerSrc property shall be specified.
            pdfjsLib.GlobalWorkerOptions.workerSrc = Liquid.pdfJsPath + '/pdf.worker.js';

            // Asynchronous download of PDF
            var loadingTask = pdfjsLib.getDocument(url);

            loadingTask.promise.then(function (pdf) {
                if (Liquid.pdfJsDebug)
                    console.log('PDF loaded');

                // Fetch the first page
                var pageNumber = 1;
                pdf.getPage(pageNumber).then(function (page) {
                    if (Liquid.pdfJsDebug)
                        console.log('Page loaded');

                    var scale = 1.0;
                    var viewport = page.getViewport({scale: scale});

                    // Prepare canvas using PDF page dimensions
                    var context = canvas.getContext('2d');

                    var new_scale = canvas.width / viewport.width;
                    viewport = page.getViewport({scale: new_scale});

                    // canvas.height = viewport.height;
                    // canvas.width = viewport.width;

                    // Render PDF page into canvas context
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    var renderTask = page.render(renderContext);
                    renderTask.promise.then(function () {
                        if (Liquid.pdfJsDebug)
                            console.log('Page rendered');
                    });
                });
            }, function (reason) {
                // PDF loading error
                console.error(reason);
            });
        } else {
            alert("Missing lib : pdfjsLib .. please add \"pdf.js\" (defauly path is '/PDF.js/build') to the project");
        }
    }
}

function getCurrentTimetick() {
    return ((new Date().getTime() * 1000) + 621355968000000000);
}


Array.prototype.contains = function(searchElement) { 'use strict';
    if(this === null) throw new TypeError('Array.prototype.contains called on null or undefined');
    for(let i=0; i<this.length; i++)
        if(searchElement === this[i])return true;
    return false;
};




(function($) {
    try {
        $.fn.currencyInput = function () {
            this.each(function () {
                jQ1124(this).change(function () {
                    var min = parseFloat(jQ1124(this).attr("min"));
                    var max = parseFloat(jQ1124(this).attr("max"));
                    var value = this.valueAsNumber;
                    if(!isNaN(value)) {
                        if (!isNaN(min) && value < min)
                            value = min;
                        else if (!isNaN(max) && value > max)
                            value = max;
                        jQ1124(this).val(value.toFixed(2));
                    }
                });
            });
        };
    } catch (e) {}
})(jQuery);
