! function(e) {
    var version = 1.01;
    var t = {};

    function i(n) {
        if (t[n]) return t[n].exports;
        var l = t[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return e[n].call(l.exports, l, l.exports, i), l.l = !0, l.exports
    }
    i.m = e, i.c = t, i.d = function(e, t, n) {
        i.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: n
        })
    }, i.r = function(e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, i.t = function(e, t) {
        if (1 & t && (e = i(e)), 8 & t) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var n = Object.create(null);
        if (i.r(n), Object.defineProperty(n, "default", {
                enumerable: !0,
                value: e
            }), 2 & t && "string" != typeof e)
            for (var l in e) i.d(n, l, function(t) {
                return e[t]
            }.bind(null, l));
        return n
    }, i.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default
        } : function() {
            return e
        };
        return i.d(t, "a", t), t
    }, i.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, i.p = "", i(i.s = "XJR1")
}({
    "3FqI": function(e, t, i) {},
    P6u4: function(e, t, i) {
        "use strict";
        var n, l;
        n = "undefined" != typeof window ? window : this, l = function(e, t) {
            const i = {
                toolbar: {
                    default: "Default",
                    save: "Save",
                    font: "Font",
                    formats: "Formats",
                    fontSize: "Size",
                    bold: "Bold",
                    underline: "Underline",
                    italic: "Italic",
                    strike: "Strike",
                    subscript: "Subscript",
                    superscript: "Superscript",
                    removeFormat: "Remove Format",
                    fontColor: "Font Color",
                    hiliteColor: "Highlight Color",
                    indent: "Indent",
                    outdent: "Outdent",
                    align: "Align",
                    alignLeft: "Align left",
                    alignRight: "Align right",
                    alignCenter: "Align center",
                    alignJustify: "Align justify",
                    list: "List",
                    orderList: "Ordered list",
                    unorderList: "Unordered list",
                    horizontalRule: "Horizontal line",
                    hr_solid: "Solid",
                    hr_dotted: "Dotted",
                    hr_dashed: "Dashed",
                    table: "Table",
                    link: "Link",
                    image: "Image",
                    video: "Video",
                    fullScreen: "Full screen",
                    showBlocks: "Show blocks",
                    codeView: "Code view",
                    undo: "Undo",
                    redo: "Redo",
                    preview: "Preview",
                    print: "print",
                    tag_p: "Paragraph",
                    tag_div: "Normal (DIV)",
                    tag_h: "Header",
                    tag_blockquote: "Quote",
                    tag_pre: "Code",
                    template: "Template",
                    lineHeight: "Line height",
                    paragraphStyle: "Paragraph style",
                    textStyle: "Text style"
                },
                dialogBox: {
                    linkBox: {
                        title: "Insert Link",
                        url: "URL to link",
                        text: "Text to display",
                        newWindowCheck: "Open in new window"
                    },
                    imageBox: {
                        title: "Insert image",
                        file: "Select from files",
                        url: "Image URL",
                        altText: "Alternative text"
                    },
                    videoBox: {
                        title: "Insert Video",
                        url: "Media embed URL, YouTube"
                    },
                    caption: "Insert description",
                    close: "Close",
                    submitButton: "Submit",
                    revertButton: "Revert",
                    proportion: "Constrain proportions",
                    basic: "Basic",
                    left: "Left",
                    right: "Right",
                    center: "Center",
                    width: "Width",
                    height: "Height",
                    size: "Size",
                    ratio: "Ratio"
                },
                controller: {
                    edit: "Edit",
                    unlink: "Unlink",
                    remove: "Remove",
                    insertRowAbove: "Insert row above",
                    insertRowBelow: "Insert row below",
                    deleteRow: "Delete row",
                    insertColumnBefore: "Insert column before",
                    insertColumnAfter: "Insert column after",
                    deleteColumn: "Delete column",
                    resize100: "Resize 100%",
                    resize75: "Resize 75%",
                    resize50: "Resize 50%",
                    resize25: "Resize 25%",
                    autoSize: "Auto size",
                    mirrorHorizontal: "Mirror, Horizontal",
                    mirrorVertical: "Mirror, Vertical",
                    rotateLeft: "Rotate left",
                    rotateRight: "Rotate right",
                    maxSize: "Max size",
                    minSize: "Min size",
                    tableHeader: "Table header",
                    mergeCells: "Merge cells",
                    splitCells: "Split Cells",
                    HorizontalSplit: "Horizontal split",
                    VerticalSplit: "Vertical split"
                },
                menu: {
                    spaced: "Spaced",
                    bordered: "Bordered",
                    neon: "Neon",
                    translucent: "Translucent",
                    shadow: "Shadow"
                }
            };
            return void 0 === t && (e.SUNEDITOR_LANG || (e.SUNEDITOR_LANG = {}), e.SUNEDITOR_LANG.en = i), i
        }, "object" == typeof e.exports ? e.exports = n.document ? l(n, !0) : function(e) {
            if (!e.document) throw new Error("SUNEDITOR_LANG a window with a document");
            return l(e)
        } : l(n)
    },
    WUQj: function(e, t, i) {},
    XJR1: function(e, t, i) {
        "use strict";
        i.r(t);
        i("3FqI"), i("WUQj");
        var n = {
                name: "colorPicker",
                add: function(e) {
                    const t = e.context;
                    t.colorPicker = {
                        colorListHTML: "",
                        _colorInput: "",
                        _defaultColor: "#000",
                        _styleProperty: "color",
                        _currentColor: "",
                        _colorList: []
                    };
                    let i = this.createColorList(e.context.option, e.lang, this._makeColorList);
                    t.colorPicker.colorListHTML = i, i = null
                },
                createColorList: function(e, t, i) {
                    const n = e.colorList && 0 !== e.colorList.length ? e.colorList : ["#ff0000", "#ff5e00", "#ffe400", "#abf200", "#00d8ff", "#0055ff", "#6600ff", "#ff00dd", "#000000", "#ffd8d8", "#fae0d4", "#faf4c0", "#e4f7ba", "#d4f4fa", "#d9e5ff", "#e8d9ff", "#ffd9fa", "#f1f1f1", "#ffa7a7", "#ffc19e", "#faed7d", "#cef279", "#b2ebf4", "#b2ccff", "#d1b2ff", "#ffb2f5", "#bdbdbd", "#f15f5f", "#f29661", "#e5d85c", "#bce55c", "#5cd1e5", "#6699ff", "#a366ff", "#f261df", "#8c8c8c", "#980000", "#993800", "#998a00", "#6b9900", "#008299", "#003399", "#3d0099", "#990085", "#353535", "#670000", "#662500", "#665c00", "#476600", "#005766", "#002266", "#290066", "#660058", "#222222"];
                    let l = [],
                        o = '<div class="se-list-inner">';
                    for (let e = 0, t = n.length; e < t; e++) "string" == typeof n[e] && (l.push(n[e]), e < t - 1) || (l.length > 0 && (o += '<div class="se-selector-color">' + i(l) + "</div>", l = []), "object" == typeof n[e] && (o += '<div class="se-selector-color">' + i(n[e]) + "</div>"));
                    return o += '<form class="se-submenu-form-group"><input type="text" maxlength="7" class="_se_color_picker_input" /><button type="submit" class="se-btn-primary se-tooltip _se_color_picker_submit"><i class="se-icon-checked"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + t.dialogBox.submitButton + '</span></span></button><button type="button" class="se-btn se-tooltip _se_color_picker_remove"><i class="se-icon-erase"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + t.toolbar.removeFormat + "</span></span></button></form></div>", o
                },
                _makeColorList: function(e) {
                    let t = "";
                    t += '<ul class="se-color-pallet">';
                    for (let i, n = 0, l = e.length; n < l; n++) i = e[n], "string" == typeof i && (t += '<li><button type="button" data-value="' + i + '" title="' + i + '" style="background-color:' + i + ';"></button></li>');
                    return t += "</ul>", t
                },
                init: function(e, t) {
                    const i = this.plugins.colorPicker;
                    let n = t || (i.getColorInNode.call(this, e) || this.context.colorPicker._defaultColor);
                    n = i.isHexColor(n) ? n : i.rgb2hex(n) || n;
                    const l = this.context.colorPicker._colorList;
                    if (l)
                        for (let e = 0, t = l.length; e < t; e++) n.toLowerCase() === l[e].getAttribute("data-value").toLowerCase() ? this.util.addClass(l[e], "active") : this.util.removeClass(l[e], "active");
                    i.setInputText.call(this, i.colorName2hex.call(this, n))
                },
                setCurrentColor: function(e) {
                    this.context.colorPicker._currentColor = e, this.context.colorPicker._colorInput.style.borderColor = e
                },
                setInputText: function(e) {
                    e = /^#/.test(e) ? e : "#" + e, this.context.colorPicker._colorInput.value = e, this.plugins.colorPicker.setCurrentColor.call(this, e)
                },
                getColorInNode: function(e) {
                    let t = "";
                    const i = this.context.colorPicker._styleProperty;
                    for (; e && !this.util.isWysiwygDiv(e) && 0 === t.length;) 1 === e.nodeType && e.style[i] && (t = e.style[i]), e = e.parentNode;
                    return t
                },
                isHexColor: function(e) {
                    return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(e)
                },
                rgb2hex: function(e) {
                    return (e = e.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i)) && 4 === e.length ? "#" + ("0" + parseInt(e[1], 10).toString(16)).slice(-2) + ("0" + parseInt(e[2], 10).toString(16)).slice(-2) + ("0" + parseInt(e[3], 10).toString(16)).slice(-2) : ""
                },
                colorName2hex: function(e) {
                    if (/^#/.test(e)) return e;
                    var t = this.util.createElement("div");
                    t.style.display = "none", t.style.color = e;
                    var i = this._w.getComputedStyle(this._d.body.appendChild(t)).color.match(/\d+/g).map((function(e) {
                        return parseInt(e, 10)
                    }));
                    return this.util.removeItem(t), i.length >= 3 && "#" + ((1 << 24) + (i[0] << 16) + (i[1] << 8) + i[2]).toString(16).substr(1)
                }
            },
            l = {
                name: "dialog",
                add: function(e) {
                    const t = e.context;
                    t.dialog = {
                        kind: "",
                        updateModal: !1
                    };
                    let i = e.util.createElement("DIV");
                    i.className = "se-dialog sun-editor-common";
                    let n = e.util.createElement("DIV");
                    n.className = "se-dialog-back", n.style.display = "none";
                    let l = e.util.createElement("DIV");
                    l.className = "se-dialog-inner", l.style.display = "none", i.appendChild(n), i.appendChild(l), t.dialog.modalArea = i, t.dialog.back = n, t.dialog.modal = l, t.dialog.modal.addEventListener("click", this.onClick_dialog.bind(e)), t.element.relative.appendChild(i), i = null, n = null, l = null
                },
                onClick_dialog: function(e) {
                    e.stopPropagation(), (/se-dialog-inner/.test(e.target.className) || /close/.test(e.target.getAttribute("data-command"))) && this.plugins.dialog.close.call(this)
                },
                open: function(e, t) {
                    if (this.modalForm) return !1;
                    this.plugins.dialog._bindClose && (this._d.removeEventListener("keydown", this.plugins.dialog._bindClose), this.plugins.dialog._bindClose = null), this.plugins.dialog._bindClose = function(e) {
                        /27/.test(e.keyCode) && this.plugins.dialog.close.call(this)
                    }.bind(this), this._d.addEventListener("keydown", this.plugins.dialog._bindClose), this.context.dialog.updateModal = t, "full" === this.context.option.popupDisplay ? this.context.dialog.modalArea.style.position = "fixed" : this.context.dialog.modalArea.style.position = "absolute", this.context.dialog.kind = e, this.modalForm = this.context[e].modal;
                    const i = this.context[e].focusElement;
                    "function" == typeof this.plugins[e].on && this.plugins[e].on.call(this, t), this.context.dialog.modalArea.style.display = "block", this.context.dialog.back.style.display = "block", this.context.dialog.modal.style.display = "block", this.modalForm.style.display = "block", i && i.focus()
                },
                _bindClose: null,
                close: function() {
                    this.plugins.dialog._bindClose && (this._d.removeEventListener("keydown", this.plugins.dialog._bindClose), this.plugins.dialog._bindClose = null);
                    const e = this.context.dialog.kind;
                    this.modalForm.style.display = "none", this.context.dialog.back.style.display = "none", this.context.dialog.modalArea.style.display = "none", this.context.dialog.kind = "", this.context.dialog.updateModal = !1, this.plugins[e].init.call(this), this.modalForm = null, this.focus()
                }
            },
            o = {
                name: "resizing",
                add: function(e) {
                    const t = e.context;
                    t.resizing = {
                        _resizeClientX: 0,
                        _resizeClientY: 0,
                        _resize_plugin: "",
                        _resize_w: 0,
                        _resize_h: 0,
                        _origin_w: 0,
                        _origin_h: 0,
                        _rotateVertical: !1,
                        _resize_direction: "",
                        _move_path: null,
                        _isChange: !1
                    };
                    let i = this.setController_resize.call(e);
                    t.resizing.resizeContainer = i, t.resizing.resizeDiv = i.querySelector(".se-modal-resize"), t.resizing.resizeDot = i.querySelector(".se-resize-dot"), t.resizing.resizeDisplay = i.querySelector(".se-resize-display");
                    let n = this.setController_button.call(e);
                    t.resizing.resizeButton = n, n.addEventListener("mousedown", (function(e) {
                        e.stopPropagation()
                    }), !1);
                    let l = t.resizing.resizeHandles = t.resizing.resizeDot.querySelectorAll("span");
                    t.resizing.resizeButtonGroup = n.querySelector("._se_resizing_btn_group"), t.resizing.rotationButtons = n.querySelectorAll("._se_resizing_btn_group ._se_rotation"), t.resizing.percentageButtons = n.querySelectorAll("._se_resizing_btn_group ._se_percentage"), t.resizing.alignMenu = n.querySelector(".se-resizing-align-list"), t.resizing.alignMenuList = t.resizing.alignMenu.querySelectorAll("button"), t.resizing.alignButton = n.querySelector("._se_resizing_align_button"), t.resizing.alignButtonIcon = t.resizing.alignButton.querySelector("i"), t.resizing.autoSizeButton = n.querySelector("._se_resizing_btn_group ._se_auto_size"), t.resizing.captionButton = n.querySelector("._se_resizing_caption_button"), l[0].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[1].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[2].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[3].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[4].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[5].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[6].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l[7].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), n.addEventListener("click", this.onClick_resizeButton.bind(e)), t.element.relative.appendChild(i), t.element.relative.appendChild(n), i = null, n = null, l = null
                },
                setController_resize: function() {
                    const e = this.util.createElement("DIV");
                    return e.className = "se-resizing-container", e.style.display = "none", e.innerHTML = '<div class="se-modal-resize"></div><div class="se-resize-dot"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span><span class="lw"></span><span class="th"></span><span class="rw"></span><span class="bh"></span><div class="se-resize-display"></div></div>', e
                },
                setController_button: function() {
                    const e = this.lang,
                        t = this.util.createElement("DIV");
                    return t.className = "se-controller se-controller-resizing", t.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="se-btn-group _se_resizing_btn_group"><button type="button" data-command="percent" data-value="1" class="se-tooltip _se_percentage"><span>100%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize100 + '</span></span></button><button type="button" data-command="percent" data-value="0.75" class="se-tooltip _se_percentage"><span>75%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize75 + '</span></span></button><button type="button" data-command="percent" data-value="0.5" class="se-tooltip _se_percentage"><span>50%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize50 + '</span></span></button><button type="button" data-command="auto" class="se-tooltip _se_auto_size"><i class="se-icon-auto-size"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.autoSize + '</span></span></button><button type="button" data-command="rotate" data-value="-90" class="se-tooltip _se_rotation"><i class="se-icon-rotate-left"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.rotateLeft + '</span></span></button><button type="button" data-command="rotate" data-value="90" class="se-tooltip _se_rotation"><i class="se-icon-rotate-right"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.rotateRight + '</span></span></button></div><div class="se-btn-group"><button type="button" data-command="mirror" data-value="h" class="se-tooltip"><i class="se-icon-mirror-horizontal"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mirrorHorizontal + '</span></span></button><button type="button" data-command="mirror" data-value="v" class="se-tooltip"><i class="se-icon-mirror-vertical"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mirrorVertical + '</span></span></button><button type="button" data-command="onalign" class="se-tooltip _se_resizing_align_button"><i class="se-icon-align-justify"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.align + '</span></span></button><div class="se-btn-group-sub sun-editor-common se-list-layer se-resizing-align-list"><div class="se-list-inner"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="basic"><i class="se-icon-align-justify"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.basic + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="left"><i class="se-icon-align-left"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.left + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="center"><i class="se-icon-align-center"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.center + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="right"><i class="se-icon-align-right"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.right + '</span></span></button></li></ul></div></div><button type="button" data-command="caption" class="se-tooltip _se_resizing_caption_button"><i class="se-icon-caption"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.caption + '</span></span></button><button type="button" data-command="revert" class="se-tooltip"><i class="se-icon-revert"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.revertButton + '</span></span></button><button type="button" data-command="update" class="se-tooltip"><i class="se-icon-modify"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.edit + '</span></span></button><button type="button" data-command="delete" class="se-tooltip"><i class="se-icon-delete"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div>", t
                },
                _module_getSizeX: function(e, t, i, n) {
                    return t || (t = e._element), i || (i = e._cover), n || (n = e._container), n && i && t ? /%$/.test(t.style.width) ? (this.util.getNumber(n.style.width, 2) || 100) + "%" : t.style.width : ""
                },
                _module_getSizeY: function(e, t, i, n) {
                    return t || (t = e._element), i || (i = e._cover), n || (n = e._container), n && i && t ? this.util.getNumber(i.style.paddingBottom) > 0 && !this.context.resizing._rotateVertical ? i.style.height : /%$/.test(t.style.height) && /%$/.test(t.style.width) ? (this.util.getNumber(n.style.height, 2) || 100) + "%" : t.style.height : ""
                },
                _module_setModifyInputSize: function(e, t) {
                    const i = e._onlyPercentage && this.context.resizing._rotateVertical;
                    e.proportion.checked = e._proportionChecked = "false" !== e._element.getAttribute("data-proportion");
                    let n = i ? "" : this.plugins.resizing._module_getSizeX.call(this, e);
                    if (n === e._defaultSizeX && (n = ""), e._onlyPercentage && (n = this.util.getNumber(n, 2)), e.inputX.value = n, t.setInputSize.call(this, "x"), !e._onlyPercentage) {
                        let t = i ? "" : this.plugins.resizing._module_getSizeY.call(this, e);
                        t === e._defaultSizeY && (t = ""), e._onlyPercentage && (t = this.util.getNumber(t, 2)), e.inputY.value = t
                    }
                    e.inputX.disabled = !!i, e.inputY.disabled = !!i, e.proportion.disabled = !!i, t.setRatio.call(this)
                },
                _module_setInputSize: function(e, t) {
                    if (e._onlyPercentage) "x" === t && e.inputX.value > 100 && (e.inputX.value = 100);
                    else if (e.proportion.checked && e._ratio && /\d/.test(e.inputX.value) && /\d/.test(e.inputY.value)) {
                        const i = e.inputX.value.replace(/\d+|\./g, "") || e.sizeUnit,
                            n = e.inputY.value.replace(/\d+|\./g, "") || e.sizeUnit;
                        if (i !== n) return;
                        const l = "%" === i ? 2 : 0;
                        "x" === t ? e.inputY.value = this.util.getNumber(e._ratioY * this.util.getNumber(e.inputX.value, l), l) + n : e.inputX.value = this.util.getNumber(e._ratioX * this.util.getNumber(e.inputY.value, l), l) + i
                    }
                },
                _module_setRatio: function(e) {
                    const t = e.inputX.value,
                        i = e.inputY.value;
                    if (e.proportion.checked && /\d+/.test(t) && /\d+/.test(i)) {
                        if ((t.replace(/\d+|\./g, "") || e.sizeUnit) !== (i.replace(/\d+|\./g, "") || e.sizeUnit)) e._ratio = !1;
                        else if (!e._ratio) {
                            const n = this.util.getNumber(t),
                                l = this.util.getNumber(i);
                            e._ratio = !0, e._ratioX = n / l, e._ratioY = l / n
                        }
                    } else e._ratio = !1
                },
                _module_sizeRevert: function(e) {
                    e._onlyPercentage ? e.inputX.value = e._origin_w > 100 ? 100 : e._origin_w : (e.inputX.value = e._origin_w, e.inputY.value = e._origin_h)
                },
                _module_saveCurrentSize: function(e) {
                    const t = this.plugins.resizing._module_getSizeX.call(this, e),
                        i = this.plugins.resizing._module_getSizeY.call(this, e);
                    e._element.setAttribute("data-size", t + "," + i), e._videoRatio && (e._videoRatio = i)
                },
                call_controller_resize: function(e, t) {
                    const i = this.context.resizing,
                        n = this.context[t];
                    i._resize_plugin = t;
                    const l = i.resizeContainer,
                        o = i.resizeDiv,
                        s = this.util.getOffset(e, this.context.element.wysiwygFrame),
                        a = i._rotateVertical = /^(90|270)$/.test(Math.abs(e.getAttribute("data-rotate")).toString()),
                        r = a ? e.offsetHeight : e.offsetWidth,
                        c = a ? e.offsetWidth : e.offsetHeight,
                        d = s.top,
                        u = s.left - this.context.element.wysiwygFrame.scrollLeft;
                    l.style.top = d + "px", l.style.left = u + "px", l.style.width = r + "px", l.style.height = c + "px", o.style.top = "0px", o.style.left = "0px", o.style.width = r + "px", o.style.height = c + "px";
                    let h = e.getAttribute("data-align") || "basic";
                    h = "none" === h ? "basic" : h;
                    const p = this.util.getParentElement(e, this.util.isComponent),
                        g = this.util.getParentElement(e, "FIGURE"),
                        m = this.plugins.resizing._module_getSizeX.call(this, n, e, g, p) || "auto",
                        f = n._onlyPercentage && "image" === t ? "" : ", " + (this.plugins.resizing._module_getSizeY.call(this, n, e, g, p) || "auto");
                    this.util.changeTxt(i.resizeDisplay, this.lang.dialogBox[h] + " (" + m + f + ")"), i.resizeButtonGroup.style.display = n._resizing ? "" : "none";
                    const _ = !n._resizing || n._resizeDotHide || n._onlyPercentage ? "none" : "flex",
                        b = i.resizeHandles;
                    for (let e = 0, t = b.length; e < t; e++) b[e].style.display = _;
                    if (n._resizing) {
                        const e = i.rotationButtons;
                        e[0].style.display = e[1].style.display = n._rotation ? "" : "none"
                    }
                    const y = i.alignMenuList;
                    this.util.removeClass(i.alignButtonIcon, "se-icon-align\\-[a-z]+"), this.util.addClass(i.alignButtonIcon, "se-icon-align-" + ("basic" === h ? "justify" : h));
                    for (let e = 0, t = y.length; e < t; e++) y[e].getAttribute("data-value") === h ? this.util.addClass(y[e], "on") : this.util.removeClass(y[e], "on");
                    const v = i.percentageButtons,
                        C = /%$/.test(e.style.width) && /%$/.test(p.style.width) ? this.util.getNumber(p.style.width) / 100 + "" : "";
                    for (let e = 0, t = v.length; e < t; e++) v[e].getAttribute("data-value") === C ? this.util.addClass(v[e], "active") : this.util.removeClass(v[e], "active");
                    n._captionShow ? (i.captionButton.style.display = "", this.util.getChildElement(e.parentNode, "figcaption") ? (this.util.addClass(i.captionButton, "active"), n._captionChecked = !0) : (this.util.removeClass(i.captionButton, "active"), n._captionChecked = !1)) : i.captionButton.style.display = "none", this._resizingName = t, this.controllersOn(i.resizeContainer, i.resizeButton);
                    const x = this.context.element.wysiwygFrame.offsetWidth - u - i.resizeButton.offsetWidth;
                    i.resizeButton.style.top = c + d + 60 + "px", i.resizeButton.style.left = u + (x < 0 ? x : 0) + "px", i.resizeButton.firstElementChild.style.left = x < 0 ? 20 - x + "px" : "20px", i._resize_w = r, i._resize_h = c;
                    const w = (e.getAttribute("origin-size") || "").split(",");
                    return i._origin_w = w[0] || e.naturalWidth, i._origin_h = w[1] || e.naturalHeight, {
                        w: r,
                        h: c,
                        t: d,
                        l: u
                    }
                },
                _closeAlignMenu: null,
                openAlignMenu: function() {
                    this.util.addClass(this.context.resizing.alignButton, "on"), this.context.resizing.alignMenu.style.display = "inline-table", this.plugins.resizing._closeAlignMenu = function() {
                        this.util.removeClass(this.context.resizing.alignButton, "on"), this.context.resizing.alignMenu.style.display = "none", this.removeDocEvent("mousedown", this.plugins.resizing._closeAlignMenu), this.plugins.resizing._closeAlignMenu = null
                    }.bind(this), this.addDocEvent("mousedown", this.plugins.resizing._closeAlignMenu)
                },
                create_caption: function() {
                    const e = this.util.createElement("FIGCAPTION");
                    return e.setAttribute("contenteditable", !0), e.innerHTML = "<div>" + this.lang.dialogBox.caption + "</div>", e
                },
                set_cover: function(e) {
                    const t = this.util.createElement("FIGURE");
                    return t.appendChild(e), t
                },
                set_container: function(e, t) {
                    const i = this.util.createElement("DIV");
                    return i.className = "se-component " + t, i.setAttribute("contenteditable", !1), i.appendChild(e), i
                },
                onClick_resizeButton: function(e) {
                    e.stopPropagation();
                    const t = e.target,
                        i = t.getAttribute("data-command") || t.parentNode.getAttribute("data-command");
                    if (!i) return;
                    const n = t.getAttribute("data-value") || t.parentNode.getAttribute("data-value"),
                        l = this.context.resizing._resize_plugin,
                        o = this.context[l],
                        s = o._element,
                        a = this.plugins[l];
                    if (e.preventDefault(), "function" != typeof this.plugins.resizing._closeAlignMenu || (this.plugins.resizing._closeAlignMenu(), "onalign" !== i)) {
                        switch (i) {
                            case "auto":
                                a.setAutoSize.call(this), a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l));
                                break;
                            case "percent":
                                let e = this.plugins.resizing._module_getSizeY.call(this, o);
                                if (this.context.resizing._rotateVertical) {
                                    const t = s.getAttribute("data-percentage");
                                    t && (e = t.split(",")[1])
                                }
                                this.plugins.resizing.resetTransform.call(this, s), a.setPercentSize.call(this, 100 * n, e), a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l));
                                break;
                            case "mirror":
                                const t = s.getAttribute("data-rotate") || "0";
                                let i = s.getAttribute("data-rotateX") || "",
                                    r = s.getAttribute("data-rotateY") || "";
                                "h" === n && !this.context.resizing._rotateVertical || "v" === n && this.context.resizing._rotateVertical ? r = r ? "" : "180" : i = i ? "" : "180", s.setAttribute("data-rotateX", i), s.setAttribute("data-rotateY", r), this.plugins.resizing._setTransForm(s, t, i, r);
                                break;
                            case "rotate":
                                const c = this.context.resizing,
                                    d = 1 * s.getAttribute("data-rotate") + 1 * n,
                                    u = this._w.Math.abs(d) >= 360 ? 0 : d;
                                s.setAttribute("data-rotate", u), c._rotateVertical = /^(90|270)$/.test(this._w.Math.abs(u).toString()), this.plugins.resizing.setTransformSize.call(this, s, null, null), a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l));
                                break;
                            case "onalign":
                                this.plugins.resizing.openAlignMenu.call(this);
                                break;
                            case "align":
                                const h = "basic" === n ? "none" : n;
                                a.setAlign.call(this, h, null, null, null), a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l));
                                break;
                            case "caption":
                                const p = !o._captionChecked;
                                if (a.openModify.call(this, !0), o._captionChecked = o.captionCheckEl.checked = p, "image" === l ? a.update_image.call(this, !1, !1, !1) : "video" === l && (this.context.dialog.updateModal = !0, a.submitAction.call(this)), p) {
                                    const e = this.util.getChildElement(o._caption, (function(e) {
                                        return 3 === e.nodeType
                                    }));
                                    e ? this.setRange(e, 0, e, e.textContent.length) : o._caption.focus(), this.controllersOff()
                                } else a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l)), a.openModify.call(this, !0);
                                break;
                            case "revert":
                                a.setOriginSize.call(this), a.onModifyMode.call(this, s, this.plugins.resizing.call_controller_resize.call(this, s, l));
                                break;
                            case "update":
                                a.openModify.call(this), this.controllersOff();
                                break;
                            case "delete":
                                a.destroy.call(this)
                        }
                        this.history.push(!1)
                    }
                },
                resetTransform: function(e) {
                    const t = (e.getAttribute("data-size") || e.getAttribute("data-origin") || "").split(",");
                    this.context.resizing._rotateVertical = !1, e.style.maxWidth = "", e.style.transform = "", e.style.transformOrigin = "", e.setAttribute("data-rotate", ""), e.setAttribute("data-rotateX", ""), e.setAttribute("data-rotateY", ""), this.plugins[this.context.resizing._resize_plugin].setSize.call(this, t[0] ? t[0] : "auto", t[1] ? t[1] : "", !0)
                },
                setTransformSize: function(e, t, i) {
                    let n = e.getAttribute("data-percentage");
                    const l = this.context.resizing._rotateVertical,
                        o = 1 * e.getAttribute("data-rotate");
                    let s = "";
                    if (n && !l) n = n.split(","), "auto" === n[0] && "auto" === n[1] ? this.plugins[this.context.resizing._resize_plugin].setAutoSize.call(this) : this.plugins[this.context.resizing._resize_plugin].setPercentSize.call(this, n[0], n[1]);
                    else {
                        const n = this.util.getParentElement(e, "FIGURE"),
                            a = t || e.offsetWidth,
                            r = i || e.offsetHeight,
                            c = (l ? r : a) + "px",
                            d = (l ? a : r) + "px";
                        if (this.plugins[this.context.resizing._resize_plugin].cancelPercentAttr.call(this), this.plugins[this.context.resizing._resize_plugin].setSize.call(this, a + "px", r + "px", !0), n.style.width = c, n.style.height = this.context[this.context.resizing._resize_plugin]._caption ? "" : d, l) {
                            let e = a / 2 + "px " + a / 2 + "px 0",
                                t = r / 2 + "px " + r / 2 + "px 0";
                            s = 90 === o || -270 === o ? t : e
                        }
                    }
                    e.style.transformOrigin = s, this.plugins.resizing._setTransForm(e, o.toString(), e.getAttribute("data-rotateX") || "", e.getAttribute("data-rotateY") || ""), e.style.maxWidth = l ? "none" : "", this.plugins.resizing.setCaptionPosition.call(this, e)
                },
                _setTransForm: function(e, t, i, n) {
                    let l = (e.offsetWidth - e.offsetHeight) * (/-/.test(t) ? 1 : -1),
                        o = "";
                    if (/[1-9]/.test(t) && (i || n)) switch (o = i ? "Y" : "X", t) {
                        case "90":
                            o = i && n ? "X" : n ? o : "";
                            break;
                        case "270":
                            l *= -1, o = i && n ? "Y" : i ? o : "";
                            break;
                        case "-90":
                            o = i && n ? "Y" : i ? o : "";
                            break;
                        case "-270":
                            l *= -1, o = i && n ? "X" : n ? o : "";
                            break;
                        default:
                            o = ""
                    }
                    t % 180 == 0 && (e.style.maxWidth = ""), e.style.transform = "rotate(" + t + "deg)" + (i ? " rotateX(" + i + "deg)" : "") + (n ? " rotateY(" + n + "deg)" : "") + (o ? " translate" + o + "(" + l + "px)" : "")
                },
                setCaptionPosition: function(e) {
                    const t = this.util.getChildElement(this.util.getParentElement(e, "FIGURE"), "FIGCAPTION");
                    t && (t.style.marginTop = (this.context.resizing._rotateVertical ? e.offsetWidth - e.offsetHeight : 0) + "px")
                },
                onMouseDown_resize_handle: function(e) {
                    const t = this.context.resizing,
                        i = t._resize_direction = e.target.classList[0];
                    e.stopPropagation(), e.preventDefault();
                    const n = this.context.resizing._resize_plugin,
                        l = this.context[n]._element,
                        o = this.plugins[n];
                    t._resizeClientX = e.clientX, t._resizeClientY = e.clientY, this.context.element.resizeBackground.style.display = "block", t.resizeButton.style.display = "none", t.resizeDiv.style.float = /l/.test(i) ? "right" : /r/.test(i) ? "left" : "none";
                    const s = function(e) {
                            if ("keydown" === e.type && 27 !== e.keyCode) return;
                            const i = t._isChange;
                            t._isChange = !1, this.removeDocEvent("mousemove", a), this.removeDocEvent("mouseup", s), this.removeDocEvent("keydown", s), "keydown" === e.type ? (this.controllersOff(), this.context.element.resizeBackground.style.display = "none", this.plugins[this.context.resizing._resize_plugin].init.call(this)) : (this.plugins.resizing.cancel_controller_resize.call(this), i && this.history.push(!1)), o.onModifyMode.call(this, l, this.plugins.resizing.call_controller_resize.call(this, l, t._resize_plugin))
                        }.bind(this),
                        a = this.plugins.resizing.resizing_element.bind(this, t, i, this.context[t._resize_plugin]);
                    this.addDocEvent("mousemove", a), this.addDocEvent("mouseup", s), this.addDocEvent("keydown", s)
                },
                resizing_element: function(e, t, i, n) {
                    const l = n.clientX,
                        o = n.clientY;
                    let s = i._element_w,
                        a = i._element_h;
                    const r = i._element_w + (/r/.test(t) ? l - e._resizeClientX : e._resizeClientX - l),
                        c = i._element_h + (/b/.test(t) ? o - e._resizeClientY : e._resizeClientY - o),
                        d = i._element_h / i._element_w * r;
                    /t/.test(t) && (e.resizeDiv.style.top = i._element_h - (/h/.test(t) ? c : d) + "px"), /l/.test(t) && (e.resizeDiv.style.left = i._element_w - r + "px"), /r|l/.test(t) && (e.resizeDiv.style.width = r + "px", s = r), /^(t|b)[^h]$/.test(t) ? (e.resizeDiv.style.height = d + "px", a = d) : /^(t|b)h$/.test(t) && (e.resizeDiv.style.height = c + "px", a = c), e._resize_w = s, e._resize_h = a, this.util.changeTxt(e.resizeDisplay, this._w.Math.round(s) + " x " + this._w.Math.round(a)), e._isChange = !0
                },
                cancel_controller_resize: function() {
                    const e = this.context.resizing._rotateVertical;
                    this.controllersOff(), this.context.element.resizeBackground.style.display = "none";
                    let t = this._w.Math.round(e ? this.context.resizing._resize_h : this.context.resizing._resize_w),
                        i = this._w.Math.round(e ? this.context.resizing._resize_w : this.context.resizing._resize_h);
                    if (!e && !/%$/.test(t)) {
                        const e = 16,
                            n = this.context.element.wysiwygFrame.clientWidth - 2 * e - 2;
                        this.util.getNumber(t) > n && (i = this._w.Math.round(i / t * n), t = n)
                    }
                    this.plugins[this.context.resizing._resize_plugin].setSize.call(this, t, i, !1), this.plugins[this.context.resizing._resize_plugin].init.call(this)
                }
            },
            s = {
                name: "notice",
                add: function(e) {
                    const t = e.context;
                    t.notice = {};
                    let i = e.util.createElement("DIV"),
                        n = e.util.createElement("SPAN"),
                        l = e.util.createElement("BUTTON");
                    i.className = "se-notice", l.className = "close", l.setAttribute("aria-label", "Close"), l.setAttribute("title", e.lang.dialogBox.close), l.innerHTML = '<i aria-hidden="true" data-command="close" class="se-icon-cancel"></i>', i.appendChild(n), i.appendChild(l), t.notice.modal = i, t.notice.message = n, l.addEventListener("click", this.onClick_cancel.bind(e)), t.element.relative.insertBefore(i, t.element.editorArea), i = null
                },
                onClick_cancel: function(e) {
                    e.preventDefault(), e.stopPropagation(), this.plugins.notice.close.call(this)
                },
                open: function(e) {
                    this.context.notice.message.textContent = e, this.context.notice.modal.style.display = "block"
                },
                close: function() {
                    this.context.notice.modal.style.display = "none"
                }
            },
            a = {
                align: {
                    name: "align",
                    add: function(e, t) {
                        const i = e.context;
                        i.align = {
                            _alignList: null,
                            currentAlign: ""
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), i.align._alignList = l.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-list-layer", t.innerHTML = '<div class="se-submenu se-list-inner se-list-align"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyleft" data-value="left" title="' + e.toolbar.alignLeft + '"><span class="se-icon-align-left"></span>' + e.toolbar.alignLeft + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifycenter" data-value="center" title="' + e.toolbar.alignCenter + '"><span class="se-icon-align-center"></span>' + e.toolbar.alignCenter + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyright" data-value="right" title="' + e.toolbar.alignRight + '"><span class="se-icon-align-right"></span>' + e.toolbar.alignRight + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyfull" data-value="justify" title="' + e.toolbar.alignJustify + '"><span class="se-icon-align-justify"></span>' + e.toolbar.alignJustify + "</button></li></ul></div>", t
                    },
                    on: function() {
                        const e = this.context.align,
                            t = e._alignList,
                            i = this.commandMap.ALIGN.getAttribute("data-focus") || "left";
                        if (i !== e.currentAlign) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentAlign = i
                        }
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = null;
                        for (; !i && !/UL/i.test(t.tagName);) i = t.getAttribute("data-value"), t = t.parentNode;
                        if (!i) return;
                        const n = this.getSelectedElements();
                        for (let e = 0, t = n.length; e < t; e++) n[e].style.textAlign = i;
                        this.submenuOff(), this.focus()
                    }
                },
                font: {
                    name: "font",
                    add: function(e, t) {
                        const i = e.context;
                        i.font = {
                            _fontList: null,
                            currentFont: ""
                        };
                        let n = this.setSubmenu.call(e);
                        n.querySelector(".se-list-font-family").addEventListener("click", this.pickup.bind(e)), i.font._fontList = n.querySelectorAll("ul li button"), t.parentNode.appendChild(n), n = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            i = this.util.createElement("DIV");
                        let n, l, o, s;
                        i.className = "se-list-layer";
                        let a = e.font ? e.font : ["Arial", "Comic Sans MS", "Courier New", "Impact", "Georgia", "tahoma", "Trebuchet MS", "Verdana"],
                            r = '<div class="se-submenu se-list-inner se-list-font-family"><ul class="se-list-basic"><li><button type="button" class="default_value se-btn-list" title="' + t.toolbar.default+'">(' + t.toolbar.default+")</button></li>";
                        for (o = 0, s = a.length; o < s; o++) n = a[o], l = n.split(",")[0], r += '<li><button type="button" class="se-btn-list" data-value="' + n + '" data-txt="' + l + '" title="' + l + '" style="font-family:' + n + ';">' + l + "</button></li>";
                        return r += "</ul></div>", i.innerHTML = r, i
                    },
                    on: function() {
                        const e = this.context.font,
                            t = e._fontList,
                            i = this.commandMap.FONT.textContent;
                        if (i !== e.currentFont) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentFont = i
                        }
                    },
                    pickup: function(e) {
                        if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                        e.preventDefault(), e.stopPropagation();
                        const t = e.target.getAttribute("data-value");
                        if (t) {
                            const e = this.util.createElement("SPAN");
                            e.style.fontFamily = t, this.nodeChange(e, ["font-family"], null, null)
                        } else this.nodeChange(null, ["font-family"], ["span"], !0);
                        this.submenuOff()
                    }
                },
                fontSize: {
                    name: "fontSize",
                    add: function(e, t) {
                        const i = e.context;
                        i.fontSize = {
                            _sizeList: null,
                            currentSize: ""
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), i.fontSize._sizeList = l.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            i = this.util.createElement("DIV");
                        i.className = "se-submenu se-list-layer";
                        const n = e.fontSize ? e.fontSize : [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
                        let l = '<div class="se-list-inner se-list-font-size"><ul class="se-list-basic"><li><button type="button" class="default_value se-btn-list" title="' + t.toolbar.default+'">(' + t.toolbar.default+")</button></li>";
                        for (let t, i = 0, o = e.fontSizeUnit, s = n.length; i < s; i++) t = n[i], l += '<li><button type="button" class="se-btn-list" data-value="' + t + o + '" title="' + t + o + '" style="font-size:' + t + o + ';">' + t + "</button></li>";
                        return l += "</ul></div>", i.innerHTML = l, i
                    },
                    on: function() {
                        const e = this.context.fontSize,
                            t = e._sizeList,
                            i = this.commandMap.SIZE.textContent;
                        if (i !== e.currentSize) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentSize = i
                        }
                    },
                    pickup: function(e) {
                        if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                        e.preventDefault(), e.stopPropagation();
                        const t = e.target.getAttribute("data-value");
                        if (t) {
                            const e = this.util.createElement("SPAN");
                            e.style.fontSize = t, this.nodeChange(e, ["font-size"], null, null)
                        } else this.nodeChange(null, ["font-size"], ["span"], !0);
                        this.submenuOff()
                    }
                },
                fontColor: {
                    name: "fontColor",
                    add: function(e, t) {
                        e.addModule([n]);
                        const i = e.context;
                        i.fontColor = {
                            previewEl: null,
                            colorInput: null,
                            colorList: null
                        };
                        let l = this.setSubmenu.call(e);
                        i.fontColor.colorInput = l.querySelector("._se_color_picker_input"), i.fontColor.colorInput.addEventListener("keyup", this.onChangeInput.bind(e)), l.querySelector("._se_color_picker_submit").addEventListener("click", this.submit.bind(e)), l.querySelector("._se_color_picker_remove").addEventListener("click", this.remove.bind(e)), l.addEventListener("click", this.pickup.bind(e)), i.fontColor.colorList = l.querySelectorAll("li button"), t.parentNode.appendChild(l), l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.colorPicker.colorListHTML,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = e, t
                    },
                    on: function() {
                        const e = this.context.colorPicker,
                            t = this.context.fontColor;
                        e._colorInput = t.colorInput, e._defaultColor = "#333333", e._styleProperty = "color", e._colorList = t.colorList, this.plugins.colorPicker.init.call(this, this.getSelectionNode(), null)
                    },
                    onChangeInput: function(e) {
                        this.plugins.colorPicker.setCurrentColor.call(this, e.target.value)
                    },
                    submit: function() {
                        this.plugins.fontColor.applyColor.call(this, this.context.colorPicker._currentColor)
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation(), this.plugins.fontColor.applyColor.call(this, e.target.getAttribute("data-value"))
                    },
                    remove: function() {
                        this.nodeChange(null, ["color"], ["span"], !0), this.submenuOff()
                    },
                    applyColor: function(e) {
                        if (!e) return;
                        const t = this.util.createElement("SPAN");
                        t.style.color = e, this.nodeChange(t, ["color"], null, null), this.submenuOff()
                    }
                },
                hiliteColor: {
                    name: "hiliteColor",
                    add: function(e, t) {
                        e.addModule([n]);
                        const i = e.context;
                        i.hiliteColor = {
                            previewEl: null,
                            colorInput: null,
                            colorList: null
                        };
                        let l = this.setSubmenu.call(e);
                        i.hiliteColor.colorInput = l.querySelector("._se_color_picker_input"), i.hiliteColor.colorInput.addEventListener("keyup", this.onChangeInput.bind(e)), l.querySelector("._se_color_picker_submit").addEventListener("click", this.submit.bind(e)), l.querySelector("._se_color_picker_remove").addEventListener("click", this.remove.bind(e)), l.addEventListener("click", this.pickup.bind(e)), i.hiliteColor.colorList = l.querySelectorAll("li button"), t.parentNode.appendChild(l), l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.colorPicker.colorListHTML,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = e, t
                    },
                    on: function() {
                        const e = this.context.colorPicker,
                            t = this.context.hiliteColor;
                        e._colorInput = t.colorInput, e._defaultColor = "#FFFFFF", e._styleProperty = "backgroundColor", e._colorList = t.colorList, this.plugins.colorPicker.init.call(this, this.getSelectionNode(), null)
                    },
                    onChangeInput: function(e) {
                        this.plugins.colorPicker.setCurrentColor.call(this, e.target.value)
                    },
                    submit: function() {
                        this.plugins.hiliteColor.applyColor.call(this, this.context.colorPicker._currentColor)
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation(), this.plugins.hiliteColor.applyColor.call(this, e.target.getAttribute("data-value"))
                    },
                    remove: function() {
                        this.nodeChange(null, ["background-color"], ["span"], !0), this.submenuOff()
                    },
                    applyColor: function(e) {
                        if (!e) return;
                        const t = this.util.createElement("SPAN");
                        t.style.backgroundColor = e, this.nodeChange(t, ["background-color"], null, null), this.submenuOff()
                    }
                },
                horizontalRule: {
                    name: "horizontalRule",
                    add: function(e, t) {
                        let i = this.setSubmenu.call(e);
                        i.querySelector("ul").addEventListener("click", this.horizontalRulePick.bind(e)), t.parentNode.appendChild(i), i = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = '<div class="se-list-inner se-list-line"><ul class="se-list-basic"><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="solid"><hr style="border-width: 1px 0 0; border-style: solid none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_solid + '</span></span></button></li><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="dotted"><hr style="border-width: 1px 0 0; border-style: dotted none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_dotted + '</span></span></button></li><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="dashed"><hr style="border-width: 1px 0 0; border-style: dashed none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_dashed + "</span></span></button></li></ul></div>", t
                    },
                    appendHr: function(e) {
                        const t = this.util.createElement("HR");
                        t.className = e, this.focus();
                        let i = this.insertComponent(t, !1);
                        this.setRange(i, 0, i, 0)
                    },
                    horizontalRulePick: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = null;
                        for (; !i && !/UL/i.test(t.tagName);) i = t.getAttribute("data-value"), t = t.parentNode;
                        i && (this.plugins.horizontalRule.appendHr.call(this, "__se__" + i), this.submenuOff())
                    }
                },
                list: {
                    name: "list",
                    add: function(e, t) {
                        const i = e.context;
                        i.list = {
                            _list: null,
                            currentList: ""
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), i.list._list = l.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = '<div class="se-list-inner"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-tooltip" data-command="OL"><i class="se-icon-list-number"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.orderList + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="UL"><i class="se-icon-list-bullets"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.unorderList + "</span></span></button></li></ul></div>", t
                    },
                    on: function() {
                        const e = this.context.list,
                            t = e._list,
                            i = this.commandMap.LI.getAttribute("data-focus") || "";
                        if (i !== e.currentList) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-command") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentList = i
                        }
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = "";
                        for (; !i && !/^UL$/i.test(t.tagName);) i = t.getAttribute("data-command"), t = t.parentNode;
                        if (!i) return;
                        const n = this.getSelectedElementsAndComponents();
                        if (!n || 0 === n.length) return;
                        let l = !0,
                            o = null,
                            s = null;
                        const a = n[0],
                            r = n[n.length - 1];
                        let c = !this.util.isListCell(a) && !this.util.isComponent(a) || a.previousElementSibling ? a.previousElementSibling : a.parentNode.previousElementSibling,
                            d = !this.util.isListCell(r) && !this.util.isComponent(r) || r.nextElementSibling ? r.nextElementSibling : r.parentNode.nextElementSibling;
                        for (let e = 0, t = n.length; e < t; e++)
                            if (!this.util.isList(this.util.getRangeFormatElement(n[e], function(t) {
                                    return this.getRangeFormatElement(t) && t !== n[e]
                                }.bind(this.util)))) {
                                l = !1;
                                break
                            } if (!l || c && i === c.tagName || d && i === d.tagName) {
                            const e = c ? c.parentNode : c,
                                t = d ? d.parentNode : d;
                            c = e && !this.util.isWysiwygDiv(e) && e.nodeName === i ? e : c, d = t && !this.util.isWysiwygDiv(t) && t.nodeName === i ? t : d;
                            const l = c && c.tagName === i,
                                a = d && d.tagName === i;
                            let r = l ? c : this.util.createElement(i),
                                u = null,
                                h = null,
                                p = null,
                                g = null;
                            const m = function(e) {
                                return !this.isComponent(e) && !this.isList(e)
                            }.bind(this.util);
                            for (let e, t, o, s, a, c, d, g, f, _ = 0, b = n.length; _ < b; _++)
                                if (t = n[_], 0 !== t.childNodes.length || this.util.isIgnoreNodeChange(t)) {
                                    if (s = n[_ + 1], a = t.parentNode, c = s ? s.parentNode : null, o = this.util.isListCell(t), f = this.util.isRangeFormatElement(a) ? a : null, d = o && !this.util.isWysiwygDiv(a) ? a.parentNode : a, g = o && !this.util.isWysiwygDiv(a) ? s ? a.nextSibling : a : t.nextSibling, e = this.util.createElement("LI"), this.util.copyFormatAttributes(e, t), this.util.isComponent(t)) {
                                        const i = /^HR$/i.test(t.nodeName);
                                        i || (e.innerHTML = "<br>"), e.innerHTML += t.outerHTML, i && (e.innerHTML += "<br>")
                                    } else e.innerHTML = t.innerHTML;
                                    r.appendChild(e), s || (h = r), s && d === c && !this.util.isRangeFormatElement(g) || (u || (u = r), l && s && d === c || s && this.util.isList(c) && c === a || r.parentNode !== d && d.insertBefore(r, g)), this.util.removeItem(t), l && null === p && (p = r.children.length - 1), s && this.util.getRangeFormatElement(c, m) !== this.util.getRangeFormatElement(a, m) && (r = this.util.createElement(i)), f && 0 === f.children.length && this.util.removeItem(f)
                                } else this.util.removeItem(t);
                            p && (u = u.children[p]), a && (g = r.children.length - 1, r.innerHTML += d.innerHTML, h = r.children[g], this.util.removeItem(d)), o = s = this.util.getEdgeChildNodes(u.firstChild, h.lastChild)
                        } else {
                            const e = this.util.getRangeFormatElement(this.getSelectionNode()),
                                t = e && e.tagName === i;
                            let l, a;
                            const r = function(e) {
                                return !this.isComponent(e)
                            }.bind(this.util);
                            t || (a = this.util.createElement(i));
                            for (let e, c, d = 0, u = n.length; d < u; d++)
                                if (c = this.util.getRangeFormatElement(n[d], r), c && this.util.isList(c)) {
                                    if (e)
                                        if (e !== c) {
                                            const s = this.detachRangeFormatElement(l.r, l.f, a, !1, !0);
                                            o || (o = s), t || (a = this.util.createElement(i)), e = c, l = {
                                                r: e,
                                                f: [this.util.getParentElement(n[d], "LI")]
                                            }
                                        } else l.f.push(this.util.getParentElement(n[d], "LI"));
                                    else e = c, l = {
                                        r: e,
                                        f: [this.util.getParentElement(n[d], "LI")]
                                    };
                                    d === u - 1 && (s = this.detachRangeFormatElement(l.r, l.f, a, !1, !0), o || (o = s))
                                }
                        }
                        n.length > 1 ? this.setRange(o.sc, 0, s.ec, s.ec.textContent.length) : this.setRange(o.ec, o.ec.textContent.length, s.ec, s.ec.textContent.length), this.submenuOff(), this.history.push(!1)
                    }
                },
                table: {
                    name: "table",
                    add: function(e, t) {
                        const i = e.context;
                        i.table = {
                            _element: null,
                            _tdElement: null,
                            _trElement: null,
                            _trElements: null,
                            _tableXY: [],
                            _maxWidth: !0,
                            resizeIcon: null,
                            resizeText: null,
                            headerButton: null,
                            mergeButton: null,
                            splitButton: null,
                            splitMenu: null,
                            maxText: e.lang.controller.maxSize,
                            minText: e.lang.controller.minSize,
                            _physical_cellCnt: 0,
                            _logical_cellCnt: 0,
                            _rowCnt: 0,
                            _rowIndex: 0,
                            _physical_cellIndex: 0,
                            _logical_cellIndex: 0,
                            _current_colSpan: 0,
                            _current_rowSpan: 0
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector(".se-controller-table-picker");
                        i.table.tableHighlight = n.querySelector(".se-table-size-highlighted"), i.table.tableUnHighlight = n.querySelector(".se-table-size-unhighlighted"), i.table.tableDisplay = n.querySelector(".se-table-size-display");
                        let o = this.setController_table.call(e);
                        i.table.tableController = o, i.table.resizeIcon = o.querySelector("._se_table_resize > i"), i.table.resizeText = o.querySelector("._se_table_resize > span > span"), i.table.headerButton = o.querySelector("._se_table_header"), o.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1);
                        let s = this.setController_tableEditor.call(e);
                        i.table.resizeDiv = s, i.table.splitMenu = s.querySelector(".se-btn-group-sub"), i.table.mergeButton = s.querySelector("._se_table_merge_button"), i.table.splitButton = s.querySelector("._se_table_split_button"), s.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1), l.addEventListener("mousemove", this.onMouseMove_tablePicker.bind(e)), l.addEventListener("click", this.appendTable.bind(e)), s.addEventListener("click", this.onClick_tableController.bind(e)), o.addEventListener("click", this.onClick_tableController.bind(e)), t.parentNode.appendChild(n), i.element.relative.appendChild(s), i.element.relative.appendChild(o), n = null, l = null, s = null, o = null
                    },
                    setSubmenu: function() {
                        const e = this.util.createElement("DIV");
                        return e.className = "se-submenu se-selector-table", e.innerHTML = '<div class="se-table-size"><div class="se-table-size-picker se-controller-table-picker"></div><div class="se-table-size-highlighted"></div><div class="se-table-size-unhighlighted"></div></div><div class="se-table-size-display">1 x 1</div>', e
                    },
                    setController_table: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-controller se-controller-table", t.innerHTML = '<div><div class="se-btn-group"><button type="button" data-command="resize" class="se-tooltip _se_table_resize"><i class="se-icon-expansion"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.maxSize + '</span></span></button><button type="button" data-command="header" class="se-tooltip _se_table_header"><i class="se-icon-table-header"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.tableHeader + '</span></span></button><button type="button" data-command="remove" class="se-tooltip"><i class="se-icon-delete"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div></div>", t
                    },
                    setController_tableEditor: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-controller se-controller-table-cell", t.innerHTML = '<div class="se-arrow se-arrow-up"></div><div><div class="se-btn-group"><button type="button" data-command="insert" data-value="row" data-option="up" class="se-tooltip"><i class="se-icon-insert-row-above"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertRowAbove + '</span></span></button><button type="button" data-command="insert" data-value="row" data-option="down" class="se-tooltip"><i class="se-icon-insert-row-below"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertRowBelow + '</span></span></button><button type="button" data-command="delete" data-value="row" class="se-tooltip"><i class="se-icon-delete-row"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.deleteRow + '</span></span></button><button type="button" data-command="merge" class="_se_table_merge_button se-tooltip" disabled><i class="se-icon-merge-cell"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mergeCells + '</span></span></button></div></div><div><div class="se-btn-group"><button type="button" data-command="insert" data-value="cell" data-option="left" class="se-tooltip"><i class="se-icon-insert-column-left"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertColumnBefore + '</span></span></button><button type="button" data-command="insert" data-value="cell" data-option="right" class="se-tooltip"><i class="se-icon-insert-column-right"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertColumnAfter + '</span></span></button><button type="button" data-command="delete" data-value="cell" class="se-tooltip"><i class="se-icon-delete-column"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.deleteColumn + '</span></span></button><button type="button" data-command="onsplit" class="_se_table_split_button se-tooltip"><i class="se-icon-split-cell"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.splitCells + '</span></span></button><div class="se-btn-group-sub sun-editor-common se-list-layer"><div class="se-list-inner"><ul class="se-list-basic"><li class="se-btn-list" data-command="split" data-value="vertical" style="line-height:32px;" title="' + e.controller.VerticalSplit + '">' + e.controller.VerticalSplit + '</li><li class="se-btn-list" data-command="split" data-value="horizontal" style="line-height:32px;" title="' + e.controller.HorizontalSplit + '">' + e.controller.HorizontalSplit + "</li></ul></div></div></div></div>", t
                    },
                    appendTable: function() {
                        const e = this.util.createElement("TABLE"),
                            t = this.plugins.table.createCells,
                            i = this.context.table._tableXY[0];
                        let n = this.context.table._tableXY[1],
                            l = "<tbody>";
                        for (; n > 0;) l += "<tr>" + t.call(this, "td", i) + "</tr>", --n;
                        l += "</tbody>", e.innerHTML = l, this.insertComponent(e, !1);
                        const o = e.querySelector("td div");
                        this.setRange(o, 0, o, 0), this.plugins.table.reset_table_picker.call(this)
                    },
                    createCells: function(e, t, i) {
                        if (e = e.toLowerCase(), i) {
                            const t = this.util.createElement(e);
                            return t.innerHTML = "<div><br></div>", t
                        } {
                            let i = "";
                            for (; t > 0;) i += "<" + e + "><div><br></div></" + e + ">", t--;
                            return i
                        }
                    },
                    onMouseMove_tablePicker: function(e) {
                        e.stopPropagation();
                        let t = this._w.Math.ceil(e.offsetX / 18),
                            i = this._w.Math.ceil(e.offsetY / 18);
                        t = t < 1 ? 1 : t, i = i < 1 ? 1 : i, this.context.table.tableHighlight.style.width = t + "em", this.context.table.tableHighlight.style.height = i + "em";
                        let n = t < 5 ? 5 : t > 9 ? 10 : t + 1,
                            l = i < 5 ? 5 : i > 9 ? 10 : i + 1;
                        this.context.table.tableUnHighlight.style.width = n + "em", this.context.table.tableUnHighlight.style.height = l + "em", this.util.changeTxt(this.context.table.tableDisplay, t + " x " + i), this.context.table._tableXY = [t, i]
                    },
                    reset_table_picker: function() {
                        if (!this.context.table.tableHighlight) return;
                        const e = this.context.table.tableHighlight.style,
                            t = this.context.table.tableUnHighlight.style;
                        e.width = "1em", e.height = "1em", t.width = "5em", t.height = "5em", this.util.changeTxt(this.context.table.tableDisplay, "1 x 1"), this.submenuOff()
                    },
                    init: function() {
                        const e = this.context.table,
                            t = this.plugins.table;
                        if (t._removeEvents.call(this), t._selectedTable) {
                            const e = t._selectedTable.querySelectorAll(".se-table-selected-cell");
                            for (let t = 0, i = e.length; t < i; t++) this.util.removeClass(e[t], "se-table-selected-cell")
                        }
                        t._toggleEditor.call(this, !0), e._element = null, e._tdElement = null, e._trElement = null, e._trElements = null, e._tableXY = [], e._maxWidth = !0, e._physical_cellCnt = 0, e._logical_cellCnt = 0, e._rowCnt = 0, e._rowIndex = 0, e._physical_cellIndex = 0, e._logical_cellIndex = 0, e._current_colSpan = 0, e._current_rowSpan = 0, t._shift = !1, t._selectedCells = null, t._selectedTable = null, t._ref = null, t._fixedCell = null, t._selectedCell = null, t._fixedCellName = null
                    },
                    call_controller_tableEdit: function(e) {
                        const t = this.context.table,
                            i = this.plugins.table,
                            n = t.tableController;
                        i.setPositionControllerDiv.call(this, e, i._shift);
                        const l = t._element,
                            o = this.util.getOffset(l, this.context.element.wysiwygFrame);
                        t._maxWidth = !l.style.width || "100%" === l.style.width, i.resizeTable.call(this), n.style.left = o.left + "px", n.style.display = "block", n.style.top = o.top - n.offsetHeight - 2 + "px", i._shift || this.controllersOn(t.resizeDiv, n, i.init.bind(this))
                    },
                    setPositionControllerDiv: function(e, t) {
                        const i = this.context.table.resizeDiv;
                        this.plugins.table.setCellInfo.call(this, e, t), i.style.display = "block";
                        const n = this.util.getOffset(e, this.context.element.wysiwygFrame);
                        i.style.left = n.left - this.context.element.wysiwygFrame.scrollLeft + "px", i.style.top = n.top + e.offsetHeight + 12 + "px";
                        const l = this.context.element.wysiwygFrame.offsetWidth - (i.offsetLeft + i.offsetWidth);
                        l < 0 ? (i.style.left = i.offsetLeft + l + "px", i.firstElementChild.style.left = 20 - l + "px") : i.firstElementChild.style.left = "20px"
                    },
                    setCellInfo: function(e, t) {
                        const i = this.context.table,
                            n = i._element = this.plugins.table._selectedTable || this.util.getParentElement(e, "TABLE");
                        if (/THEAD/i.test(n.firstElementChild.nodeName) ? this.util.addClass(i.headerButton, "active") : this.util.removeClass(i.headerButton, "active"), t || 0 === i._physical_cellCnt) {
                            i._tdElement !== e && (i._tdElement = e, i._trElement = e.parentNode);
                            const t = i._trElements = n.rows,
                                l = e.cellIndex;
                            let o = 0;
                            for (let e = 0, i = t[0].cells, n = t[0].cells.length; e < n; e++) o += i[e].colSpan;
                            const s = i._rowIndex = i._trElement.rowIndex;
                            i._rowCnt = t.length, i._physical_cellCnt = i._trElement.cells.length, i._logical_cellCnt = o, i._physical_cellIndex = l, i._current_colSpan = i._tdElement.colSpan - 1, i._current_rowSpan, i._trElement.cells[l].rowSpan;
                            let a = [],
                                r = [];
                            for (let e, n, o = 0; o <= s; o++) {
                                e = t[o].cells, n = 0;
                                for (let t, c, d, u, h = 0, p = e.length; h < p; h++) {
                                    if (t = e[h], c = t.colSpan - 1, d = t.rowSpan - 1, u = h + n, r.length > 0)
                                        for (let e, t = 0; t < r.length; t++) e = r[t], e.row > o || (u >= e.index ? (n += e.cs, u += e.cs, e.rs -= 1, e.row = o + 1, e.rs < 1 && (r.splice(t, 1), t--)) : h === p - 1 && (e.rs -= 1, e.row = o + 1, e.rs < 1 && (r.splice(t, 1), t--)));
                                    if (o === s && h === l) {
                                        i._logical_cellIndex = u;
                                        break
                                    }
                                    d > 0 && a.push({
                                        index: u,
                                        cs: c + 1,
                                        rs: d,
                                        row: -1
                                    }), n += c
                                }
                                r = r.concat(a).sort((function(e, t) {
                                    return e.index - t.index
                                })), a = []
                            }
                            a = null, r = null
                        }
                    },
                    editTable: function(e, t) {
                        const i = this.plugins.table,
                            n = this.context.table,
                            l = n._element,
                            o = "row" === e;
                        if (o) {
                            const e = n._trElement.parentNode;
                            if (/^THEAD$/i.test(e.nodeName)) {
                                if ("up" === t) return;
                                if (!e.nextElementSibling || !/^TBODY$/i.test(e.nextElementSibling.nodeName)) return void(l.innerHTML += "<tbody><tr>" + i.createCells.call(this, "td", n._logical_cellCnt, !1) + "</tr></tbody>")
                            }
                        }
                        if (i._ref) {
                            const e = n._tdElement,
                                l = i._selectedCells;
                            if (o)
                                if (t) i.setCellInfo.call(this, "up" === t ? l[0] : l[l.length - 1], !0), i.editRow.call(this, t, e);
                                else {
                                    let e = l[0].parentNode;
                                    const n = [l[0]];
                                    for (let t, i = 1, o = l.length; i < o; i++) t = l[i], e !== t.parentNode && (n.push(t), e = t.parentNode);
                                    for (let e = 0, l = n.length; e < l; e++) i.setCellInfo.call(this, n[e], !0), i.editRow.call(this, t)
                                }
                            else {
                                const n = l[0].parentNode;
                                if (t) {
                                    let o = null;
                                    for (let e = 0, t = l.length - 1; e < t; e++)
                                        if (n !== l[e + 1].parentNode) {
                                            o = l[e];
                                            break
                                        } i.setCellInfo.call(this, "left" === t ? l[0] : o || l[0], !0), i.editCell.call(this, t, e)
                                } else {
                                    const e = [l[0]];
                                    for (let t, i = 1, o = l.length; i < o && (t = l[i], n === t.parentNode); i++) e.push(t);
                                    for (let n = 0, l = e.length; n < l; n++) i.setCellInfo.call(this, e[n], !0), i.editCell.call(this, t)
                                }
                            }
                            t || i.init.call(this)
                        } else i[o ? "editRow" : "editCell"].call(this, t);
                        if (!t) {
                            const e = l.children;
                            for (let t = 0; t < e.length; t++) 0 === e[t].children.length && (this.util.removeItem(e[t]), t--);
                            0 === l.children.length && this.util.removeItem(l)
                        }
                    },
                    editRow: function(e, t) {
                        const i = this.context.table,
                            n = !e,
                            l = "up" === e,
                            o = i._rowIndex,
                            s = n || l ? o : o + i._current_rowSpan + 1,
                            a = n ? -1 : 1,
                            r = i._trElements;
                        let c = i._logical_cellCnt;
                        for (let e, t = 0, i = o + (n ? -1 : 0); t <= i; t++) {
                            if (e = r[t].cells, 0 === e.length) return;
                            for (let i, n, l = 0, o = e.length; l < o; l++) i = e[l].rowSpan, n = e[l].colSpan, i < 2 && n < 2 || i + t > s && s > t && (e[l].rowSpan = i + a, c -= n)
                        }
                        if (n) {
                            const e = r[o + 1];
                            if (e) {
                                const t = [];
                                let i = r[o].cells,
                                    n = 0;
                                for (let e, l, o = 0, s = i.length; o < s; o++) e = i[o], l = o + n, n += e.colSpan - 1, e.rowSpan > 1 && (e.rowSpan -= 1, t.push({
                                    cell: e.cloneNode(!1),
                                    index: l
                                }));
                                if (t.length > 0) {
                                    let l = t.shift();
                                    i = e.cells, n = 0;
                                    for (let o, s, a = 0, r = i.length; a < r && (o = i[a], s = a + n, n += o.colSpan - 1, !(s >= l.index) || (a--, n--, n += l.cell.colSpan - 1, e.insertBefore(l.cell, o), l = t.shift(), l)); a++);
                                    if (l) {
                                        e.appendChild(l.cell);
                                        for (let i = 0, n = t.length; i < n; i++) e.appendChild(t[i].cell)
                                    }
                                }
                            }
                            i._element.deleteRow(s)
                        } else {
                            i._element.insertRow(s).innerHTML = this.plugins.table.createCells.call(this, "td", c, !1)
                        }
                        n ? this.controllersOff() : this.plugins.table.setPositionControllerDiv.call(this, t || i._tdElement, !0)
                    },
                    editCell: function(e, t) {
                        const i = this.context.table,
                            n = this.util,
                            l = !e,
                            o = "left" === e,
                            s = i._current_colSpan,
                            a = l || o ? i._logical_cellIndex : i._logical_cellIndex + s + 1,
                            r = i._trElements;
                        let c = [],
                            d = [],
                            u = 0;
                        const h = [],
                            p = [];
                        for (let e, t, o, g, m, f, _ = 0, b = i._rowCnt; _ < b; _++) {
                            e = r[_], t = a, m = !1, o = e.cells, f = 0;
                            for (let e, i, r, g, b = 0, y = o.length; b < y && (e = o[b], e); b++)
                                if (i = e.rowSpan - 1, r = e.colSpan - 1, l) {
                                    if (g = b + f, d.length > 0) {
                                        const e = !o[b + 1];
                                        for (let t, i = 0; i < d.length; i++) t = d[i], t.row > _ || (g >= t.index ? (f += t.cs, g = b + f, t.rs -= 1, t.row = _ + 1, t.rs < 1 && (d.splice(i, 1), i--)) : e && (t.rs -= 1, t.row = _ + 1, t.rs < 1 && (d.splice(i, 1), i--)))
                                    }
                                    i > 0 && c.push({
                                        rs: i,
                                        cs: r + 1,
                                        index: g,
                                        row: -1
                                    }), g >= t && g + r <= t + s ? h.push(e) : g <= t + s && g + r >= t ? e.colSpan -= n.getOverlapRangeAtIndex(a, a + s, g, g + r) : i > 0 && (g < t || g + r > t + s) && p.push({
                                        cell: e,
                                        i: _,
                                        rs: _ + i
                                    }), f += r
                                } else {
                                    if (b >= t) break;
                                    if (r > 0) {
                                        if (u < 1 && r + b >= t) {
                                            e.colSpan += 1, t = null, u = i + 1;
                                            break
                                        }
                                        t -= r
                                    }
                                    if (!m) {
                                        for (let e, i = 0; i < d.length; i++) e = d[i], t -= e.cs, e.rs -= 1, e.rs < 1 && (d.splice(i, 1), i--);
                                        m = !0
                                    }
                                } if (d = d.concat(c).sort((function(e, t) {
                                    return e.index - t.index
                                })), c = [], !l) {
                                if (u > 0) {
                                    u -= 1;
                                    continue
                                }
                                null !== t && o.length > 0 && (g = this.plugins.table.createCells.call(this, o[0].nodeName, 0, !0), g = e.insertBefore(g, o[t]))
                            }
                        }
                        if (l) {
                            let e, t;
                            for (let i, l = 0, o = h.length; l < o; l++) i = h[l].parentNode, n.removeItem(h[l]), 0 === i.cells.length && (e || (e = n.getArrayIndex(r, i)), t = n.getArrayIndex(r, i), n.removeItem(i));
                            for (let i, l = 0, o = p.length; l < o; l++) i = p[l], i.cell.rowSpan = n.getOverlapRangeAtIndex(e, t, i.i, i.rs);
                            this.controllersOff()
                        } else this.plugins.table.setPositionControllerDiv.call(this, t || i._tdElement, !0)
                    },
                    _closeSplitMenu: null,
                    openSplitMenu: function() {
                        this.util.addClass(this.context.table.splitButton, "on"), this.context.table.splitMenu.style.display = "inline-table", this.plugins.table._closeSplitMenu = function() {
                            this.util.removeClass(this.context.table.splitButton, "on"), this.context.table.splitMenu.style.display = "none", this.removeDocEvent("mousedown", this.plugins.table._closeSplitMenu), this.plugins.table._closeSplitMenu = null
                        }.bind(this), this.addDocEvent("mousedown", this.plugins.table._closeSplitMenu)
                    },
                    splitCells: function(e) {
                        const t = this.util,
                            i = "vertical" === e,
                            n = this.context.table,
                            l = n._tdElement,
                            o = n._trElements,
                            s = n._trElement,
                            a = n._logical_cellIndex,
                            r = n._rowIndex,
                            c = this.plugins.table.createCells.call(this, l.nodeName, 0, !0);
                        if (i) {
                            const e = l.colSpan;
                            if (c.rowSpan = l.rowSpan, e > 1) c.colSpan = this._w.Math.floor(e / 2), l.colSpan = e - c.colSpan, s.insertBefore(c, l.nextElementSibling);
                            else {
                                let t = [],
                                    i = [];
                                for (let s, r, c = 0, d = n._rowCnt; c < d; c++) {
                                    s = o[c].cells, r = 0;
                                    for (let n, o, d, u, h = 0, p = s.length; h < p; h++) {
                                        if (n = s[h], o = n.colSpan - 1, d = n.rowSpan - 1, u = h + r, i.length > 0)
                                            for (let e, t = 0; t < i.length; t++) e = i[t], e.row > c || (u >= e.index ? (r += e.cs, u += e.cs, e.rs -= 1, e.row = c + 1, e.rs < 1 && (i.splice(t, 1), t--)) : h === p - 1 && (e.rs -= 1, e.row = c + 1, e.rs < 1 && (i.splice(t, 1), t--)));
                                        if (u <= a && d > 0 && t.push({
                                                index: u,
                                                cs: o + 1,
                                                rs: d,
                                                row: -1
                                            }), n !== l && u <= a && u + o >= a + e - 1) {
                                            n.colSpan += 1;
                                            break
                                        }
                                        if (u > a) break;
                                        r += o
                                    }
                                    i = i.concat(t).sort((function(e, t) {
                                        return e.index - t.index
                                    })), t = []
                                }
                                s.insertBefore(c, l.nextElementSibling)
                            }
                        } else {
                            const e = l.rowSpan;
                            if (c.colSpan = l.colSpan, e > 1) {
                                c.rowSpan = this._w.Math.floor(e / 2);
                                const i = e - c.rowSpan,
                                    n = [],
                                    r = t.getArrayIndex(o, s) + i;
                                for (let e, t, i = 0; i < r; i++) {
                                    e = o[i].cells, t = 0;
                                    for (let l, o, s, c = 0, d = e.length; c < d && (s = c + t, !(s >= a)); c++) l = e[c], o = l.rowSpan - 1, o > 0 && o + i >= r && s < a && n.push({
                                        index: s,
                                        cs: l.colSpan
                                    }), t += l.colSpan - 1
                                }
                                const d = o[r],
                                    u = d.cells;
                                let h = n.shift();
                                for (let e, t, i, l, o = 0, s = u.length, r = 0; o < s; o++) {
                                    if (i = o + r, e = u[o], t = e.colSpan - 1, l = i + t + 1, h && l >= h.index && (r += h.cs, l += h.cs, h = n.shift()), l >= a || o === s - 1) {
                                        d.insertBefore(c, e.nextElementSibling);
                                        break
                                    }
                                    r += t
                                }
                                l.rowSpan = i
                            } else {
                                c.rowSpan = l.rowSpan;
                                const e = t.createElement("TR");
                                e.appendChild(c);
                                for (let e, t = 0; t < r; t++) {
                                    if (e = o[t].cells, 0 === e.length) return;
                                    for (let i = 0, n = e.length; i < n; i++) t + e[i].rowSpan - 1 >= r && (e[i].rowSpan += 1)
                                }
                                const i = n._physical_cellIndex,
                                    a = s.cells;
                                for (let e = 0, t = a.length; e < t; e++) e !== i && (a[e].rowSpan += 1);
                                s.parentNode.insertBefore(e, s.nextElementSibling)
                            }
                        }
                        this.focusEdge(l), this.plugins.table.setPositionControllerDiv.call(this, l, !0)
                    },
                    mergeCells: function() {
                        const e = this.plugins.table,
                            t = this.context.table,
                            i = this.util,
                            n = e._ref,
                            l = e._selectedCells,
                            o = l[0];
                        let s = null,
                            a = null,
                            r = n.ce - n.cs + 1,
                            c = n.re - n.rs + 1,
                            d = "",
                            u = null;
                        for (let e, t, n = 1, o = l.length; n < o; n++) {
                            e = l[n], u !== e.parentNode && (u = e.parentNode), t = e.children;
                            for (let e = 0, n = t.length; e < n; e++) i.isFormatElement(t[e]) && i.onlyZeroWidthSpace(t[e].textContent) && i.removeItem(t[e]);
                            d += e.innerHTML, i.removeItem(e), 0 === u.cells.length && (s ? a = u : s = u, c -= 1)
                        }
                        if (s) {
                            const e = t._trElements,
                                n = i.getArrayIndex(e, s),
                                l = i.getArrayIndex(e, a || s),
                                o = [];
                            for (let t, s = 0; s <= l; s++)
                                if (t = e[s].cells, 0 !== t.length)
                                    for (let e, o, a = 0, r = t.length; a < r; a++) e = t[a], o = e.rowSpan - 1, o > 0 && s + o >= n && (e.rowSpan -= i.getOverlapRangeAtIndex(n, l, s, s + o));
                                else o.push(e[s]);
                            for (let e = 0, t = o.length; e < t; e++) i.removeItem(o[e])
                        }
                        o.innerHTML += d, o.colSpan = r, o.rowSpan = c, this.controllersOff(), e.setActiveButton.call(this, !0, !1), e.call_controller_tableEdit.call(this, o), i.addClass(o, "se-table-selected-cell"), this.focusEdge(o)
                    },
                    toggleHeader: function() {
                        const e = this.util,
                            t = this.context.table.headerButton,
                            i = e.hasClass(t, "active"),
                            n = this.context.table._element;
                        if (i) e.removeItem(n.querySelector("thead"));
                        else {
                            const t = e.createElement("THEAD");
                            t.innerHTML = "<tr>" + this.plugins.table.createCells.call(this, "th", this.context.table._logical_cellCnt, !1) + "</tr>", n.insertBefore(t, n.firstElementChild)
                        }
                        e.toggleClass(t, "active"), /TH/i.test(this.context.table._tdElement.nodeName) ? this.controllersOff() : this.plugins.table.setPositionControllerDiv.call(this, this.context.table._tdElement, !1)
                    },
                    resizeTable: function() {
                        const e = this.context.table,
                            t = e.resizeIcon,
                            i = e.resizeText;
                        let n = "se-icon-expansion",
                            l = "se-icon-reduction",
                            o = e.minText,
                            s = "100%";
                        e._maxWidth || (n = "se-icon-reduction", l = "se-icon-expansion", o = e.maxText, s = "auto"), this.util.removeClass(t, n), this.util.addClass(t, l), this.util.changeTxt(i, o), e._element.style.width = s
                    },
                    setActiveButton: function(e, t) {
                        const i = this.context.table;
                        t && e !== t ? (i.splitButton.setAttribute("disabled", !0), i.mergeButton.removeAttribute("disabled")) : (i.splitButton.removeAttribute("disabled"), i.mergeButton.setAttribute("disabled", !0))
                    },
                    _bindOnSelect: null,
                    _bindOffSelect: null,
                    _bindOffShift: null,
                    _selectedCells: null,
                    _shift: !1,
                    _fixedCell: null,
                    _fixedCellName: null,
                    _selectedCell: null,
                    _selectedTable: null,
                    _ref: null,
                    _toggleEditor: function(e) {
                        this.context.element.wysiwyg.setAttribute("contenteditable", e), e ? this.util.removeClass(this.context.element.wysiwyg, "se-disabled") : this.util.addClass(this.context.element.wysiwyg, "se-disabled")
                    },
                    _offCellMultiSelect: function(e) {
                        e.stopPropagation();
                        const t = this.plugins.table;
                        t._shift ? t._initBind && (this._wd.removeEventListener("touchmove", t._initBind), t._initBind = null) : (t._removeEvents.call(this), t._toggleEditor.call(this, !0)), t._fixedCell && t._selectedTable && (t.setActiveButton.call(this, t._fixedCell, t._selectedCell), t.call_controller_tableEdit.call(this, t._selectedCell || t._fixedCell), t._selectedCells = t._selectedTable.querySelectorAll(".se-table-selected-cell"), t._selectedCell && t._fixedCell && this.focusEdge(t._selectedCell), t._shift || (t._fixedCell = null, t._selectedCell = null, t._fixedCellName = null))
                    },
                    _onCellMultiSelect: function(e) {
                        const t = this.plugins.table,
                            i = this.util.getParentElement(e.target, this.util.isCell);
                        if (t._shift) i === t._fixedCell ? t._toggleEditor.call(this, !0) : t._toggleEditor.call(this, !1);
                        else if (!t._ref) {
                            if (i === t._fixedCell) return;
                            t._toggleEditor.call(this, !1)
                        }
                        i && i !== t._selectedCell && t._fixedCellName === i.nodeName && t._selectedTable === this.util.getParentElement(i, "TABLE") && (t._selectedCell = i, t._setMultiCells.call(this, t._fixedCell, i))
                    },
                    _setMultiCells: function(e, t) {
                        const i = this.plugins.table,
                            n = i._selectedTable.rows,
                            l = this.util,
                            o = i._selectedTable.querySelectorAll(".se-table-selected-cell");
                        for (let e = 0, t = o.length; e < t; e++) l.removeClass(o[e], "se-table-selected-cell");
                        if (e === t && (l.addClass(e, "se-table-selected-cell"), !i._shift)) return;
                        let s = !0,
                            a = [],
                            r = [];
                        const c = i._ref = {
                            _i: 0,
                            cs: null,
                            ce: null,
                            rs: null,
                            re: null
                        };
                        for (let i, o, d = 0, u = n.length; d < u; d++) {
                            i = n[d].cells, o = 0;
                            for (let n, u, h, p, g = 0, m = i.length; g < m; g++) {
                                if (n = i[g], h = n.colSpan - 1, p = n.rowSpan - 1, u = g + o, a.length > 0)
                                    for (let e, t = 0; t < a.length; t++) e = a[t], e.row > d || (u >= e.index ? (o += e.cs, u += e.cs, e.rs -= 1, e.row = d + 1, e.rs < 1 && (a.splice(t, 1), t--)) : g === m - 1 && (e.rs -= 1, e.row = d + 1, e.rs < 1 && (a.splice(t, 1), t--)));
                                if (s) {
                                    if (n !== e && n !== t || (c.cs = null !== c.cs && c.cs < u ? c.cs : u, c.ce = null !== c.ce && c.ce > u + h ? c.ce : u + h, c.rs = null !== c.rs && c.rs < d ? c.rs : d, c.re = null !== c.re && c.re > d + p ? c.re : d + p, c._i += 1), 2 === c._i) {
                                        s = !1, a = [], r = [], d = -1;
                                        break
                                    }
                                } else if (l.getOverlapRangeAtIndex(c.cs, c.ce, u, u + h) && l.getOverlapRangeAtIndex(c.rs, c.re, d, d + p)) {
                                    const e = c.cs < u ? c.cs : u,
                                        t = c.ce > u + h ? c.ce : u + h,
                                        i = c.rs < d ? c.rs : d,
                                        o = c.re > d + p ? c.re : d + p;
                                    if (c.cs !== e || c.ce !== t || c.rs !== i || c.re !== o) {
                                        c.cs = e, c.ce = t, c.rs = i, c.re = o, d = -1, a = [], r = [];
                                        break
                                    }
                                    l.addClass(n, "se-table-selected-cell")
                                }
                                p > 0 && r.push({
                                    index: u,
                                    cs: h + 1,
                                    rs: p,
                                    row: -1
                                }), o += n.colSpan - 1
                            }
                            a = a.concat(r).sort((function(e, t) {
                                return e.index - t.index
                            })), r = []
                        }
                    },
                    _removeEvents: function() {
                        const e = this.plugins.table;
                        e._initBind && (this._wd.removeEventListener("touchmove", e._initBind), e._initBind = null), e._bindOnSelect && (this._wd.removeEventListener("mousedown", e._bindOnSelect), this._wd.removeEventListener("mousemove", e._bindOnSelect), e._bindOnSelect = null), e._bindOffSelect && (this._wd.removeEventListener("mouseup", e._bindOffSelect), e._bindOffSelect = null), e._bindOffShift && (this._wd.removeEventListener("keyup", e._bindOffShift), e._bindOffShift = null)
                    },
                    _initBind: null,
                    onTableCellMultiSelect: function(e, t) {
                        const i = this.plugins.table;
                        i._removeEvents.call(this), this.controllersOff(), i._shift = t, i._fixedCell = e, i._fixedCellName = e.nodeName, i._selectedTable = this.util.getParentElement(e, "TABLE");
                        const n = i._selectedTable.querySelectorAll(".se-table-selected-cell");
                        for (let e = 0, t = n.length; e < t; e++) this.util.removeClass(n[e], "se-table-selected-cell");
                        this.util.addClass(e, "se-table-selected-cell"), i._bindOnSelect = i._onCellMultiSelect.bind(this), i._bindOffSelect = i._offCellMultiSelect.bind(this), t ? (i._bindOffShift = function() {
                            this.controllersOn(this.context.table.resizeDiv, this.context.table.tableController, this.plugins.table.init.bind(this), this.focus.bind(this)), i._ref || this.controllersOff()
                        }.bind(this), this._wd.addEventListener("keyup", i._bindOffShift, !1), this._wd.addEventListener("mousedown", i._bindOnSelect, !1)) : this._wd.addEventListener("mousemove", i._bindOnSelect, !1), this._wd.addEventListener("mouseup", i._bindOffSelect, !1), i._initBind = i.init.bind(this), this._wd.addEventListener("touchmove", i._initBind, !1)
                    },
                    onClick_tableController: function(e) {
                        e.stopPropagation();
                        const t = e.target.getAttribute("data-command") ? e.target : e.target.parentNode;
                        if (t.getAttribute("disabled")) return;
                        const i = t.getAttribute("data-command"),
                            n = t.getAttribute("data-value"),
                            l = t.getAttribute("data-option");
                        if ("function" == typeof this.plugins.table._closeSplitMenu && (this.plugins.table._closeSplitMenu(), "onsplit" === i)) return;
                        if (!i) return;
                        e.preventDefault();
                        const o = this.context.table;
                        switch (i) {
                            case "insert":
                            case "delete":
                                this.plugins.table.editTable.call(this, n, l);
                                break;
                            case "header":
                                this.plugins.table.toggleHeader.call(this);
                                break;
                            case "onsplit":
                                this.plugins.table.openSplitMenu.call(this);
                                break;
                            case "split":
                                this.plugins.table.splitCells.call(this, n);
                                break;
                            case "merge":
                                this.plugins.table.mergeCells.call(this);
                                break;
                            case "resize":
                                o.resizeDiv.style.display = "none", o._maxWidth = !o._maxWidth, this.plugins.table.resizeTable.call(this);
                                break;
                            case "remove":
                                this.util.removeItem(o._element), this.controllersOff()
                        }
                        this.focus(), this.history.push(!1)
                    }
                },
                formatBlock: {
                    name: "formatBlock",
                    add: function(e, t) {
                        const i = e.context;
                        i.formatBlock = {
                            _formatList: null,
                            currentFormat: ""
                        };
                        let n = this.setSubmenu.call(e);
                        n.querySelector("ul").addEventListener("click", this.pickUp.bind(e)), i.formatBlock._formatList = n.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang.toolbar,
                            i = this.util.createElement("DIV");
                        i.className = "se-submenu se-list-layer";
                        const n = ["p", "div", "blockquote", "pre", "h1", "h2", "h3", "h4", "h5", "h6"],
                            l = e.formats && 0 !== e.formats.length ? e.formats : n;
                        let o = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, i, s, a, r, c, d = 0, u = l.length; d < u; d++) e = l[d], "string" == typeof e && n.indexOf(e) > -1 ? (i = e.toLowerCase(), s = "pre" === i || "blockquote" === i ? "range" : "replace", r = /^h/.test(i) ? i.match(/\d+/)[0] : "", a = t["tag_" + (r ? "h" : i)] + r, c = "") : (i = e.tag.toLowerCase(), s = e.command, a = e.name || i, c = e.class ? ' class="' + e.class + '"' : ""), o += '<li><button type="button" class="se-btn-list" data-command="' + s + '" data-value="' + i + '" title="' + a + '"><' + i + c + ">" + a + "</" + i + "></button></li>";
                        return o += "</ul></div>", i.innerHTML = o, i
                    },
                    on: function() {
                        const e = this.context.formatBlock,
                            t = e._formatList,
                            i = (this.commandMap.FORMAT.getAttribute("data-focus") || "P").toLowerCase();
                        if (i !== e.currentFormat) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentFormat = i
                        }
                    },
                    pickUp: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = null,
                            n = null,
                            l = null;
                        for (; !i && !/UL/i.test(t.tagName);) {
                            if (i = t.getAttribute("data-command"), n = t.getAttribute("data-value"), i) {
                                l = t.firstChild;
                                break
                            }
                            t = t.parentNode
                        }
                        if (i) {
                            if ("range" === i) {
                                const e = l.cloneNode(!1);
                                this.applyRangeFormatElement(e)
                            } else {
                                const e = this.getRange(),
                                    t = e.startOffset,
                                    i = e.endOffset;
                                let o = this.getSelectedElementsAndComponents();
                                if (0 === o.length) return;
                                let s = o[0],
                                    a = o[o.length - 1];
                                const r = this.util.getNodePath(e.startContainer, s, null),
                                    c = this.util.getNodePath(e.endContainer, a, null);
                                let d = {},
                                    u = !1,
                                    h = !1;
                                const p = function(e) {
                                    return !this.isComponent(e)
                                }.bind(this.util);
                                for (let e, t, i, n, l = 0, r = o.length; l < r; l++) {
                                    if (i = l === r - 1, t = this.util.getRangeFormatElement(o[l], p), n = this.util.isList(t), !e && n) e = t, d = {
                                        r: e,
                                        f: [this.util.getParentElement(o[l], "LI")]
                                    }, 0 === l && (u = !0);
                                    else if (e && n)
                                        if (e !== t) {
                                            const r = this.detachRangeFormatElement(d.r, d.f, null, !1, !0);
                                            u && (s = r.sc, u = !1), i && (a = r.ec), n ? (e = t, d = {
                                                r: e,
                                                f: [this.util.getParentElement(o[l], "LI")]
                                            }, i && (h = !0)) : e = null
                                        } else d.f.push(this.util.getParentElement(o[l], "LI")), i && (h = !0);
                                    if (i && this.util.isList(e)) {
                                        const e = this.detachRangeFormatElement(d.r, d.f, null, !1, !0);
                                        (h || 1 === r) && (a = e.ec, u && (s = e.sc || a))
                                    }
                                }
                                this.setRange(this.util.getNodeFromPath(r, s), t, this.util.getNodeFromPath(c, a), i), o = this.getSelectedElementsAndComponents();
                                for (let e, t, i = 0, r = o.length; i < r; i++) e = o[i], e.nodeName.toLowerCase() === n.toLowerCase() || this.util.isComponent(e) || (t = l.cloneNode(!1), this.util.copyFormatAttributes(t, e), t.innerHTML = e.innerHTML, e.parentNode.insertBefore(t, e), this.util.removeItem(e)), 0 === i && (s = t || e), i === r - 1 && (a = t || e), t = null;
                                this.setRange(this.util.getNodeFromPath(r, s), t, this.util.getNodeFromPath(c, a), i), this.history.push(!1)
                            }
                            this.submenuOff()
                        }
                    }
                },
                lineHeight: {
                    name: "lineHeight",
                    add: function(e, t) {
                        const i = e.context;
                        i.lineHeight = {
                            _sizeList: null,
                            currentSize: -1
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), i.lineHeight._sizeList = l.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            i = this.util.createElement("DIV");
                        i.className = "se-submenu se-list-layer";
                        const n = e.lineHeights ? e.lineHeights : [{
                            text: "1",
                            value: 1
                        }, {
                            text: "1.15",
                            value: 1.15
                        }, {
                            text: "1.5",
                            value: 1.5
                        }, {
                            text: "2",
                            value: 2
                        }];
                        let l = '<div class="se-list-inner"><ul class="se-list-basic"><li><button type="button" class="default_value se-btn-list" title="' + t.toolbar.default+'">(' + t.toolbar.default+")</button></li>";
                        for (let e, t = 0, i = n.length; t < i; t++) e = n[t], l += '<li><button type="button" class="se-btn-list" data-value="' + e.value + '" title="' + e.text + '">' + e.text + "</button></li>";
                        return l += "</ul></div>", i.innerHTML = l, i
                    },
                    on: function() {
                        const e = this.context.lineHeight,
                            t = e._sizeList,
                            i = this.util.getFormatElement(this.getSelectionNode()).style.lineHeight + "";
                        if (i !== e.currentSize) {
                            for (let e = 0, n = t.length; e < n; e++) i === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentSize = i
                        }
                    },
                    pickup: function(e) {
                        if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                        e.preventDefault(), e.stopPropagation();
                        const t = e.target.getAttribute("data-value") || "",
                            i = this.getSelectedElements();
                        for (let e = 0, n = i.length; e < n; e++) i[e].style.lineHeight = t;
                        this.submenuOff(), this.history.push(!1)
                    }
                },
                template: {
                    name: "template",
                    add: function(e, t) {
                        e.context.template = {};
                        let i = this.setSubmenu.call(e);
                        i.querySelector("ul").addEventListener("click", this.pickup.bind(e)), t.parentNode.appendChild(i), i = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option.templates,
                            t = this.util.createElement("DIV");
                        t.className = "se-list-layer";
                        let i = '<div class="se-submenu se-list-inner"><ul class="se-list-basic">';
                        for (let t, n = 0, l = e.length; n < l; n++) t = e[n], i += '<li><button type="button" class="se-btn-list" data-value="' + n + '" title="' + t.name + '">' + t.name + "</button></li>";
                        return i += "</ul></div>", t.innerHTML = i, t
                    },
                    pickup: function(e) {
                        if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                        e.preventDefault(), e.stopPropagation();
                        const t = this.context.option.templates[e.target.getAttribute("data-value")];
                        if (!t.html) throw this.submenuOff(), Error('[SUNEDITOR.template.fail] cause : "templates[i].html not found"');
                        this.setContents(t.html), this.submenuOff()
                    }
                },
                paragraphStyle: {
                    name: "paragraphStyle",
                    add: function(e, t) {
                        const i = e.context;
                        i.paragraphStyle = {
                            _classList: null
                        };
                        let n = this.setSubmenu.call(e);
                        n.querySelector("ul").addEventListener("click", this.pickUp.bind(e)), i.paragraphStyle._classList = n.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.util.createElement("DIV");
                        t.className = "se-submenu se-list-layer";
                        const i = this.lang.menu,
                            n = {
                                spaced: {
                                    name: i.spaced,
                                    class: "__se__p-spaced",
                                    _class: ""
                                },
                                bordered: {
                                    name: i.bordered,
                                    class: "__se__p-bordered",
                                    _class: ""
                                },
                                neon: {
                                    name: i.neon,
                                    class: "__se__p-neon",
                                    _class: ""
                                }
                            },
                            l = e.paragraphStyles && 0 !== e.paragraphStyles.length ? e.paragraphStyles : ["spaced", "bordered", "neon"];
                        let o = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, t, i, s, a = 0, r = l.length; a < r; a++) {
                            if (e = l[a], "string" == typeof e) {
                                const t = n[e.toLowerCase()];
                                if (!t) continue;
                                e = t
                            }
                            t = e.name, i = e.class ? ' class="' + e.class + '"' : "", s = e._class, o += '<li><button type="button" class="se-btn-list' + (s ? " " + s : "") + '" data-value="' + e.class + '" title="' + t + '"><div' + i + ">" + t + "</div></button></li>"
                        }
                        return o += "</ul></div>", t.innerHTML = o, t
                    },
                    on: function() {
                        const e = this.context.paragraphStyle._classList,
                            t = this.util.getFormatElement(this.getSelectionNode());
                        for (let i = 0, n = e.length; i < n; i++) this.util.hasClass(t, e[i].getAttribute("data-value")) ? this.util.addClass(e[i], "active") : this.util.removeClass(e[i], "active")
                    },
                    pickUp: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = null;
                        for (; !/^UL$/i.test(t.tagName) && (i = t.getAttribute("data-value"), !i);) t = t.parentNode;
                        if (!i) return;
                        let n = this.getSelectedElements();
                        if (0 === n.length) return;
                        const l = this.util.hasClass(t, "active") ? this.util.removeClass.bind(this.util) : this.util.addClass.bind(this.util);
                        n = this.getSelectedElements();
                        for (let e = 0, t = n.length; e < t; e++) l(n[e], i);
                        this.submenuOff(), this.history.push(!1)
                    }
                },
                textStyle: {
                    name: "textStyle",
                    add: function(e, t) {
                        const i = e.context;
                        i.textStyle = {
                            _styleList: null
                        };
                        let n = this.setSubmenu.call(e),
                            l = n.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), i.textStyle._styleList = n.querySelectorAll("li button"), t.parentNode.appendChild(n), n = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.util.createElement("DIV");
                        t.className = "se-submenu se-list-layer";
                        const i = {
                                translucent: {
                                    name: this.lang.menu.translucent,
                                    style: "opacity: 0.5;",
                                    tag: "span"
                                },
                                shadow: {
                                    name: this.lang.menu.shadow,
                                    class: "__se__t-shadow",
                                    tag: "span"
                                }
                            },
                            n = e.textStyles ? e.textStyles : ["translucent", "shadow"];
                        let l = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, t, o, s, a, r, c, d = 0, u = n.length; d < u; d++) {
                            if (e = n[d], s = "", r = "", a = [], "string" == typeof e) {
                                const t = i[e.toLowerCase()];
                                if (!t) continue;
                                e = t
                            }
                            o = e.name, t = e.tag || "span", c = e._class, e.style && (s += ' style="' + e.style + '"', r += e.style.replace(/:[^;]+(;|$)\s*/g, ","), a.push("style")), e.class && (s += ' class="' + e.class + '"', r += "." + e.class.trim().replace(/\s+/g, ",."), a.push("class")), r = r.replace(/,$/, ""), l += '<li><button type="button" class="se-btn-list' + (c ? " " + c : "") + '" data-command="' + t + '" data-value="' + r + '" title="' + o + '"><' + t + s + ">" + o + "</" + t + "></button></li>"
                        }
                        return l += "</ul></div>", t.innerHTML = l, t
                    },
                    on: function() {
                        const e = this.util,
                            t = this.context.textStyle._styleList,
                            i = this.getSelectionNode();
                        for (let n, l, o, s = 0, a = t.length; s < a; s++) {
                            n = t[s], l = n.getAttribute("data-value").split(",");
                            for (let t, s, a = 0; a < l.length; a++) {
                                for (t = i, o = !1; !e.isFormatElement(t);) {
                                    if (t.nodeName.toLowerCase() === n.getAttribute("data-command").toLowerCase() && (s = l[a], /^\./.test(s) ? e.hasClass(t, s.replace(/^\./, "")) : t.style[s])) {
                                        o = !0;
                                        break
                                    }
                                    t = t.parentNode
                                }
                                if (!o) break
                            }
                            o ? e.addClass(n, "active") : e.removeClass(n, "active")
                        }
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            i = null,
                            n = null;
                        for (; !i && !/UL/i.test(t.tagName);) {
                            if (i = t.getAttribute("data-command"), i) {
                                n = t.firstChild;
                                break
                            }
                            t = t.parentNode
                        }
                        if (!i) return;
                        const l = n.style.cssText.replace(/:.+(;|$)/g, ",").split(",");
                        l.pop();
                        const o = n.classList;
                        for (let e = 0, t = o.length; e < t; e++) l.push("." + o[e]);
                        const s = this.util.hasClass(t, "active") ? null : n.cloneNode(!1),
                            a = s ? null : [n.nodeName];
                        this.nodeChange(s, l, a, !0), this.submenuOff()
                    }
                },
                link: {
                    name: "link",
                    add: function(e) {
                        e.addModule([l]);
                        const t = e.context;
                        t.link = {
                            focusElement: null,
                            linkNewWindowCheck: null,
                            linkAnchorText: null,
                            _linkAnchor: null
                        };
                        let i = this.setDialog.call(e);
                        t.link.modal = i, t.link.focusElement = i.querySelector("._se_link_url"), t.link.linkAnchorText = i.querySelector("._se_link_text"), t.link.linkNewWindowCheck = i.querySelector("._se_link_check");
                        let n = this.setController_LinkButton.call(e);
                        t.link.linkBtn = n, t.link._linkAnchor = null, n.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1), i.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), n.addEventListener("click", this.onClick_linkBtn.bind(e)), t.dialog.modal.appendChild(i), t.element.relative.appendChild(n), i = null, n = null
                    },
                    setDialog: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-dialog-content", t.style.display = "none", t.innerHTML = '<form class="editor_link"><div class="se-dialog-header"><button type="button" data-command="close" class="close" aria-label="Close" title="' + e.dialogBox.close + '"><i aria-hidden="true" data-command="close" class="se-icon-cancel"></i></button><span class="se-modal-title">' + e.dialogBox.linkBox.title + '</span></div><div class="se-dialog-body"><div class="se-dialog-form"><label>' + e.dialogBox.linkBox.url + '</label><input class="se-input-form _se_link_url" type="text" /></div><div class="se-dialog-form"><label>' + e.dialogBox.linkBox.text + '</label><input class="se-input-form _se_link_text" type="text" /></div><div class="se-dialog-form-footer"><label><input type="checkbox" class="se-dialog-btn-check _se_link_check" />&nbsp;' + e.dialogBox.linkBox.newWindowCheck + '</label></div></div><div class="se-dialog-footer"><button type="submit" class="se-btn-primary" title="' + e.dialogBox.submitButton + '"><span>' + e.dialogBox.submitButton + "</span></button></div></form>", t
                    },
                    setController_LinkButton: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-controller se-controller-link", t.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="link-content"><span><a target="_blank" href=""></a>&nbsp;</span><div class="se-btn-group"><button type="button" data-command="update" tabindex="-1" class="se-tooltip"><i class="se-icon-edit"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.edit + '</span></span></button><button type="button" data-command="unlink" tabindex="-1" class="se-tooltip"><i class="se-icon-unlink"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.unlink + '</span></span></button><button type="button" data-command="delete" tabindex="-1" class="se-tooltip"><i class="se-icon-delete"></i><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div></div>", t
                    },
                    submit: function(e) {
                        this.showLoading(), e.preventDefault(), e.stopPropagation();
                        const t = function() {
                            if (0 === this.context.link.focusElement.value.trim().length) return !1;
                            const e = this.context.link,
                                t = e.focusElement.value,
                                i = e.linkAnchorText,
                                n = 0 === i.value.length ? t : i.value;
                            if (this.context.dialog.updateModal) e._linkAnchor.href = t, e._linkAnchor.textContent = n, e._linkAnchor.target = e.linkNewWindowCheck.checked ? "_blank" : "", this.setRange(e._linkAnchor.childNodes[0], 0, e._linkAnchor.childNodes[0], e._linkAnchor.textContent.length);
                            else {
                                const i = this.util.createElement("A");
                                i.href = t, i.textContent = n, i.target = e.linkNewWindowCheck.checked ? "_blank" : "";
                                const l = this.getSelectedElements();
                                if (l.length > 1) {
                                    const e = this.util.createElement(l[0].nodeName);
                                    e.appendChild(i), this.insertNode(e)
                                } else this.insertNode(i);
                                this.setRange(i.childNodes[0], 0, i.childNodes[0], i.textContent.length)
                            }
                            this.history.push(!1), e.focusElement.value = "", e.linkAnchorText.value = ""
                        }.bind(this);
                        try {
                            t()
                        } finally {
                            this.plugins.dialog.close.call(this), this.closeLoading(), this.focus()
                        }
                        return !1
                    },
                    on: function(e) {
                        e || (this.context.link.linkAnchorText.value = this.getSelection().toString()), this.context.link._linkAnchor && (this.context.dialog.updateModal = !0, this.context.link.focusElement.value = this.context.link._linkAnchor.href, this.context.link.linkAnchorText.value = this.context.link._linkAnchor.textContent, this.context.link.linkNewWindowCheck.checked = !!/_blank/i.test(this.context.link._linkAnchor.target))
                    },
                    call_controller_linkButton: function(e) {
                        this.editLink = this.context.link._linkAnchor = e;
                        const t = this.context.link.linkBtn,
                            i = t.querySelector("a");
                        i.href = e.href, i.title = e.textContent, i.textContent = e.textContent;
                        const n = this.util.getOffset(e, this.context.element.wysiwygFrame);
                        t.style.top = n.top + e.offsetHeight + 10 + "px", t.style.left = n.left - this.context.element.wysiwygFrame.scrollLeft + "px", t.style.display = "block";
                        const l = this.context.element.wysiwygFrame.offsetWidth - (t.offsetLeft + t.offsetWidth);
                        l < 0 ? (t.style.left = t.offsetLeft + l + "px", t.firstElementChild.style.left = 20 - l + "px") : t.firstElementChild.style.left = "20px", this.controllersOn(t, this.plugins.link.init.bind(this))
                    },
                    onClick_linkBtn: function(e) {
                        e.stopPropagation();
                        const t = e.target.getAttribute("data-command") || e.target.parentNode.getAttribute("data-command");
                        if (t) {
                            if (e.preventDefault(), /update/.test(t)) this.context.link.focusElement.value = this.context.link._linkAnchor.href, this.context.link.linkAnchorText.value = this.context.link._linkAnchor.textContent, this.context.link.linkNewWindowCheck.checked = !!/_blank/i.test(this.context.link._linkAnchor.target), this.plugins.dialog.open.call(this, "link", !0);
                            else if (/unlink/.test(t)) {
                                const e = this.util.getChildElement(this.context.link._linkAnchor, (function(e) {
                                        return 0 === e.childNodes.length || 3 === e.nodeType
                                    }), !1),
                                    t = this.util.getChildElement(this.context.link._linkAnchor, (function(e) {
                                        return 0 === e.childNodes.length || 3 === e.nodeType
                                    }), !0);
                                this.setRange(e, 0, t, t.textContent.length), this.nodeChange(null, null, ["A"], !1)
                            } else this.util.removeItem(this.context.link._linkAnchor), this.context.link._linkAnchor = null, this.focus(), this.history.push(!1);
                            this.controllersOff()
                        }
                    },
                    init: function() {
                        if (!/link/i.test(this.context.dialog.kind)) {
                            const e = this.context.link;
                            e.linkBtn.style.display = "none", e._linkAnchor = null, e.focusElement.value = "", e.linkAnchorText.value = "", e.linkNewWindowCheck.checked = !1
                        }
                    }
                },
                image: {
                    name: "image",
                    add: function(e) {
                        e.addModule([l, o, s]);
                        const t = e.context;
                        t.image = {
                            sizeUnit: t.option._imageSizeUnit,
                            _linkElement: null,
                            _container: null,
                            _cover: null,
                            _element: null,
                            _element_w: 1,
                            _element_h: 1,
                            _element_l: 0,
                            _element_t: 0,
                            _defaultSizeX: "auto",
                            _defaultSizeY: "auto",
                            _origin_w: "auto" === t.option.imageWidth ? "" : t.option.imageWidth,
                            _origin_h: "",
                            _altText: "",
                            _caption: null,
                            captionCheckEl: null,
                            _linkValue: "",
                            _align: "none",
                            _captionChecked: !1,
                            _proportionChecked: !0,
                            _floatClassRegExp: "__se__float\\-[a-z]+",
                            _xmlHttp: null,
                            _captionShow: !0,
                            _resizing: t.option.imageResizing,
                            _rotation: t.option.imageRotation,
                            _resizeDotHide: !t.option.imageHeightShow,
                            _uploadFileLength: 0,
                            _onlyPercentage: t.option.imageSizeOnlyPercentage,
                            _ratio: !1,
                            _ratioX: 1,
                            _ratioY: 1
                        };
                        let i = this.setDialog.call(e);
                        t.image.modal = i, t.image.imgUrlFile = i.querySelector("._se_image_url"), t.image.imgInputFile = t.image.focusElement = i.querySelector("._se_image_file"), t.image.altText = i.querySelector("._se_image_alt"), t.image.imgLink = i.querySelector("._se_image_link"), t.image.imgLinkNewWindowCheck = i.querySelector("._se_image_link_check"), t.image.captionCheckEl = i.querySelector("._se_image_check_caption"), t.image.modal.querySelector(".se-dialog-tabs").addEventListener("click", this.openTab.bind(e)), t.image.modal.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), t.image.proportion = {}, t.image.inputX = {}, t.image.inputY = {}, t.option.imageResizing && (t.image.proportion = i.querySelector("._se_image_check_proportion"), t.image.inputX = i.querySelector("._se_image_size_x"), t.image.inputY = i.querySelector("._se_image_size_y"), t.image.inputX.value = t.option.imageWidth, t.image.inputX.addEventListener("keyup", this.setInputSize.bind(e, "x")), t.image.inputY.addEventListener("keyup", this.setInputSize.bind(e, "y")), t.image.inputX.addEventListener("change", this.setRatio.bind(e)), t.image.inputY.addEventListener("change", this.setRatio.bind(e)), t.image.proportion.addEventListener("change", this.setRatio.bind(e)), i.querySelector(".se-dialog-btn-revert").addEventListener("click", this.sizeRevert.bind(e))), t.dialog.modal.appendChild(i), i = null
                    },
                    setDialog: function() {
                        const e = this.context.option,
                            t = this.lang,
                            i = this.util.createElement("DIV");
                        i.className = "se-dialog-content", i.style.display = "none";
                        let n = '<div class="se-dialog-header"><button type="button" data-command="close" class="close" aria-label="Close" title="' + t.dialogBox.close + '"><i aria-hidden="true" data-command="close" class="se-icon-cancel"></i></button><span class="se-modal-title">' + t.dialogBox.imageBox.title + '</span></div><div class="se-dialog-tabs"><button type="button" class="_se_tab_link active" data-tab-link="image">' + t.toolbar.image + '</button><button type="button" class="_se_tab_link" data-tab-link="url">' + t.toolbar.link + '</button></div><form class="editor_image" method="post" enctype="multipart/form-data"><div class="_se_tab_content _se_tab_content_image"><div class="se-dialog-body">';
                        if (e.imageFileInput && (n += '<div class="se-dialog-form"><label>' + t.dialogBox.imageBox.file + '</label><input class="se-input-form _se_image_file" type="file" accept="image/*" multiple="multiple" /></div>'), e.imageUrlInput && (n += '<div class="se-dialog-form"><label>' + t.dialogBox.imageBox.url + '</label><input class="se-input-form _se_image_url" type="text" /></div>'), n += '<div class="se-dialog-form"><label>' + t.dialogBox.imageBox.altText + '</label><input class="se-input-form _se_image_alt" type="text" /></div>', e.imageResizing) {
                            const i = e.imageSizeOnlyPercentage,
                                l = i ? ' style="display: none !important;"' : "",
                                o = e.imageHeightShow ? "" : ' style="display: none !important;"';
                            n += '<div class="se-dialog-form">', i || !e.imageHeightShow ? n += '<div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.size + "</label></div>" : n += '<div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.width + '</label><label class="se-dialog-size-x">&nbsp;</label><label class="size-h">' + t.dialogBox.height + "</label></div>", n += '<input class="se-input-control _se_image_size_x" placeholder="auto"' + (i ? ' type="number" min="1"' : 'type="text"') + (i ? ' max="100"' : "") + ' /><label class="se-dialog-size-x"' + o + ">" + (i ? "%" : "x") + '</label><input type="text" class="se-input-control _se_image_size_y" placeholder="auto" disabled' + l + (i ? ' max="100"' : "") + o + "/><label" + l + o + '><input type="checkbox" class="se-dialog-btn-check _se_image_check_proportion" checked disabled/>&nbsp;' + t.dialogBox.proportion + '</label><button type="button" title="' + t.dialogBox.revertButton + '" class="se-btn se-dialog-btn-revert" style="float: right;"><i class="se-icon-revert"></i></button></div>'
                        }
                        return n += '<div class="se-dialog-form se-dialog-form-footer"><label><input type="checkbox" class="se-dialog-btn-check _se_image_check_caption" />&nbsp;' + t.dialogBox.caption + '</label></div></div></div><div class="_se_tab_content _se_tab_content_url" style="display: none"><div class="se-dialog-body"><div class="se-dialog-form"><label>' + t.dialogBox.linkBox.url + '</label><input class="se-input-form _se_image_link" type="text" /></div><label><input type="checkbox" class="_se_image_link_check"/>&nbsp;' + t.dialogBox.linkBox.newWindowCheck + '</label></div></div><div class="se-dialog-footer"><div><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="none" checked>' + t.dialogBox.basic + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="left">' + t.dialogBox.left + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="center">' + t.dialogBox.center + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="right">' + t.dialogBox.right + '</label></div><button type="submit" class="se-btn-primary" title="' + t.dialogBox.submitButton + '"><span>' + t.dialogBox.submitButton + "</span></button></div></form>", i.innerHTML = n, i
                    },
                    openTab: function(e) {
                        const t = this.context.image.modal,
                            i = "init" === e ? t.querySelector("._se_tab_link") : e.target;
                        if (!/^BUTTON$/i.test(i.tagName)) return !1;
                        const n = i.getAttribute("data-tab-link");
                        let l, o, s;
                        for (o = t.getElementsByClassName("_se_tab_content"), l = 0; l < o.length; l++) o[l].style.display = "none";
                        for (s = t.getElementsByClassName("_se_tab_link"), l = 0; l < s.length; l++) this.util.removeClass(s[l], "active");
                        return t.querySelector("._se_tab_content_" + n).style.display = "block", this.util.addClass(i, "active"), "image" === n ? this.context.image.imgInputFile.focus() : "url" === n && this.context.image.imgLink.focus(), !1
                    },
                    submitAction: function(e) {
                        if (e.length > 0) {
                            let t = 0;
                            const i = [];
                            for (let n = 0, l = e.length; n < l; n++) /image/i.test(e[n].type) && (i.push(e[n]), t += e[n].size);
                            const n = this.context.option.imageUploadSizeLimit;
                            if (n > 0) {
                                let e = 0;
                                const i = this._variable._imagesInfo;
                                for (let t = 0, n = i.length; t < n; t++) e += 1 * i[t].size;
                                if (t + e > n) {
                                    const i = "[SUNEDITOR.imageUpload.fail] Size of uploadable total images: " + n / 1e3 + "KB";
                                    return this._imageUploadError(i, {
                                        limitSize: n,
                                        currentSize: e,
                                        uploadSize: t
                                    }) && s.open.call(this, i), void this.closeLoading()
                                }
                            }
                            this.context.image._uploadFileLength = i.length;
                            const l = this.context.option.imageUploadUrl,
                                o = this.context.option.imageUploadHeader,
                                a = this.context.dialog.updateModal ? 1 : i.length;
                            if ("string" == typeof l && l.length > 0) {
                                const e = new FormData;
                                for (let t = 0; t < a; t++) e.append("file-" + t, i[t]);
                                if (this.context.image._xmlHttp = this.util.getXMLHttpRequest(), this.context.image._xmlHttp.onreadystatechange = this.plugins.image.callBack_imgUpload.bind(this, this.context.image._linkValue, this.context.image.imgLinkNewWindowCheck.checked, this.context.image.inputX.value, this.context.image.inputY.value, this.context.image._align, this.context.dialog.updateModal, this.context.image._element), this.context.image._xmlHttp.open("post", l, !0), "object" == typeof o && Object.keys(o).length > 0)
                                    for (let e in o) this.context.image._xmlHttp.setRequestHeader(e, o[e]);
                                this.context.image._xmlHttp.send(e)
                            } else
                                for (let e = 0; e < a; e++) this.plugins.image.setup_reader.call(this, i[e], this.context.image._linkValue, this.context.image.imgLinkNewWindowCheck.checked, this.context.image.inputX.value, this.context.image.inputY.value, this.context.image._align, e, a - 1)
                        }
                    },
                    onRender_imgInput: function() {
                        try {
                            this.plugins.image.submitAction.call(this, this.context.image.imgInputFile.files)
                        } catch (e) {
                            throw this.closeLoading(), Error('[SUNEDITOR.imageUpload.fail] cause : "' + e.message + '"')
                        }
                    },
                    setup_reader: function(e, t, i, n, l, o, s, a) {
                        const r = new FileReader;
                        this.context.dialog.updateModal && (this.context.image._element.setAttribute("data-file-name", e.name), this.context.image._element.setAttribute("data-file-size", e.size)), r.onload = function(e, c, d) {
                            try {
                                this.context.image.inputX.value = n, this.context.image.inputY.value = l, e ? this.plugins.image.update_src.call(this, r.result, c, d) : this.plugins.image.create_image.call(this, r.result, t, i, n, l, o, d), s === a && this.closeLoading()
                            } catch (e) {
                                throw this.closeLoading(), Error('[SUNEDITOR.imageFileRendering.fail] cause : "' + e.message + '"')
                            }
                        }.bind(this, this.context.dialog.updateModal, this.context.image._element, e), r.readAsDataURL(e)
                    },
                    callBack_imgUpload: function(e, t, i, n, l, o, a) {
                        if (4 === this.context.image._xmlHttp.readyState) {
                            if (200 !== this.context.image._xmlHttp.status) throw this.closeLoading(), Error("[SUNEDITOR.imageUpload.fail] status: " + this.context.image._xmlHttp.status + ", responseURL: " + this.context.image._xmlHttp.responseURL); {
                                const r = JSON.parse(this.context.image._xmlHttp.responseText);
                                if (r.errorMessage) this.closeLoading(), this._imageUploadError(r.errorMessage, r.result) && s.open.call(this, r.errorMessage);
                                else {
                                    const s = r.result;
                                    for (let r, c = 0, d = s.length; c < d; c++) r = {
                                        name: s[c].name,
                                        size: s[c].size
                                    }, o ? this.plugins.image.update_src.call(this, s[c].url, a, r) : this.plugins.image.create_image.call(this, s[c].url, e, t, i, n, l, r)
                                }
                                this.closeLoading()
                            }
                        }
                    },
                    onRender_imgUrl: function() {
                        const e = this.context.image;
                        if (0 === e.imgUrlFile.value.trim().length) return !1;
                        try {
                            const t = {
                                name: e.imgUrlFile.value.split("/").pop(),
                                size: 0
                            };
                            this.context.dialog.updateModal ? this.plugins.image.update_src.call(this, e.imgUrlFile.value, e._element, t) : this.plugins.image.create_image.call(this, e.imgUrlFile.value, e._linkValue, e.imgLinkNewWindowCheck.checked, e.inputX.value, e.inputY.value, e._align, t)
                        } catch (e) {
                            throw Error('[SUNEDITOR.imageURLRendering.fail] cause : "' + e.message + '"')
                        } finally {
                            this.closeLoading()
                        }
                    },
                    onRender_link: function(e, t, i) {
                        if (t.trim().length > 0) {
                            const n = this.util.createElement("A");
                            return n.href = /^https?:\/\//.test(t) ? t : "http://" + t, n.target = i ? "_blank" : "", n.setAttribute("data-image-link", "image"), e.setAttribute("data-image-link", t), n.appendChild(e), n
                        }
                        return e
                    },
                    setInputSize: function(e, t) {
                        t && 32 === t.keyCode ? t.preventDefault() : this.plugins.resizing._module_setInputSize.call(this, this.context.image, e)
                    },
                    setRatio: function() {
                        this.plugins.resizing._module_setRatio.call(this, this.context.image)
                    },
                    submit: function(e) {
                        const t = this.context.image,
                            i = this.plugins.image;
                        this.showLoading(), e.preventDefault(), e.stopPropagation(), t._linkValue = t.imgLink.value, t._altText = t.altText.value, t._align = t.modal.querySelector('input[name="suneditor_image_radio"]:checked').value, t._captionChecked = t.captionCheckEl.checked, t._resizing && (t._proportionChecked = t.proportion.checked);
                        try {
                            this.context.dialog.updateModal && i.update_image.call(this, !1, !1, !1), t.imgInputFile && t.imgInputFile.files.length > 0 ? i.onRender_imgInput.call(this) : t.imgUrlFile && t.imgUrlFile.value.trim().length > 0 ? i.onRender_imgUrl.call(this) : this.closeLoading()
                        } catch (e) {
                            throw this.closeLoading(), Error('[SUNEDITOR.image.submit.fail] cause : "' + e.message + '"')
                        } finally {
                            this.plugins.dialog.close.call(this)
                        }
                        return !1
                    },
                    setImagesInfo: function(e, t) {
                        const i = this._variable._imagesInfo;
                        let n = e.getAttribute("data-index"),
                            l = null,
                            o = "";
                        if (!n || this._imagesInfoInit) o = "create", n = this._variable._imageIndex, this._variable._imageIndex++, e.setAttribute("data-index", n), e.setAttribute("data-file-name", t.name), e.setAttribute("data-file-size", t.size), l = {
                            src: e.src,
                            index: 1 * n,
                            name: t.name,
                            size: t.size
                        }, i.push(l);
                        else {
                            o = "update", n *= 1;
                            for (let e = 0, t = i.length; e < t; e++)
                                if (n === i[e].index) {
                                    l = i[e];
                                    break
                                } l || (n = this._variable._imageIndex, this._variable._imageIndex++, l = {}), l.src = e.src, l.name = e.getAttribute("data-file-name"), l.size = 1 * e.getAttribute("data-file-size")
                        }
                        if (l.element = e, l.delete = this.plugins.image.destroy.bind(this, e), l.select = function() {
                                e.scrollIntoView(!0), this._w.setTimeout(function() {
                                    this.plugins.image.onModifyMode.call(this, e, this.plugins.resizing.call_controller_resize.call(this, e, "image"))
                                }.bind(this))
                            }.bind(this), e.getAttribute("origin-size") || e.setAttribute("origin-size", e.naturalWidth + "," + e.naturalHeight), !e.getAttribute("data-origin")) {
                            const t = this.util.getParentElement(e, this.util.isComponent),
                                i = this.util.getParentElement(e, "FIGURE"),
                                n = this.plugins.resizing._module_getSizeX.call(this, this.context.image, e, i, t),
                                l = this.plugins.resizing._module_getSizeY.call(this, this.context.image, e, i, t);
                            e.setAttribute("data-origin", n + "," + l), e.setAttribute("data-size", n + "," + l)
                        }
                        this._imageUpload(e, n, o, l, --this.context.image._uploadFileLength < 0 ? 0 : this.context.image._uploadFileLength)
                    },
                    checkImagesInfo: function() {
                        const e = this.context.element.wysiwyg.getElementsByTagName("IMG"),
                            t = this.plugins.image,
                            i = this._variable._imagesInfo;
                        if (e.length === i.length) {
                            if (this._imagesInfoReset)
                                for (let i, n = 0, l = e.length; n < l; n++) i = e[n], t.setImagesInfo.call(this, i, {
                                    name: i.getAttribute("data-file-name") || i.src.split("/").pop(),
                                    size: i.getAttribute("data-file-size") || 0
                                });
                            return
                        }
                        this.context.resizing._resize_plugin = "image";
                        const n = [],
                            l = [];
                        for (let e = 0, t = i.length; e < t; e++) l[e] = i[e].index;
                        for (let i, o = 0, s = e.length; o < s; o++)
                            if (i = e[o], this.util.getParentElement(i, this.util.isComponent))
                                if (!i.getAttribute("data-index") || l.indexOf(1 * i.getAttribute("data-index")) < 0) {
                                    if (n.push(this._variable._imageIndex), i.removeAttribute("data-index"), t.setImagesInfo.call(this, i, {
                                            name: i.getAttribute("data-file-name") || i.src.split("/").pop(),
                                            size: i.getAttribute("data-file-size") || 0
                                        }), !i.style.width) {
                                        const e = (i.getAttribute("data-size") || i.getAttribute("data-origin") || "").split(",");
                                        t.onModifyMode.call(this, i, null), t.applySize.call(this, e[0] || this.context.option.imageWidth, e[1] || "")
                                    }
                                } else n.push(1 * i.getAttribute("data-index"));
                        else n.push(this._variable._imageIndex), t.onModifyMode.call(this, i, null), t.openModify.call(this, !0), t.update_image.call(this, !0, !1, !0);
                        for (let e, t = 0; t < i.length; t++) e = i[t].index, n.indexOf(e) > -1 || (i.splice(t, 1), this._imageUpload(null, e, "delete", null, 0), t--);
                        this.context.resizing._resize_plugin = ""
                    },
                    _onload_image: function(e, t) {
                        t && (this.plugins.image.setImagesInfo.call(this, e, t), this.history.push(!0))
                    },
                    create_image: function(e, t, i, n, l, o, s) {
                        const a = this.context.image;
                        this.context.resizing._resize_plugin = "image";
                        let r = this.util.createElement("IMG");
                        r.addEventListener("load", this.plugins.image._onload_image.bind(this, r, s)), r.src = e, r.alt = a._altText, r = this.plugins.image.onRender_link.call(this, r, t, i), r.setAttribute("data-rotate", "0"), a._resizing && r.setAttribute("data-proportion", a._proportionChecked);
                        const c = this.plugins.resizing.set_cover.call(this, r),
                            d = this.plugins.resizing.set_container.call(this, c, "se-image-container");
                        a._captionChecked && (a._caption = this.plugins.resizing.create_caption.call(this), a._caption.setAttribute("contenteditable", !1), c.appendChild(a._caption)), a._element = r, a._cover = c, a._container = d, this.plugins.image.applySize.call(this), this.plugins.image.setAlign.call(this, o, r, c, d), this.insertComponent(d, !0), this.context.resizing._resize_plugin = ""
                    },
                    update_image: function(e, t, i) {
                        const n = this.context.image,
                            l = n._linkValue;
                        let o, s = n._element,
                            a = n._cover,
                            r = n._container,
                            c = !1;
                        null === a && (c = !0, s = n._element.cloneNode(!0), a = this.plugins.resizing.set_cover.call(this, s)), null === r && (a = a.cloneNode(!0), c = !0, r = this.plugins.resizing.set_container.call(this, a, "se-image-container")), c && (r.innerHTML = "", r.appendChild(a));
                        const d = this.util.isNumber(n.inputX.value) ? n.inputX.value + n.sizeUnit : n.inputX.value,
                            u = this.util.isNumber(n.inputY.value) ? n.inputY.value + n.sizeUnit : n.inputY.value;
                        if (o = /%$/.test(s.style.width) ? d !== r.style.width || u !== r.style.height : d !== s.style.width || u !== s.style.height, s.alt = n._altText, n._captionChecked ? n._caption || (n._caption = this.plugins.resizing.create_caption.call(this), a.appendChild(n._caption)) : n._caption && (this.util.removeItem(n._caption), n._caption = null), l.trim().length > 0)
                            if (null !== n._linkElement) n._linkElement.href = l, n._linkElement.target = n.imgLinkNewWindowCheck.checked ? "_blank" : "", s.setAttribute("data-image-link", l);
                            else {
                                let e = this.plugins.image.onRender_link.call(this, s, l, this.context.image.imgLinkNewWindowCheck.checked);
                                a.insertBefore(e, n._caption)
                            }
                        else if (null !== n._linkElement) {
                            const e = s;
                            e.setAttribute("data-image-link", "");
                            let t = e.cloneNode(!0);
                            a.removeChild(n._linkElement), a.insertBefore(t, n._caption), s = t
                        }
                        if (c) {
                            const e = this.util.isRangeFormatElement(n._element.parentNode) || this.util.isWysiwygDiv(n._element.parentNode) ? n._element : /^A$/i.test(n._element.parentNode.nodeName) ? n._element.parentNode : this.util.getFormatElement(n._element) || n._element;
                            e.parentNode.insertBefore(r, e), this.util.removeItem(e), s = r.querySelector("img"), n._element = s, n._cover = a, n._container = r
                        }!n._onlyPercentage && o && !e && (/\d+/.test(s.style.height) || this.context.resizing._rotateVertical && n._captionChecked) && (/%$/.test(n.inputX.value) || /%$/.test(n.inputY.value) ? this.plugins.resizing.resetTransform.call(this, s) : this.plugins.resizing.setTransformSize.call(this, s, this.util.getNumber(n.inputX.value, 0), this.util.getNumber(n.inputY.value, 0)));
                        if (n._resizing && (s.setAttribute("data-proportion", n._proportionChecked), o && this.plugins.image.applySize.call(this)), this.plugins.image.setAlign.call(this, null, s, null, null), e && this.plugins.image.setImagesInfo.call(this, s, {
                                name: s.getAttribute("data-file-name") || s.src.split("/").pop(),
                                size: s.getAttribute("data-file-size") || 0
                            }), t) {
                            this.plugins.image.init.call(this);
                            const e = this.plugins.resizing.call_controller_resize.call(this, s, "image");
                            this.plugins.image.onModifyMode.call(this, s, e)
                        }
                        i || this.history.push(!1)
                    },
                    update_src: function(e, t, i) {
                        t.src = e, this._w.setTimeout(this.plugins.image.setImagesInfo.bind(this, t, i))
                    },
                    onModifyMode: function(e, t) {
                        const i = this.context.image;
                        i._linkElement = /^A$/i.test(e.parentNode.nodeName) ? e.parentNode : null, i._element = e, i._cover = this.util.getParentElement(e, "FIGURE"), i._container = this.util.getParentElement(e, this.util.isComponent), i._caption = this.util.getChildElement(i._cover, "FIGCAPTION"), i._align = e.getAttribute("data-align") || "none", t && (i._element_w = t.w, i._element_h = t.h, i._element_t = t.t, i._element_l = t.l);
                        let n = i._element.getAttribute("data-size") || i._element.getAttribute("data-origin");
                        n ? (n = n.split(","), i._origin_w = n[0], i._origin_h = n[1]) : t && (i._origin_w = t.w, i._origin_h = t.h)
                    },
                    openModify: function(e) {
                        const t = this.context.image;
                        t.imgUrlFile.value = t._element.src, t._altText = t.altText.value = t._element.alt, t._linkValue = t.imgLink.value = null === t._linkElement ? "" : t._linkElement.href, t.imgLinkNewWindowCheck.checked = t._linkElement && "_blank" === t._linkElement.target, t.modal.querySelector('input[name="suneditor_image_radio"][value="' + t._align + '"]').checked = !0, t._align = t.modal.querySelector('input[name="suneditor_image_radio"]:checked').value, t._captionChecked = t.captionCheckEl.checked = !!t._caption, t._resizing && this.plugins.resizing._module_setModifyInputSize.call(this, t, this.plugins.image), e || this.plugins.dialog.open.call(this, "image", !0)
                    },
                    on: function(e) {
                        if (!e) {
                            const e = this.context.image;
                            e.inputX.value = e._origin_w = this.context.option.imageWidth === e._defaultSizeX ? "" : this.context.option.imageWidth, e.inputY.value = e._origin_h = "", e.inputY.disabled = !0, e.proportion.disabled = !0
                        }
                    },
                    sizeRevert: function() {
                        this.plugins.resizing._module_sizeRevert.call(this, this.context.image)
                    },
                    applySize: function(e, t) {
                        const i = this.context.image;
                        return e || (e = i.inputX.value), t || (t = i.inputY.value), i._onlyPercentage && e || /%$/.test(e) ? (this.plugins.image.setPercentSize.call(this, e, t), !0) : (e && "auto" !== e || t && "auto" !== t ? this.plugins.image.setSize.call(this, e, t, !1) : this.plugins.image.setAutoSize.call(this), !1)
                    },
                    setSize: function(e, t, i) {
                        const n = this.context.image;
                        this.plugins.image.cancelPercentAttr.call(this), n._element.style.width = this.util.isNumber(e) ? e + n.sizeUnit : e, n._element.style.height = this.util.isNumber(t) ? t + n.sizeUnit : /%$/.test(t) ? "" : t, "center" === n._align && this.plugins.image.setAlign.call(this, null, null, null, null), i || n._element.removeAttribute("data-percentage"), this.plugins.resizing._module_saveCurrentSize.call(this, n)
                    },
                    setAutoSize: function() {
                        const e = this.context.image;
                        this.plugins.resizing.resetTransform.call(this, e._element), this.plugins.image.cancelPercentAttr.call(this), e._element.style.maxWidth = "", e._element.style.width = "", e._element.style.height = "", e._cover.style.width = "", e._cover.style.height = "", this.plugins.image.setAlign.call(this, null, null, null, null), e._element.setAttribute("data-percentage", "auto,auto"), this.plugins.resizing._module_saveCurrentSize.call(this, e)
                    },
                    setOriginSize: function() {
                        const e = this.context.image;
                        e._element.removeAttribute("data-percentage"), this.plugins.resizing.resetTransform.call(this, e._element), this.plugins.image.cancelPercentAttr.call(this);
                        const t = (e._element.getAttribute("data-origin") || "").split(","),
                            i = t[0],
                            n = t[1];
                        t && (e._onlyPercentage || /%$/.test(i) && (/%$/.test(n) || !/\d/.test(n)) ? this.plugins.image.setPercentSize.call(this, i, n) : this.plugins.image.setSize.call(this, i, n), this.plugins.resizing._module_saveCurrentSize.call(this, e))
                    },
                    setPercentSize: function(e, t) {
                        const i = this.context.image;
                        t = !t || /%$/.test(t) || this.util.getNumber(t, 0) ? this.util.isNumber(t) ? t + i.sizeUnit : t || "" : this.util.isNumber(t) ? t + "%" : t;
                        const n = /%$/.test(t);
                        i._container.style.width = this.util.isNumber(e) ? e + "%" : e, i._container.style.height = "", i._cover.style.width = "100%", i._cover.style.height = n ? t : "", i._element.style.width = "100%", i._element.style.height = n ? "" : t, i._element.style.maxWidth = "", "center" === i._align && this.plugins.image.setAlign.call(this, null, null, null, null), i._element.setAttribute("data-percentage", e + "," + t), this.plugins.resizing.setCaptionPosition.call(this, i._element), this.plugins.resizing._module_saveCurrentSize.call(this, i)
                    },
                    cancelPercentAttr: function() {
                        const e = this.context.image;
                        e._cover.style.width = "", e._cover.style.height = "", e._container.style.width = "", e._container.style.height = "", this.util.removeClass(e._container, this.context.image._floatClassRegExp), this.util.addClass(e._container, "__se__float-" + e._align), "center" === e._align && this.plugins.image.setAlign.call(this, null, null, null, null)
                    },
                    setAlign: function(e, t, i, n) {
                        const l = this.context.image;
                        e || (e = l._align), t || (t = l._element), i || (i = l._cover), n || (n = l._container), i.style.margin = e && "none" !== e ? "auto" : "0", /%$/.test(t.style.width) && "center" === e ? (n.style.minWidth = "100%", i.style.width = n.style.width) : (n.style.minWidth = "", i.style.width = this.context.resizing._rotateVertical ? t.style.height || t.offsetHeight : t.style.width && "auto" !== t.style.width ? t.style.width || "100%" : ""), this.util.hasClass(n, "__se__float-" + e) || (this.util.removeClass(n, l._floatClassRegExp), this.util.addClass(n, "__se__float-" + e)), t.setAttribute("data-align", e)
                    },
                    resetAlign: function() {
                        const e = this.context.image;
                        e._element.setAttribute("data-align", ""), e._align = "none", e._cover.style.margin = "0", this.util.removeClass(e._container, e._floatClassRegExp)
                    },
                    destroy: function(e) {
                        const t = e || this.context.image._element,
                            i = this.util.getParentElement(t, this.util.isComponent) || t,
                            n = 1 * t.getAttribute("data-index");
                        let l = i.previousElementSibling || i.nextElementSibling;
                        if (this.util.removeItem(i), this.plugins.image.init.call(this), this.controllersOff(), this.focusEdge(l), n >= 0) {
                            const e = this._variable._imagesInfo;
                            for (let t = 0, i = e.length; t < i; t++)
                                if (n === e[t].index) return e.splice(t, 1), void this._imageUpload(null, n, "delete", null, 0)
                        }
                        this.history.push(!1)
                    },
                    init: function() {
                        const e = this.context.image;
                        e.imgInputFile && (e.imgInputFile.value = ""), e.imgUrlFile && (e.imgUrlFile.value = ""), e.altText.value = "", e.imgLink.value = "", e.imgLinkNewWindowCheck.checked = !1, e.modal.querySelector('input[name="suneditor_image_radio"][value="none"]').checked = !0, e.captionCheckEl.checked = !1, e._element = null, this.plugins.image.openTab.call(this, "init"), e._resizing && (e.inputX.value = this.context.option.imageWidth === e._defaultSizeX ? "" : this.context.option.imageWidth, e.inputY.value = "", e.inputX.disabled = !1, e.inputY.disabled = !1, e.proportion.disabled = !1, e.proportion.checked = !0, e._ratio = !1, e._ratioX = 1, e._ratioY = 1)
                    }
                },
                video: {
                    name: "video",
                    add: function(e) {
                        e.addModule([l, o]);
                        const t = e.context;
                        t.video = {
                            sizeUnit: t.option._videoSizeUnit,
                            _container: null,
                            _cover: null,
                            _element: null,
                            _element_w: 1,
                            _element_h: 1,
                            _element_l: 0,
                            _element_t: 0,
                            _defaultSizeX: "100%",
                            _defaultSizeY: 100 * t.option.videoRatio + "%",
                            _origin_w: "100%" === t.option.videoWidth ? "" : t.option.videoWidth,
                            _origin_h: "",
                            _proportionChecked: !0,
                            _align: "none",
                            _floatClassRegExp: "__se__float\\-[a-z]+",
                            _captionShow: !1,
                            _resizing: t.option.videoResizing,
                            _rotation: t.option.videoRotation,
                            _resizeDotHide: !t.option.videoHeightShow,
                            _onlyPercentage: t.option.videoSizeOnlyPercentage,
                            _ratio: !1,
                            _ratioX: 1,
                            _ratioY: 1,
                            _youtubeQuery: t.option.youtubeQuery,
                            _videoRatio: 100 * t.option.videoRatio + "%",
                            _defaultRatio: 100 * t.option.videoRatio + "%"
                        };
                        let i = this.setDialog.call(e);
                        t.video.modal = i, t.video.focusElement = i.querySelector("._se_video_url"), i.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), t.video.proportion = {}, t.video.videoRatioOption = {}, t.video.inputX = {}, t.video.inputY = {}, t.option.videoResizing && (t.video.proportion = i.querySelector("._se_video_check_proportion"), t.video.videoRatioOption = i.querySelector(".se-video-ratio"), t.video.inputX = i.querySelector("._se_video_size_x"), t.video.inputY = i.querySelector("._se_video_size_y"), t.video.inputX.value = t.option.videoWidth, t.video.inputX.addEventListener("keyup", this.setInputSize.bind(e, "x")), t.video.inputY.addEventListener("keyup", this.setInputSize.bind(e, "y")), t.video.inputX.addEventListener("change", this.setRatio.bind(e)), t.video.inputY.addEventListener("change", this.setRatio.bind(e)), t.video.proportion.addEventListener("change", this.setRatio.bind(e)), t.video.videoRatioOption.addEventListener("change", this.setVideoRatio.bind(e)), i.querySelector(".se-dialog-btn-revert").addEventListener("click", this.sizeRevert.bind(e))), t.dialog.modal.appendChild(i), i = null
                    },
                    setDialog: function() {
                        const e = this.context.option,
                            t = this.lang,
                            i = this.util.createElement("DIV");
                        i.className = "se-dialog-content", i.style.display = "none";
                        let n = '<form class="editor_video"><div class="se-dialog-header"><button type="button" data-command="close" class="close" aria-label="Close" title="' + t.dialogBox.close + '"><i aria-hidden="true" data-command="close" class="se-icon-cancel"></i></button><span class="se-modal-title">' + t.dialogBox.videoBox.title + '</span></div><div class="se-dialog-body"><div class="se-dialog-form"><label>' + t.dialogBox.videoBox.url + '</label><input class="se-input-form _se_video_url" type="text" /></div>';
                        if (e.videoResizing) {
                            const i = e.videoRatioList || [{
                                    name: "16:9",
                                    value: .5625
                                }, {
                                    name: "4:3",
                                    value: .75
                                }, {
                                    name: "21:9",
                                    value: .4285
                                }],
                                l = e.videoRatio,
                                o = e.videoSizeOnlyPercentage,
                                s = o ? ' style="display: none !important;"' : "",
                                a = e.videoHeightShow ? "" : ' style="display: none !important;"',
                                r = e.videoRatioShow ? "" : ' style="display: none !important;"',
                                c = o || e.videoHeightShow || e.videoRatioShow ? "" : ' style="display: none !important;"';
                            n += '<div class="se-dialog-form"><div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.width + '</label><label class="se-dialog-size-x">&nbsp;</label><label class="size-h"' + a + ">" + t.dialogBox.height + '</label><label class="size-h"' + r + ">(" + t.dialogBox.ratio + ')</label></div><input class="se-input-control _se_video_size_x" placeholder="100%"' + (o ? ' type="number" min="1"' : 'type="text"') + (o ? ' max="100"' : "") + '/><label class="se-dialog-size-x"' + c + ">" + (o ? "%" : "x") + '</label><input class="se-input-control _se_video_size_y" placeholder="' + 100 * e.videoRatio + '%"' + (o ? ' type="number" min="1"' : 'type="text"') + (o ? ' max="100"' : "") + a + '/><select class="se-input-select se-video-ratio" title="' + t.dialogBox.ratio + '"' + r + ">", a || (n += '<option value=""> - </option>');
                            for (let e = 0, t = i.length; e < t; e++) n += '<option value="' + i[e].value + '"' + (l.toString() === i[e].value.toString() ? " selected" : "") + ">" + i[e].name + "</option>";
                            n += '</select><button type="button" title="' + t.dialogBox.revertButton + '" class="se-btn se-dialog-btn-revert" style="float: right;"><i class="se-icon-revert"></i></button></div><div class="se-dialog-form se-dialog-form-footer"' + s + c + '><label><input type="checkbox" class="se-dialog-btn-check _se_video_check_proportion" checked/>&nbsp;' + t.dialogBox.proportion + "</label></div>"
                        }
                        return n += '</div><div class="se-dialog-footer"><div><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="none" checked>' + t.dialogBox.basic + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="left">' + t.dialogBox.left + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="center">' + t.dialogBox.center + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="right">' + t.dialogBox.right + '</label></div><button type="submit" class="se-btn-primary" title="' + t.dialogBox.submitButton + '"><span>' + t.dialogBox.submitButton + "</span></button></div></form>", i.innerHTML = n, i
                    },
                    setVideoRatio: function(e) {
                        const t = this.context.video,
                            i = e.target.options[e.target.selectedIndex].value;
                        t._defaultSizeY = t._videoRatio = i ? 100 * i + "%" : t._defaultSizeY, t.inputY.placeholder = i ? 100 * i + "%" : "", t.inputY.value = ""
                    },
                    setInputSize: function(e, t) {
                        if (t && 32 === t.keyCode) return void t.preventDefault();
                        const i = this.context.video;
                        this.plugins.resizing._module_setInputSize.call(this, i, e), "y" === e && this.plugins.video.setVideoRatioSelect.call(this, t.target.value || i._videoRatio)
                    },
                    setRatio: function() {
                        this.plugins.resizing._module_setRatio.call(this, this.context.video)
                    },
                    _onload_video: function(e) {
                        this.plugins.video.setVideosInfo.call(this, e)
                    },
                    submitAction: function() {
                        if (0 === this.context.video.focusElement.value.trim().length) return !1;
                        this.context.resizing._resize_plugin = "video";
                        const e = this.context.video;
                        let t = null,
                            i = null,
                            n = null,
                            l = e.focusElement.value.trim();
                        if (e._align = e.modal.querySelector('input[name="suneditor_video_radio"]:checked').value, /^<iframe.*\/iframe>$/.test(l)) t = (new this._w.DOMParser).parseFromString(l, "text/html").querySelector("iframe");
                        else {
                            if (t = this.util.createElement("IFRAME"), /youtu\.?be/.test(l) && (/^http/.test(l) || (l = "https://" + l), l = l.replace("watch?v=", ""), /^\/\/.+\/embed\//.test(l) || (l = l.replace(l.match(/\/\/.+\//)[0], "//www.youtube.com/embed/").replace("&", "?&")), e._youtubeQuery.length > 0))
                                if (/\?/.test(l)) {
                                    const t = l.split("?");
                                    l = t[0] + "?" + e._youtubeQuery + "&" + t[1]
                                } else l += "?" + e._youtubeQuery;
                            t.src = l
                        }
                        this.context.dialog.updateModal ? (e._element.src !== t.src && (e._element.src = t.src), n = e._container, i = this.util.getParentElement(e._element, "FIGURE"), t = e._element) : (t.frameBorder = "0", t.allowFullscreen = !0, t.addEventListener("load", this.plugins.video._onload_video.bind(this, t)), e._element = t, i = this.plugins.resizing.set_cover.call(this, t), n = this.plugins.resizing.set_container.call(this, i, "se-video-container"), this._variable._videosCnt++), e._cover = i, e._container = n;
                        const o = this.plugins.resizing._module_getSizeX.call(this, e) !== (e.inputX.value || e._defaultSizeX) || this.plugins.resizing._module_getSizeY.call(this, e) !== (e.inputY.value || e._videoRatio),
                            s = !this.context.dialog.updateModal || o;
                        e._resizing && (this.context.video._proportionChecked = e.proportion.checked, t.setAttribute("data-proportion", e._proportionChecked));
                        let a = !1;
                        s && (a = this.plugins.video.applySize.call(this)), a && "center" === e._align || this.plugins.video.setAlign.call(this, null, t, i, n), this.context.dialog.updateModal ? e._resizing && this.context.resizing._rotateVertical && s && this.plugins.resizing.setTransformSize.call(this, t, null, null) : this.insertComponent(n, !1), this.context.resizing._resize_plugin = "", this.context.dialog.updateModal && this.history.push(!1)
                    },
                    setVideosInfo: function(e) {
                        if (!e.getAttribute("data-origin")) {
                            const t = this.util.getParentElement(e, this.util.isComponent),
                                i = this.util.getParentElement(e, "FIGURE"),
                                n = this.plugins.resizing._module_getSizeX.call(this, this.context.video, e, i, t),
                                l = this.plugins.resizing._module_getSizeY.call(this, this.context.video, e, i, t);
                            e.setAttribute("data-origin", n + "," + l), e.setAttribute("data-size", n + "," + l)
                        }
                    },
                    submit: function(e) {
                        this.showLoading(), e.preventDefault(), e.stopPropagation();
                        try {
                            this.plugins.video.submitAction.call(this)
                        } finally {
                            this.plugins.dialog.close.call(this), this.closeLoading()
                        }
                        return this.focus(), !1
                    },
                    _update_videoCover: function(e) {
                        const t = this.context.video;
                        e.frameBorder = "0", e.allowFullscreen = !0, e.onload = e.addEventListener("load", this.plugins.video._onload_video.bind(this, e));
                        const i = this.util.getParentElement(e, this.util.isComponent) || this.util.getParentElement(e, function(e) {
                            return this.isWysiwygDiv(e.parentNode)
                        }.bind(this.util));
                        t._element = e = e.cloneNode(!1);
                        const n = t._cover = this.plugins.resizing.set_cover.call(this, e),
                            l = t._container = this.plugins.resizing.set_container.call(this, n, "se-video-container"),
                            o = i.getElementsByTagName("FIGCAPTION")[0];
                        let s = null;
                        o && (s = this.util.createElement("DIV"), s.innerHTML = o.innerHTML, this.util.removeItem(o));
                        const a = (e.getAttribute("data-size") || e.getAttribute("data-origin") || "").split(",");
                        this.plugins.video.applySize.call(this, a[0] || this.context.option.videoWidth, a[1] || ""), i.parentNode.insertBefore(l, i), s && i.parentNode.insertBefore(s, i), this.util.removeItem(i)
                    },
                    onModifyMode: function(e, t) {
                        const i = this.context.video;
                        i._element = e, i._cover = this.util.getParentElement(e, "FIGURE"), i._container = this.util.getParentElement(e, this.util.isComponent), i._align = e.getAttribute("data-align") || "none", i._element_w = t.w, i._element_h = t.h, i._element_t = t.t, i._element_l = t.l;
                        let n = i._element.getAttribute("data-size") || i._element.getAttribute("data-origin");
                        n ? (n = n.split(","), i._origin_w = n[0], i._origin_h = n[1]) : (i._origin_w = t.w, i._origin_h = t.h)
                    },
                    openModify: function(e) {
                        const t = this.context.video;
                        if (t.focusElement.value = t._element.src, t.modal.querySelector('input[name="suneditor_video_radio"][value="' + t._align + '"]').checked = !0, t._resizing) {
                            this.plugins.resizing._module_setModifyInputSize.call(this, t, this.plugins.video);
                            const e = t._videoRatio = this.plugins.resizing._module_getSizeY.call(this, t);
                            this.plugins.video.setVideoRatioSelect.call(this, e) || (t.inputY.value = t._onlyPercentage ? this.util.getNumber(e, 2) : e)
                        }
                        e || this.plugins.dialog.open.call(this, "video", !0)
                    },
                    on: function(e) {
                        if (!e) {
                            const e = this.context.video;
                            e.inputX.value = e._origin_w = this.context.option.videoWidth === e._defaultSizeX ? "" : this.context.option.videoWidth, e.inputY.value = e._origin_h = "", e.proportion.disabled = !0
                        }
                    },
                    setVideoRatioSelect: function(e) {
                        let t = !1;
                        const i = this.context.video,
                            n = i.videoRatioOption.options;
                        /%$/.test(e) || i._onlyPercentage ? e = this.util.getNumber(e, 2) / 100 + "" : (!this.util.isNumber(e) || 1 * e >= 1) && (e = ""), i.inputY.placeholder = "";
                        for (let l = 0, o = n.length; l < o; l++) n[l].value === e ? (t = n[l].selected = !0, i.inputY.placeholder = e ? 100 * e + "%" : "") : n[l].selected = !1;
                        return t
                    },
                    checkVideosInfo: function() {
                        const e = this.context.element.wysiwyg.getElementsByTagName("IFRAME");
                        if (e.length === this._variable._videosCnt) return;
                        this.context.resizing._resize_plugin = "video";
                        const t = this.plugins.video;
                        this._variable._videosCnt = e.length;
                        for (let i, n, l = 0, o = this._variable._videosCnt; l < o; l++) i = e[l], n = this.util.getParentElement(i, this.util.isComponent), (!n || n.getElementsByTagName("figcaption").length > 0 || !i.style.width) && t._update_videoCover.call(this, i);
                        this.context.resizing._resize_plugin = ""
                    },
                    sizeRevert: function() {
                        this.plugins.resizing._module_sizeRevert.call(this, this.context.video)
                    },
                    applySize: function(e, t) {
                        const i = this.context.video;
                        return e || (e = i.inputX.value), t || (t = i.inputY.value), i._onlyPercentage || /%$/.test(e) || !e ? (this.plugins.video.setPercentSize.call(this, e || "100%", t || i._videoRatio), !0) : (e && "auto" !== e || t && "auto" !== t ? this.plugins.video.setSize.call(this, e, t || i._defaultRatio, !1) : this.plugins.video.setAutoSize.call(this), !1)
                    },
                    setSize: function(e, t, i) {
                        const n = this.context.video;
                        e = this.util.getNumber(e, 0), t = this.util.isNumber(t) ? t + n.sizeUnit : t || "", n._element.style.width = e ? e + n.sizeUnit : "", n._cover.style.paddingBottom = n._cover.style.height = t, /%$/.test(t) ? n._element.style.height = "" : n._element.style.height = t, i || n._element.removeAttribute("data-percentage"), this.plugins.resizing._module_saveCurrentSize.call(this, n)
                    },
                    setAutoSize: function() {
                        this.plugins.video.setPercentSize.call(this, 100, this.context.video._defaultRatio)
                    },
                    setOriginSize: function(e) {
                        const t = this.context.video;
                        t._element.removeAttribute("data-percentage"), this.plugins.resizing.resetTransform.call(this, t._element), this.plugins.video.cancelPercentAttr.call(this);
                        const i = ((e ? t._element.getAttribute("data-size") : "") || t._element.getAttribute("data-origin") || "").split(",");
                        if (i) {
                            const e = i[0],
                                n = i[1];
                            t._onlyPercentage || /%$/.test(e) && (/%$/.test(n) || !/\d/.test(n)) ? this.plugins.video.setPercentSize.call(this, e, n) : this.plugins.video.setSize.call(this, e, n), this.plugins.resizing._module_saveCurrentSize.call(this, t)
                        }
                    },
                    setPercentSize: function(e, t) {
                        const i = this.context.video;
                        t = !t || /%$/.test(t) || this.util.getNumber(t, 0) ? this.util.isNumber(t) ? t + i.sizeUnit : t || i._videoRatio : this.util.isNumber(t) ? t + "%" : t, i._container.style.width = this.util.isNumber(e) ? e + "%" : e, i._container.style.height = "", i._cover.style.width = "100%", i._cover.style.height = t, i._cover.style.paddingBottom = t, i._element.style.width = "100%", i._element.style.height = "100%", i._element.style.maxWidth = "", "center" === i._align && this.plugins.video.setAlign.call(this, null, null, null, null), i._element.setAttribute("data-percentage", e + "," + t), this.plugins.resizing._module_saveCurrentSize.call(this, i)
                    },
                    cancelPercentAttr: function() {
                        const e = this.context.video;
                        e._cover.style.width = "", e._cover.style.height = "", e._cover.style.paddingBottom = "", e._container.style.width = "", e._container.style.height = "", this.util.removeClass(e._container, this.context.video._floatClassRegExp), this.util.addClass(e._container, "__se__float-" + e._align), "center" === e._align && this.plugins.video.setAlign.call(this, null, null, null, null)
                    },
                    setAlign: function(e, t, i, n) {
                        const l = this.context.video;
                        e || (e = l._align), t || (t = l._element), i || (i = l._cover), n || (n = l._container), i.style.margin = e && "none" !== e ? "auto" : "0", /%$/.test(t.style.width) && "center" === e ? (n.style.minWidth = "100%", i.style.width = n.style.width, i.style.height = i.style.paddingBottom, i.style.paddingBottom = this.util.getNumber(this.util.getNumber(i.style.paddingBottom, 2) / 100 * this.util.getNumber(i.style.width, 2), 2) + "%") : (n.style.minWidth = "", i.style.width = this.context.resizing._rotateVertical ? t.style.height || t.offsetHeight : t.style.width || "100%", i.style.paddingBottom = i.style.height), this.util.hasClass(n, "__se__float-" + e) || (this.util.removeClass(n, l._floatClassRegExp), this.util.addClass(n, "__se__float-" + e)), t.setAttribute("data-align", e)
                    },
                    resetAlign: function() {
                        const e = this.context.video;
                        e._element.setAttribute("data-align", ""), e._align = "none", e._cover.style.margin = "0", this.util.removeClass(e._container, e._floatClassRegExp)
                    },
                    destroy: function() {
                        this._variable._videosCnt--;
                        const e = this.context.video._container;
                        let t = e.previousElementSibling || e.nextElementSibling;
                        this.util.removeItem(e), this.plugins.video.init.call(this), this.controllersOff(), this.focusEdge(t), this.history.push(!1)
                    },
                    init: function() {
                        const e = this.context.video;
                        e.focusElement.value = "", e._origin_w = this.context.option.videoWidth, e._origin_h = "", e.modal.querySelector('input[name="suneditor_video_radio"][value="none"]').checked = !0, e._resizing && (e.inputX.value = this.context.option.videoWidth === e._defaultSizeX ? "" : this.context.option.videoWidth, e.inputY.value = "", e.proportion.checked = !0, e.proportion.disabled = !0, this.plugins.video.setVideoRatioSelect.call(this, e._defaultRatio))
                    }
                }
            },
            r = i("P6u4"),
            c = i.n(r);
        const d = {
            _d: document,
            _w: window,
            _tagConvertor: function(e) {
                const t = {
                    b: "strong",
                    i: "em",
                    var: "em",
                    u: "ins",
                    strike: "del",
                    s: "del"
                };
                return e.replace(/(<\/?)(b|strong|var|i|em|u|ins|s|strike|del)\b\s*(?:[^>^<]+)?\s*(?=>)/gi, (function(e, i, n) {
                    return i + ("string" == typeof t[n] ? t[n] : n)
                }))
            },
            _HTMLConvertor: function(e) {
                const t = {
                    "&": "&amp;",
                    " ": "&nbsp;",
                    "'": "&quot;",
                    "<": "&lt;",
                    ">": "&gt;"
                };
                return e.replace(/&|\u00A0|'|<|>/g, (function(e) {
                    return "string" == typeof t[e] ? t[e] : e
                }))
            },
            /* CHANGED */
            zeroWidthSpace:'\u200b',
            zeroWidthRegExp: new RegExp(String.fromCharCode(8203), "g"),
            onlyZeroWidthRegExp: new RegExp("^" + String.fromCharCode(8203) + "+$"),
            onlyZeroWidthSpace: function(e) {
                return "string" != typeof e && (e = e.textContent), "" === e || this.onlyZeroWidthRegExp.test(e)
            },
            getXMLHttpRequest: function() {
                if (!this._w.ActiveXObject) return this._w.XMLHttpRequest ? new XMLHttpRequest : null;
                try {
                    return new ActiveXObject("Msxml2.XMLHTTP")
                } catch (e) {
                    try {
                        return new ActiveXObject("Microsoft.XMLHTTP")
                    } catch (e) {
                        return null
                    }
                }
            },
            createElement: function(e) {
                return this._d.createElement(e)
            },
            createTextNode: function(e) {
                return this._d.createTextNode(e || "")
            },
            getIncludePath: function(e, t) {
                let i = "";
                const n = [],
                    l = "js" === t ? "script" : "link",
                    o = "js" === t ? "src" : "href";
                let s = "(?:";
                for (let t = 0, i = e.length; t < i; t++) s += e[t] + (t < i - 1 ? "|" : ")");
                const a = new this._w.RegExp("(^|.*[\\/])" + s + "(\\.[^\\/]+)?." + t + "(?:\\?.*|;.*)?$", "i"),
                    r = new this._w.RegExp(".+\\." + t + "(?:\\?.*|;.*)?$", "i");
                for (let e = this._d.getElementsByTagName(l), t = 0; t < e.length; t++) r.test(e[t][o]) && n.push(e[t]);
                for (let e = 0; e < n.length; e++) {
                    let t = n[e][o].match(a);
                    if (t) {
                        i = t[0];
                        break
                    }
                }
                if ("" === i && (i = n.length > 0 ? n[0][o] : ""), -1 === i.indexOf(":/") && "//" !== i.slice(0, 2) && (i = 0 === i.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] + i : location.href.match(/^[^\?]*\/(?:)/)[0] + i), !i) throw "[SUNEDITOR.util.getIncludePath.fail] The SUNEDITOR installation path could not be automatically detected. (name: +" + name + ", extension: " + t + ")";
                return i
            },
            getPageStyle: function(e) {
                let t = "";
                const i = (e ? this.getIframeDocument(e) : this._d).styleSheets;
                for (let e, n = 0, l = i.length; n < l; n++) {
                    try {
                        e = i[n].cssRules
                    } catch (e) {
                        continue
                    }
                    for (let i = 0, n = e.length; i < n; i++) t += e[i].cssText
                }
                return t
            },
            getIframeDocument: function(e) {
                let t = e.contentWindow || e.contentDocument;
                return t.document && (t = t.document), t
            },
            getAttributesToString: function(e, t) {
                if (!e.attributes) return "";
                const i = e.attributes;
                let n = "";
                for (let e = 0, l = i.length; e < l; e++) t && t.indexOf(i[e].name) > -1 || (n += i[e].name + '="' + i[e].value + '" ');
                return n
            },
            convertContentsForEditor: function(e) {
                let t = "",
                    i = this._d.createRange().createContextualFragment(e).childNodes;
                for (let e, n = 0, l = i.length; n < l; n++)
                    if (e = i[n].outerHTML || i[n].textContent, 3 === i[n].nodeType) {
                        const i = e.split(/\n/g);
                        let n = "";
                        for (let e = 0, l = i.length; e < l; e++) n = i[e].trim(), n.length > 0 && (t += "<p>" + n + "</p>")
                    } else t += e.replace(/(?!>)\s+(?=<)/g, " ");
                return 0 === t.length && (t = "<p>" + ((e = this._HTMLConvertor(e)).length > 0 ? e : "<br>") + "</p>"), this._tagConvertor(t.replace(this._deleteExclusionTags, ""))
            },
            convertHTMLForCodeView: function(e, t) {
                let i = "";
                const n = this._w.RegExp,
                    l = new n("^(BLOCKQUOTE|PRE|TABLE|THEAD|TBODY|TR|TH|TD|OL|UL|IMG|IFRAME|VIDEO|AUDIO|FIGURE|FIGCAPTION|HR|BR)$", "i"),
                    o = this.isFormatElement.bind(this),
                    s = "string" == typeof e ? this._d.createRange().createContextualFragment(e) : e,
                    a = this;
                return t = (t *= 1) > 0 ? new this._w.Array(t + 1).join(" ") : "",
                    function e(s, r, c) {
                        const d = s.childNodes,
                            u = l.test(s.nodeName),
                            h = u ? r : "";
                        for (let p, g, m, f = 0, _ = d.length; f < _; f++) {
                            if (p = d[f], m = l.test(p.nodeName), g = m ? "\n" : "", c = !o(p) || u || /^(TH|TD)$/i.test(s.nodeName) ? "" : "\n", 3 === p.nodeType) {
                                i += a._HTMLConvertor(/^\n+$/.test(p.data) ? "" : p.data);
                                continue
                            }
                            if (0 === p.childNodes.length) {
                                i += (/^(HR)$/i.test(p.nodeName) ? "\n" : "") + h + p.outerHTML + g;
                                continue
                            }
                            p.innerHTML = p.innerHTML;
                            const _ = p.nodeName.toLowerCase();
                            i += (c || (u ? "" : g)) + (h || m ? r : "") + p.outerHTML.match(n("<" + _ + "[^>]*>", "i"))[0] + g, e(p, r + t, ""), i += (m ? r : "") + "</" + _ + ">" + (c || g || u ? "\n" : /^(TH|TD)$/i.test(p.nodeName) ? "\n" : "")
                        }
                    }(s, "", "\n"), i.trim() + "\n"
            },
            isWysiwygDiv: function(e) {
                return !(!e || 1 !== e.nodeType || !this.hasClass(e, "se-wrapper-wysiwyg") && !/^BODY$/i.test(e.nodeName))
            },
            isFormatElement: function(e) {
                return !(!e || 1 !== e.nodeType || !/^(P|DIV|H[1-6]|LI|TH|TD)$/i.test(e.nodeName) || this.isComponent(e) || this.isWysiwygDiv(e))
            },
            isRangeFormatElement: function(e) {
                return !(!e || 1 !== e.nodeType || !/^(BLOCKQUOTE|OL|UL|PRE|FIGCAPTION|TABLE|THEAD|TBODY|TR|TH|TD)$/i.test(e.nodeName) && "range" !== e.getAttribute("data-format"))
            },
            isComponent: function(e) {
                return e && (/se-component/.test(e.className) || /^(TABLE|HR)$/.test(e.nodeName))
            },
            getFormatElement: function(e, t) {
                if (!e) return null;
                for (t || (t = function() {
                        return !0
                    }); e;) {
                    if (this.isWysiwygDiv(e)) return null;
                    if (this.isRangeFormatElement(e) && e.firstElementChild, this.isFormatElement(e) && t(e)) return e;
                    e = e.parentNode
                }
                return null
            },
            getRangeFormatElement: function(e, t) {
                if (!e) return null;
                for (t || (t = function() {
                        return !0
                    }); e;) {
                    if (this.isWysiwygDiv(e)) return null;
                    if (this.isRangeFormatElement(e) && !/^(THEAD|TBODY|TR)$/i.test(e.nodeName) && t(e)) return e;
                    e = e.parentNode
                }
                return null
            },
            copyTagAttributes: function(e, t) {
                t.style.cssText && (e.style.cssText += t.style.cssText);
                const i = t.classList;
                for (let t = 0, n = i.length; t < n; t++) this.addClass(e, i[t]);
                e.style.cssText || e.removeAttribute("style"), e.className.trim() || e.removeAttribute("class")
            },
            copyFormatAttributes: function(e, t) {
                (t = t.cloneNode(!1)).className = t.className.replace(/(\s|^)__se__format__(\s|$)/g, ""), this.copyTagAttributes(e, t)
            },
            getArrayIndex: function(e, t) {
                let i = -1;
                for (let n = 0, l = e.length; n < l; n++)
                    if (e[n] === t) {
                        i = n;
                        break
                    } return i
            },
            nextIdx: function(e, t) {
                let i = this.getArrayIndex(e, t);
                return -1 === i ? -1 : i + 1
            },
            prevIdx: function(e, t) {
                let i = this.getArrayIndex(e, t);
                return -1 === i ? -1 : i - 1
            },
            getPositionIndex: function(e) {
                let t = 0;
                for (; e = e.previousSibling;) t += 1;
                return t
            },
            getNodePath: function(e, t, i) {
                const n = [];
                let l = !0;
                return this.getParentElement(e, function(e) {
                    if (e === t && (l = !1), l && !this.isWysiwygDiv(e)) {
                        if (i && 3 === e.nodeType) {
                            let t = null,
                                n = null;
                            i.s = i.e = 0;
                            let l = e.previousSibling;
                            for (; l && 3 === l.nodeType;) n = l.textContent.replace(this.zeroWidthRegExp, ""), i.s += n.length, e.textContent = n + e.textContent, t = l, l = l.previousSibling, this.removeItem(t);
                            let o = e.nextSibling;
                            for (; o && 3 === o.nodeType;) n = o.textContent.replace(this.zeroWidthRegExp, ""), i.e += n.length, e.textContent += n, t = o, o = o.nextSibling, this.removeItem(t)
                        }
                        n.push(e)
                    }
                    return !1
                }.bind(this)), n.map(this.getPositionIndex).reverse()
            },
            getNodeFromPath: function(e, t) {
                let i, n = t;
                for (let t = 0, l = e.length; t < l && (i = n.childNodes, 0 !== i.length); t++) n = i.length <= e[t] ? i[i.length - 1] : i[e[t]];
                return n
            },
            isSameAttributes: function(e, t) {
                if (3 === e.nodeType && 3 === t.nodeType) return !0;
                if (3 === e.nodeType || 3 === t.nodeType) return !1;
                const i = e.style,
                    n = t.style;
                let l = 0;
                for (let e = 0, t = i.length; e < t; e++) i[i[e]] === n[i[e]] && l++;
                const o = e.classList,
                    s = t.classList,
                    a = this._w.RegExp;
                let r = 0;
                for (let e = 0, t = o.length; e < t; e++) a("(s|^)" + o[e] + "(s|$)").test(s.value) && r++;
                return l === n.length && r === s.length
            },
            isList: function(e) {
                return e && /^(OL|UL)$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isListCell: function(e) {
                return e && /^LI$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isTable: function(e) {
                return e && /^(TABLE|THEAD|TBODY|TR|TH|TD)$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isCell: function(e) {
                return e && /^(TD|TH)$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isBreak: function(e) {
                return e && /^BR$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isAnchor: function(e) {
                return e && /^A$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isNumber: function(e) {
                return !!e && /^-?\d+(\.\d+)?$/.test(e + "")
            },
            getNumber: function(e, t) {
                if (!e) return null;
                let i = (e + "").match(/-?\d+(\.\d+)?/);
                return i && i[0] ? (i = i[0], t < 0 ? 1 * i : 0 === t ? this._w.Math.round(1 * i) : 1 * (1 * i).toFixed(t)) : null
            },
            getListChildren: function(e, t) {
                const i = [];
                return e && e.children && 0 !== e.children.length ? (t = t || function() {
                    return !0
                }, function n(l) {
                    (e !== l && t(l) || /^BR$/i.test(e.nodeName)) && i.push(l);
                    for (let e = 0, t = l.children.length; e < t; e++) n(l.children[e])
                }(e), i) : i
            },
            getListChildNodes: function(e, t) {
                const i = [];
                return e && 0 !== e.childNodes.length ? (t = t || function() {
                    return !0
                }, function n(l) {
                    (e !== l && t(l) || /^BR$/i.test(e.nodeName)) && i.push(l);
                    for (let e = 0, t = l.childNodes.length; e < t; e++) n(l.childNodes[e])
                }(e), i) : i
            },
            getElementDepth: function(e) {
                let t = 0;
                for (e = e.parentNode; e && !this.isWysiwygDiv(e);) t += 1, e = e.parentNode;
                return t
            },
            getParentElement: function(e, t) {
                let i;
                if ("function" == typeof t) i = t;
                else {
                    let e;
                    /^\./.test(t) ? (e = "className", t = t.split(".")[1]) : /^#/.test(t) ? (e = "id", t = "^" + t.split("#")[1] + "$") : /^:/.test(t) ? (e = "name", t = "^" + t.split(":")[1] + "$") : (e = "nodeName", t = "^" + t + "$");
                    const n = new this._w.RegExp(t, "i");
                    i = function(t) {
                        return n.test(t[e])
                    }
                }
                for (; e && !i(e);) {
                    if (this.isWysiwygDiv(e)) return null;
                    e = e.parentNode
                }
                return e
            },
            getChildElement: function(e, t, i) {
                let n;
                if ("function" == typeof t) n = t;
                else {
                    let e;
                    /^\./.test(t) ? (e = "className", t = t.split(".")[1]) : /^#/.test(t) ? (e = "id", t = "^" + t.split("#")[1] + "$") : /^:/.test(t) ? (e = "name", t = "^" + t.split(":")[1] + "$") : (e = "nodeName", t = "^" + t + "$");
                    const i = new this._w.RegExp(t, "i");
                    n = function(t) {
                        return i.test(t[e])
                    }
                }
                const l = this.getListChildNodes(e, (function(e) {
                    return n(e)
                }));
                return l[i ? l.length - 1 : 0]
            },
            getEdgeChildNodes: function(e, t) {
                if (e) {
                    for (t || (t = e); e && 1 === e.nodeType && e.childNodes.length > 0 && !this.isBreak(e);) e = e.firstChild;
                    for (; t && 1 === t.nodeType && t.childNodes.length > 0 && !this.isBreak(t);) t = t.lastChild;
                    return {
                        sc: e,
                        ec: t || e
                    }
                }
            },
            getOffset: function(e, t) {
                let i = 0,
                    n = 0,
                    l = 3 === e.nodeType ? e.parentElement : e;
                const o = this.getParentElement(e, this.isWysiwygDiv.bind(this));
                for (; l && !this.hasClass(l, "se-container") && l !== o;) i += l.offsetLeft, n += l.offsetTop, l = l.offsetParent;
                const s = t && /iframe/i.test(t.nodeName);
                return {
                    left: i + (s ? t.parentElement.offsetLeft : 0),
                    top: n - o.scrollTop + (s ? t.parentElement.offsetTop : 0)
                }
            },
            getOverlapRangeAtIndex: function(e, t, i, n) {
                if (e <= n ? t < i : t > i) return 0;
                const l = (e > i ? e : i) - (t < n ? t : n);
                return (l < 0 ? -1 * l : l) + 1
            },
            changeTxt: function(e, t) {
                e && t && (e.textContent = t)
            },
            hasClass: function(e, t) {
                if (e) return e.classList.contains(t.trim())
            },
            addClass: function(e, t) {
                if (!e) return;
                new this._w.RegExp("(\\s|^)" + t + "(\\s|$)").test(e.className) || (e.className += (e.className.length > 0 ? " " : "") + t)
            },
            removeClass: function(e, t) {
                if (!e) return;
                const i = new this._w.RegExp("(\\s|^)" + t + "(\\s|$)");
                e.className = e.className.replace(i, " ").trim()
            },
            toggleClass: function(e, t) {
                if (!e) return;
                const i = new this._w.RegExp("(\\s|^)" + t + "(\\s|$)");
                i.test(e.className) ? e.className = e.className.replace(i, " ").trim() : e.className += " " + t
            },
            removeItem: function(e) {
                if (e) try {
                    e.remove()
                } catch (t) {
                    e.parentNode.removeChild(e)
                }
            },
            removeItemAllParents: function(e, t) {
                if (!e) return null;
                let i = null;
                return t || (t = function(e) {
                        const t = e.textContent.trim();
                        return 0 === t.length || /^(\n|\u200B)+$/.test(t)
                    }),
                    function e(n) {
                        if (!d.isWysiwygDiv(n)) {
                            const l = n.parentNode;
                            l && t(n) && (i = {
                                sc: n.previousElementSibling,
                                ec: n.nextElementSibling
                            }, d.removeItem(n), e(l))
                        }
                    }(e), i
            },
            removeEmptyNode: function(e) {
                const t = this;
                ! function i(n) {
                    if (n === e || !t.onlyZeroWidthSpace(n.textContent) || /^BR$/i.test(n.nodeName) || n.firstChild && /^BR$/i.test(n.firstChild.nodeName) || t.isComponent(n)) {
                        const e = n.children;
                        for (let n = 0, l = e.length, o = 0; n < l; n++) e[n + o] && !t.isComponent(e[n + o]) && (o += i(e[n + o]))
                    } else if (n.parentNode) return n.parentNode.removeChild(n), -1;
                    return 0
                }(e), 0 === e.childNodes.length && (e.innerHTML = "<br>")
            },
            isIgnoreNodeChange: function(e) {
                return 3 !== e.nodeType && !/^(span|font|b|strong|var|i|em|u|ins|s|strike|del|sub|sup|mark|a)$/i.test(e.nodeName)
            },
            cleanHTML: function(e) {
                const t = new this._w.RegExp("^(meta|script|link|style|[a-z]+:[a-z]+)$", "i"),
                    i = this._d.createRange().createContextualFragment(e).childNodes;
                let n = "";
                for (let e = 0, l = i.length; e < l; e++) t.test(i[e].nodeName) || (n += 1 === i[e].nodeType ? i[e].outerHTML : 3 === i[e].nodeType ? i[e].textContent : "");
                return n = n.replace(/<(script|style).*>(\n|.)*<\/(script|style)>/g, "").replace(/(<[a-zA-Z0-9]+)[^>]*(?=>)/g, (function(e, t) {
                    const i = e.match(/((?:contenteditable|colspan|rowspan|target|href|src|class|data-format|data-size|data-file-size|data-file-name|data-origin|data-align|data-image-link|data-rotate|data-proportion|data-percentage|origin-size)\s*=\s*"[^"]*")/gi);
                    if (i)
                        for (let e = 0, n = i.length; e < n; e++) /^class="(?!(__se__|se-))/.test(i[e]) || (t += " " + i[e]);
                    return t
                })).replace(/<\/?(span[^>^<]*)>/g, "").replace(this._deleteExclusionTags, ""), this._tagConvertor(n || e)
            },
            _deleteExclusionTags: function() {
                const e = "br|p|div|pre|blockquote|h[1-6]|ol|ul|dl|li|hr|figure|figcaption|img|iframe|audio|video|table|thead|tbody|tr|th|td|a|b|strong|var|i|em|u|ins|s|span|strike|del|sub|sup|mark".split("|");
                let t = "<\\/?(";
                for (let i = 0, n = e.length; i < n; i++) t += "(?!\\b" + e[i] + "\\b)";
                return t += "[^>^<])+>", new RegExp(t, "g")
            }()
        };
        var u = d,
            h = {
                init: function(e, t) {
                    "object" != typeof t && (t = {});
                    const i = document;
                    this._initOptions(e, t);
                    const n = i.createElement("DIV");
                    n.className = "sun-editor", e.id && (n.id = "suneditor_" + e.id);
                    const l = i.createElement("DIV");
                    l.className = "se-container";
                    const o = this._createToolBar(i, t.buttonList, t.plugins, t.lang),
                        s = i.createElement("DIV");
                    s.className = "se-arrow";
                    const a = i.createElement("DIV");
                    a.className = "se-toolbar-sticky-dummy";
                    const r = i.createElement("DIV");
                    r.className = "se-wrapper";
                    const c = u.convertContentsForEditor(e.value),
                        d = this._initElements(t, n, o.element, s, c),
                        h = d.bottomBar,
                        p = d.wysiwygFrame,
                        g = d.placeholder;
                    let m = d.codeView;
                    const f = h.resizingBar,
                        _ = h.navigation,
                        b = h.charCounter,
                        y = i.createElement("DIV");
                    y.className = "se-loading-box sun-editor-common", y.innerHTML = '<div class="se-loading-effect"></div>';
                    const v = i.createElement("DIV");
                    return v.className = "se-resizing-back", r.appendChild(p), r.appendChild(m), g && r.appendChild(g), l.appendChild(o.element), l.appendChild(a), l.appendChild(r), l.appendChild(v), l.appendChild(y), f && l.appendChild(f), n.appendChild(l), m = this._checkCodeMirror(t, m), {
                        constructed: {
                            _top: n,
                            _relative: l,
                            _toolBar: o.element,
                            _editorArea: r,
                            _wysiwygArea: p,
                            _codeArea: m,
                            _placeholder: g,
                            _resizingBar: f,
                            _navigation: _,
                            _charCounter: b,
                            _loading: y,
                            _resizeBack: v,
                            _stickyDummy: a,
                            _arrow: s
                        },
                        options: t,
                        plugins: o.plugins,
                        pluginCallButtons: o.pluginCallButtons
                    }
                },
                _checkCodeMirror: function(e, t) {
                    if (e.codeMirror) {
                        const i = [{
                            mode: "htmlmixed",
                            htmlMode: !0,
                            lineNumbers: !0,
                            lineWrapping: !0
                        }, e.codeMirror.options || {}].reduce((function(e, t) {
                            return Object.keys(t).forEach((function(i) {
                                e[i] = t[i]
                            })), e
                        }), {});
                        "auto" === e.height && (i.viewportMargin = 1 / 0, i.height = "auto");
                        const n = e.codeMirror.src.fromTextArea(t, i);
                        n.display.wrapper.style.cssText = t.style.cssText, e.codeMirrorEditor = n, (t = n.display.wrapper).className += " se-wrapper-code-mirror"
                    }
                    return t
                },
                _setOptions: function(e, t, i, n) {
                    this._initOptions(t.element.originElement, e);
                    const l = t.element,
                        o = l.relative,
                        s = l.editorArea,
                        a = !!e.buttonList || e.mode !== n.mode,
                        r = !!e.plugins,
                        c = this._createToolBar(document, a ? e.buttonList : n.buttonList, r ? e.plugins : i, e.lang),
                        d = document.createElement("DIV");
                    d.className = "se-arrow", a && (o.insertBefore(c.element, l.toolbar), o.removeChild(l.toolbar), l.toolbar = c.element, l._arrow = d);
                    const u = this._initElements(e, l.topArea, a ? c.element : l.toolbar, d, l.wysiwyg.innerHTML),
                        h = u.bottomBar,
                        p = u.wysiwygFrame,
                        g = u.placeholder;
                    let m = u.codeView;
                    return l.resizingBar && o.removeChild(l.resizingBar), h.resizingBar && o.appendChild(h.resizingBar), l.resizingBar = h.resizingBar, l.navigation = h.navigation, l.charCounter = h.charCounter, s.removeChild(l.wysiwygFrame), s.removeChild(l.code), s.appendChild(p), s.appendChild(m), l.placeholder && s.removeChild(l.placeholder), g && s.appendChild(g), m = this._checkCodeMirror(e, m), l.wysiwygFrame = p, l.code = m, l.placeholder = g, {
                        callButtons: a ? c.pluginCallButtons : null,
                        plugins: a || r ? c.plugins : null
                    }
                },
                _initElements: function(e, t, i, n, l) {
                    t.style.width = e.width, t.style.minWidth = e.minWidth, t.style.maxWidth = e.maxWidth, t.style.display = e.display, "string" == typeof e.position && (t.style.position = e.position), /inline/i.test(e.mode) ? (i.className += " se-toolbar-inline", i.style.width = e.toolbarWidth) : /balloon/i.test(e.mode) && (i.className += " se-toolbar-balloon", i.style.width = e.toolbarWidth, i.appendChild(n));
                    const o = document.createElement(e.iframe ? "IFRAME" : "DIV");
                    if (o.className = "se-wrapper-inner se-wrapper-wysiwyg", o.style.display = "block", e.iframe) {
                        const t = function() {
                            const t = e.iframeCSSFileName;
                            let i = "";
                            for (let e, n = 0, l = t.length; n < l; n++) {
                                if (e = [], /^https?:\/\//.test(t[n])) e.push(t[n]);
                                else {
                                    const i = new RegExp("(^|.*[\\/])" + t[n] + "(\\..+)?.css(?:\\?.*|;.*)?$", "i");
                                    for (let t, n = document.getElementsByTagName("link"), l = 0, o = n.length; l < o; l++) t = n[l].href.match(i), t && e.push(t[0])
                                }
                                if (!e || 0 === e.length) throw '[SUNEDITOR.constructor.iframe.fail] The suneditor CSS files installation path could not be automatically detected. Please set the option property "iframeCSSFileName" before creating editor instances.';
                                for (let t = 0, n = e.length; t < n; t++) i += '<link href="' + e[t] + '" rel="stylesheet">'
                            }
                            return i
                        }() + ("auto" === e.height ? "<style>\n/** Iframe height auto */\nbody{height: min-content; overflow: hidden;}\n</style>" : "");
                        o.allowFullscreen = !0, o.frameBorder = 0, o.addEventListener("load", (function() {
                            this.setAttribute("scrolling", "auto"), this.contentDocument.head.innerHTML = '<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1"><title></title>' + t, this.contentDocument.body.className = "sun-editor-editable", this.contentDocument.body.setAttribute("contenteditable", !0), this.contentDocument.body.innerHTML = l
                        }))
                    } else o.setAttribute("contenteditable", !0), o.setAttribute("scrolling", "auto"), o.className += " sun-editor-editable", o.innerHTML = l;
                    o.style.height = e.height, o.style.minHeight = e.minHeight, o.style.maxHeight = e.maxHeight;
                    const s = document.createElement("TEXTAREA");
                    s.className = "se-wrapper-inner se-wrapper-code", s.style.display = "none", s.style.height = e.height, s.style.minHeight = e.minHeight, s.style.maxHeight = e.maxHeight, "auto" === e.height && (s.style.overflow = "hidden");
                    let a = null,
                        r = null,
                        c = null;
                    if (e.resizingBar && (a = document.createElement("DIV"), a.className = "se-resizing-bar sun-editor-common", r = document.createElement("DIV"), r.className = "se-navigation sun-editor-common", a.appendChild(r), e.charCounter)) {
                        const t = document.createElement("DIV");
                        if (t.className = "se-char-counter-wrapper", c = document.createElement("SPAN"), c.className = "se-char-counter", c.textContent = "0", t.appendChild(c), e.maxCharCount > 0) {
                            const i = document.createElement("SPAN");
                            i.textContent = " / " + e.maxCharCount, t.appendChild(i)
                        }
                        a.appendChild(t)
                    }
                    let d = null;
                    return e.placeholder && (d = document.createElement("SPAN"), d.className = "se-placeholder", d.innerText = e.placeholder), {
                        bottomBar: {
                            resizingBar: a,
                            navigation: r,
                            charCounter: c
                        },
                        wysiwygFrame: o,
                        codeView: s,
                        placeholder: d
                    }
                },
                _initOptions: function(e, t) {
                    t.lang = t.lang || c.a, t.mode = t.mode || "classic", t.toolbarWidth = t.toolbarWidth ? u.isNumber(t.toolbarWidth) ? t.toolbarWidth + "px" : t.toolbarWidth : "auto", t.stickyToolbar = /balloon/i.test(t.mode) ? -1 : void 0 === t.stickyToolbar ? 0 : /^\d+/.test(t.stickyToolbar) ? u.getNumber(t.stickyToolbar, 0) : -1, t.iframe = t.fullPage || t.iframe, t.iframeCSSFileName = t.iframe ? "string" == typeof t.iframeCSSFileName ? [t.iframeCSSFileName] : t.iframeCSSFileName || ["suneditor"] : null, t.codeMirror = t.codeMirror ? t.codeMirror.src ? t.codeMirror : {
                        src: t.codeMirror
                    } : null, t.display = t.display || ("none" !== e.style.display && e.style.display ? e.style.display : "block"), t.popupDisplay = t.popupDisplay || "full", t.resizingBar = void 0 === t.resizingBar ? !/inline|balloon/i.test(t.mode) : t.resizingBar, t.showPathLabel = !!t.resizingBar && ("boolean" != typeof t.showPathLabel || t.showPathLabel), t.charCounter = t.maxCharCount > 0 || "boolean" == typeof t.charCounter && t.charCounter, t.maxCharCount = u.isNumber(t.maxCharCount) && t.maxCharCount > -1 ? 1 * t.maxCharCount : null, t.width = t.width ? u.isNumber(t.width) ? t.width + "px" : t.width : e.clientWidth ? e.clientWidth + "px" : "100%", t.minWidth = (u.isNumber(t.minWidth) ? t.minWidth + "px" : t.minWidth) || "", t.maxWidth = (u.isNumber(t.maxWidth) ? t.maxWidth + "px" : t.maxWidth) || "", t.height = t.height ? u.isNumber(t.height) ? t.height + "px" : t.height : e.clientHeight ? e.clientHeight + "px" : "auto", t.minHeight = (u.isNumber(t.minHeight) ? t.minHeight + "px" : t.minHeight) || "", t.maxHeight = (u.isNumber(t.maxHeight) ? t.maxHeight + "px" : t.maxHeight) || "", t.font = t.font ? t.font : null, t.fontSize = t.fontSize ? t.fontSize : null, t.formats = t.formats ? t.formats : null, t.colorList = t.colorList ? t.colorList : null, t.lineHeights = t.lineHeights ? t.lineHeights : null, t.paragraphStyles = t.paragraphStyles ? t.paragraphStyles : null, t.textStyles = t.textStyles ? t.textStyles : null, t.fontSizeUnit = "string" == typeof t.fontSizeUnit && t.fontSizeUnit.trim() || "px", t.imageResizing = void 0 === t.imageResizing || t.imageResizing, t.imageHeightShow = void 0 === t.imageHeightShow || !!t.imageHeightShow, t.imageWidth = t.imageWidth ? u.isNumber(t.imageWidth) ? t.imageWidth + "px" : t.imageWidth : "auto", t.imageSizeOnlyPercentage = !!t.imageSizeOnlyPercentage, t._imageSizeUnit = t.imageSizeOnlyPercentage ? "%" : "px", t.imageRotation = void 0 !== t.imageRotation ? t.imageRotation : !(t.imageSizeOnlyPercentage || !t.imageHeightShow), t.imageFileInput = void 0 === t.imageFileInput || t.imageFileInput, t.imageUrlInput = void 0 === t.imageUrlInput || !t.imageFileInput || t.imageUrlInput, t.imageUploadHeader = t.imageUploadHeader || null, t.imageUploadUrl = t.imageUploadUrl || null, t.imageUploadSizeLimit = /\d+/.test(t.imageUploadSizeLimit) ? u.getNumber(t.imageUploadSizeLimit, 0) : null, t.videoResizing = void 0 === t.videoResizing || t.videoResizing, t.videoHeightShow = void 0 === t.videoHeightShow || !!t.videoHeightShow, t.videoRatioShow = void 0 === t.videoRatioShow || !!t.videoRatioShow, t.videoWidth = t.videoWidth && u.getNumber(t.videoWidth) ? u.isNumber(t.videoWidth) ? t.videoWidth + "px" : t.videoWidth : "100%", t.videoSizeOnlyPercentage = !!t.videoSizeOnlyPercentage, t._videoSizeUnit = t.videoSizeOnlyPercentage ? "%" : "px", t.videoRotation = void 0 !== t.videoRotation ? t.videoRotation : !(t.videoSizeOnlyPercentage || !t.videoHeightShow), t.videoRatio = u.getNumber(t.videoRatio, 4) || .5625, t.videoRatioList = t.videoRatioList ? t.videoRatioList : null, t.youtubeQuery = (t.youtubeQuery || "").replace("?", ""), t.callBackSave = t.callBackSave ? t.callBackSave : null, t.templates = t.templates ? t.templates : null, t.placeholder = "string" == typeof t.placeholder ? t.placeholder : null, t.buttonList = t.buttonList || [
                        ["undo", "redo"],
                        ["bold", "underline", "italic", "strike", "subscript", "superscript"],
                        ["removeFormat"],
                        ["outdent", "indent"],
                        ["fullScreen", "showBlocks", "codeView"],
                        ["preview", "print"]
                    ]
                },
                _defaultButtons: function(e) {
                    return {
                        bold: ["_se_command_bold", e.toolbar.bold + " (CTRL+B)", "STRONG", "", '<i class="se-icon-bold"></i>'],
                        underline: ["_se_command_underline", e.toolbar.underline + " (CTRL+U)", "INS", "", '<i class="se-icon-underline"></i>'],
                        italic: ["_se_command_italic", e.toolbar.italic + " (CTRL+I)", "EM", "", '<i class="se-icon-italic"></i>'],
                        strike: ["_se_command_strike", e.toolbar.strike + " (CTRL+SHIFT+S)", "DEL", "", '<i class="se-icon-strokethrough"></i>'],
                        subscript: ["_se_command_subscript", e.toolbar.subscript, "SUB", "", '<i class="se-icon-subscript"></i>'],
                        superscript: ["_se_command_superscript", e.toolbar.superscript, "SUP", "", '<i class="se-icon-superscript"></i>'],
                        removeFormat: ["", e.toolbar.removeFormat, "removeFormat", "", '<i class="se-icon-erase"></i>'],
                        indent: ["", e.toolbar.indent + " (CTRL+])", "indent", "", '<i class="se-icon-indent-right"></i>'],
                        outdent: ["_se_command_outdent", e.toolbar.outdent + " (CTRL+[)", "outdent", "", '<i class="se-icon-indent-left"></i>', !0],
                        fullScreen: ["code-view-enabled", e.toolbar.fullScreen, "fullScreen", "", '<i class="se-icon-expansion"></i>'],
                        showBlocks: ["", e.toolbar.showBlocks, "showBlocks", "", '<i class="se-icon-showBlocks"></i>'],
                        codeView: ["code-view-enabled", e.toolbar.codeView, "codeView", "", '<i class="se-icon-code-view"></i>'],
                        undo: ["_se_command_undo", e.toolbar.undo + " (CTRL+Z)", "undo", "", '<i class="se-icon-undo"></i>', !0],
                        redo: ["_se_command_redo", e.toolbar.redo + " (CTRL+Y / CTRL+SHIFT+Z)", "redo", "", '<i class="se-icon-redo"></i>', !0],
                        preview: ["", e.toolbar.preview, "preview", "", '<i class="se-icon-preview"></i>'],
                        print: ["", e.toolbar.print, "print", "", '<i class="se-icon-print"></i>'],
                        save: ["_se_command_save", e.toolbar.save, "save", "", '<i class="se-icon-save"></i>', !0],
                        font: ["se-btn-select se-btn-tool-font _se_command_font_family", e.toolbar.font, "font", "submenu", '<span class="txt">' + e.toolbar.font + '</span><i class="se-icon-arrow-down"></i>'],
                        formatBlock: ["se-btn-select se-btn-tool-format", e.toolbar.formats, "formatBlock", "submenu", '<span class="txt _se_command_format">' + e.toolbar.formats + '</span><i class="se-icon-arrow-down"></i>'],
                        fontSize: ["se-btn-select se-btn-tool-size", e.toolbar.fontSize, "fontSize", "submenu", '<span class="txt _se_command_font_size">' + e.toolbar.fontSize + '</span><i class="se-icon-arrow-down"></i>'],
                        fontColor: ["", e.toolbar.fontColor, "fontColor", "submenu", '<i class="se-icon-fontColor"></i>'],
                        hiliteColor: ["", e.toolbar.hiliteColor, "hiliteColor", "submenu", '<i class="se-icon-hiliteColor"></i>'],
                        align: ["se-btn-align", e.toolbar.align, "align", "submenu", '<i class="se-icon-align-left _se_command_align"></i>'],
                        list: ["_se_command_list", e.toolbar.list, "list", "submenu", '<i class="se-icon-list-number"></i>'],
                        horizontalRule: ["btn_line", e.toolbar.horizontalRule, "horizontalRule", "submenu", '<i class="se-icon-hr"></i>'],
                        table: ["", e.toolbar.table, "table", "submenu", '<i class="se-icon-grid"></i>'],
                        lineHeight: ["", e.toolbar.lineHeight, "lineHeight", "submenu", '<i class="se-icon-line-height"></i>'],
                        template: ["", e.toolbar.template, "template", "submenu", '<i class="se-icon-template"></i>'],
                        paragraphStyle: ["", e.toolbar.paragraphStyle, "paragraphStyle", "submenu", '<i class="se-icon-paragraph-style"></i>'],
                        textStyle: ["", e.toolbar.textStyle, "textStyle", "submenu", '<i class="se-icon-text-style"></i>'],
                        link: ["", e.toolbar.link, "link", "dialog", '<i class="se-icon-link"></i>'],
                        image: ["", e.toolbar.image, "image", "dialog", '<i class="se-icon-image"></i>'],
                        video: ["", e.toolbar.video, "video", "dialog", '<i class="se-icon-video"></i>']
                    }
                },
                _createModuleGroup: function(e) {
                    const t = u.createElement("DIV");
                    t.className = "se-btn-module" + (e ? "" : " se-btn-module-border");
                    const i = u.createElement("UL");
                    return i.className = "se-menu-list", t.appendChild(i), {
                        div: t,
                        ul: i
                    }
                },
                _createButton: function(e, t, i, n, l, o) {
                    const s = u.createElement("LI"),
                        a = u.createElement("BUTTON");
                    return a.setAttribute("type", "button"), a.setAttribute("class", "se-btn" + (e ? " " + e : "") + " se-tooltip"), a.setAttribute("data-command", i), a.setAttribute("data-display", n), l += '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + t + "</span></span>", o && a.setAttribute("disabled", !0), a.innerHTML = l, s.appendChild(a), {
                        li: s,
                        button: a
                    }
                },
                _createToolBar: function(e, t, i, n) {
                    const l = e.createElement("DIV");
                    l.className = "se-toolbar-separator-vertical";
                    const o = e.createElement("DIV");
                    o.className = "se-toolbar sun-editor-common";
                    const s = this._defaultButtons(n),
                        a = {},
                        r = {};
                    if (i) {
                        const e = i.length ? i : Object.keys(i).map((function(e) {
                            return i[e]
                        }));
                        for (let t, i = 0, n = e.length; i < n; i++) t = e[i].default || e[i], r[t.name] = t
                    }
                    let c = null,
                        d = null,
                        u = null,
                        h = null,
                        p = "",
                        g = !1;
                    const m = 1 === t.length;
                    for (let i = 0; i < t.length; i++) {
                        const n = t[i];
                        if (u = this._createModuleGroup(m), "object" == typeof n) {
                            for (let e = 0; e < n.length; e++) d = n[e], "object" == typeof d ? "function" == typeof d.add ? (p = d.name, c = s[p], r[p] = d) : (p = d.name, c = [d.buttonClass, d.title, d.dataCommand, d.dataDisplay, d.innerHTML]) : (c = s[d], p = d), h = this._createButton(c[0], c[1], c[2], c[3], c[4], c[5]), u.ul.appendChild(h.li), r[p] && (a[p] = h.button);
                            g && o.appendChild(l.cloneNode(!1)), o.appendChild(u.div), g = !0
                        } else if (/^\/$/.test(n)) {
                            const t = e.createElement("DIV");
                            t.className = "se-btn-module-enter", o.appendChild(t), g = !1
                        }
                    }
                    const f = e.createElement("DIV");
                    return f.className = "se-toolbar-cover", o.appendChild(f), {
                        element: o,
                        plugins: r,
                        pluginCallButtons: a
                    }
                }
            };
        var p = function(e, t, i) {
                return {
                    element: {
                        originElement: e,
                        topArea: t._top,
                        relative: t._relative,
                        toolbar: t._toolBar,
                        resizingBar: t._resizingBar,
                        navigation: t._navigation,
                        charCounter: t._charCounter,
                        editorArea: t._editorArea,
                        wysiwygFrame: t._wysiwygArea,
                        wysiwyg: i.iframe ? t._wysiwygArea.contentDocument.body : t._wysiwygArea,
                        code: t._codeArea,
                        placeholder: t._placeholder,
                        loading: t._loading,
                        resizeBackground: t._resizeBack,
                        _stickyDummy: t._stickyDummy,
                        _arrow: t._arrow
                    },
                    tool: {
                        cover: t._toolBar.querySelector(".se-toolbar-cover"),
                        bold: t._toolBar.querySelector("._se_command_bold"),
                        underline: t._toolBar.querySelector("._se_command_underline"),
                        italic: t._toolBar.querySelector("._se_command_italic"),
                        strike: t._toolBar.querySelector("._se_command_strike"),
                        subscript: t._toolBar.querySelector("._se_command_subscript"),
                        superscript: t._toolBar.querySelector("._se_command_superscript"),
                        font: t._toolBar.querySelector("._se_command_font_family .txt"),
                        fontTooltip: t._toolBar.querySelector("._se_command_font_family .se-tooltip-text"),
                        format: t._toolBar.querySelector("._se_command_format"),
                        fontSize: t._toolBar.querySelector("._se_command_font_size"),
                        align: t._toolBar.querySelector("._se_command_align"),
                        list: t._toolBar.querySelector("._se_command_list"),
                        undo: t._toolBar.querySelector("._se_command_undo"),
                        redo: t._toolBar.querySelector("._se_command_redo"),
                        save: t._toolBar.querySelector("._se_command_save"),
                        outdent: t._toolBar.querySelector("._se_command_outdent")
                    },
                    option: i
                }
            },
            g = function(e, t, i, n, l) {
                const o = e.element.originElement.ownerDocument || document,
                    a = o.defaultView || window,
                    r = u,
                    c = {
                        _d: o,
                        _w: a,
                        context: e,
                        pluginCallButtons: t,
                        plugins: i || {},
                        util: r,
                        initPlugins: {},
                        lang: n,
                        submenu: null,
                        _resizingName: "",
                        _submenuName: "",
                        _bindedSubmenuOff: null,
                        submenuActiveButton: null,
                        controllerArray: [],
                        codeViewDisabledButtons: null,
                        history: null,
                        _bindControllersOff: null,
                        _isInline: null,
                        _isBalloon: null,
                        _inlineToolbarAttr: {
                            top: "",
                            width: "",
                            isShow: !1
                        },
                        _notHideToolbar: !1,
                        _sticky: !1,
                        _imagesInfoInit: !0,
                        _imagesInfoReset: !1,
                        _imageUpload: function(e, t, i, n, l) {
                            "function" == typeof g.onImageUpload && g.onImageUpload(e, 1 * t, i, n, l)
                        },
                        _imageUploadError: function(e, t) {
                            return "function" != typeof g.onImageUploadError || g.onImageUploadError(e, t)
                        },
                        commandMap: null,
                        _variable: {
                            isCodeView: !1,
                            isFullScreen: !1,
                            innerHeight_fullScreen: 0,
                            resizeClientY: 0,
                            tabSize: 4,
                            codeIndent: 4,
                            minResizingSize: r.getNumber(e.element.wysiwygFrame.style.minHeight || "65", 0),
                            currentNodes: [],
                            _range: null,
                            _selectionNode: null,
                            _originCssText: e.element.topArea.style.cssText,
                            _bodyOverflow: "",
                            _editorAreaOriginCssText: "",
                            _wysiwygOriginCssText: "",
                            _codeOriginCssText: "",
                            _fullScreenAttrs: {
                                sticky: !1,
                                balloon: !1,
                                inline: !1
                            },
                            _imagesInfo: [],
                            _imageIndex: 0,
                            _videosCnt: 0
                        },
                        callPlugin: function(e, i) {
                            if (!this.plugins[e]) throw Error('[SUNEDITOR.core.callPlugin.fail] The called plugin does not exist or is in an invalid format. (pluginName:"' + e + '")');
                            this.initPlugins[e] || (this.plugins[e].add(this, t[e]), this.initPlugins[e] = !0), "function" == typeof i && i()
                        },
                        addModule: function(e) {
                            for (let t, i = 0, n = e.length; i < n; i++) t = e[i].name, this.plugins[t] || (this.plugins[t] = e[i], "function" == typeof this.plugins[t].add && this.plugins[t].add(this))
                        },
                        submenuOn: function(e) {
                            this._bindedSubmenuOff && this._bindedSubmenuOff();
                            const t = this._submenuName = e.getAttribute("data-command");
                            this.submenu = e.nextElementSibling, this.submenu.style.display = "block", r.addClass(e, "on"), this.submenuActiveButton = e;
                            const i = this.context.element.toolbar.offsetWidth - (e.parentElement.offsetLeft + this.submenu.offsetWidth);
                            this.submenu.style.left = i < 0 ? i + "px" : "1px", this._bindedSubmenuOff = this.submenuOff.bind(this), this.addDocEvent("mousedown", this._bindedSubmenuOff, !1), this.plugins[t].on && this.plugins[t].on.call(this)
                        },
                        submenuOff: function() {
                            this.removeDocEvent("mousedown", this._bindedSubmenuOff), this._bindedSubmenuOff = null, this.submenu && (this._submenuName = "", this.submenu.style.display = "none", this.submenu = null, r.removeClass(this.submenuActiveButton, "on"), this.submenuActiveButton = null, this._notHideToolbar = !1), this.focus()
                        },
                        controllersOn: function() {
                            if (this._bindControllersOff) {
                                const e = this._resizingName;
                                this._bindControllersOff(), this._resizingName = e
                            }
                            for (let e = 0; e < arguments.length; e++) arguments[e].style && (arguments[e].style.display = "block"), this.controllerArray[e] = arguments[e];
                            this._notHideToolbar = !0, this._bindControllersOff = this.controllersOff.bind(this), this.addDocEvent("mousedown", this._bindControllersOff, !1), this.addDocEvent("keydown", this._bindControllersOff, !1)
                        },
                        controllersOff: function(e) {
                            if (this._resizingName && e && "keydown" === e.type && 27 !== e.keyCode) return;
                            if (this._notHideToolbar = !1, this._resizingName = "", !this._bindControllersOff) return;
                            this.removeDocEvent("mousedown", this._bindControllersOff), this.removeDocEvent("keydown", this._bindControllersOff), this._bindControllersOff = null;
                            const t = this.controllerArray.length;
                            if (t > 0) {
                                for (let e = 0; e < t; e++) "function" == typeof this.controllerArray[e] ? this.controllerArray[e]() : this.controllerArray[e].style.display = "none";
                                this.controllerArray = []
                            }
                        },
                        execCommand: function(e, t, i) {
                            this._wd.execCommand(e, t, "formatBlock" === e ? "<" + i + ">" : i), this.history.push(!0)
                        },
                        focus: function() {
                            if ("none" !== e.element.wysiwygFrame.style.display) {
                                try {
                                    const e = this.getRange();
                                    this.setRange(e.startContainer, e.startOffset, e.endContainer, e.endOffset)
                                } catch (t) {
                                    const i = r.getParentElement(this.getSelectionNode(), "figcaption");
                                    i ? i.focus() : e.element.wysiwyg.focus(), this._editorRange()
                                }
                                d._applyTagEffects()
                            }
                        },
                        focusEdge: function(e) {
                            if (r.isComponent(e)) {
                                const t = e.querySelector("IMG"),
                                    i = e.querySelector("IFRAME");
                                t ? this.selectComponent(t, "image") : i && this.selectComponent(i, "video")
                            } else e = r.getChildElement(e, (function(e) {
                                return 0 === e.childNodes.length || 3 === e.nodeType
                            }), !0), this.setRange(e, e.textContent.length, e, e.textContent.length)
                        },
                        setRange: function(e, t, i, n) {
                            if (!e || !i) return;
                            t > e.textContent.length && (t = e.textContent.length), n > i.textContent.length && (n = i.textContent.length);
                            const l = this._wd.createRange();
                            l.setStart(e, t), l.setEnd(i, n);
                            const o = this.getSelection();
                            o.removeAllRanges && o.removeAllRanges(), o.addRange(l), this._editorRange()
                        },
                        removeRange: function() {
                            this.getSelection().removeAllRanges();
                            const e = this.commandMap;
                            r.changeTxt(e.FORMAT, n.toolbar.formats), r.changeTxt(e.FONT, n.toolbar.font), r.changeTxt(e.FONT_TOOLTIP, n.toolbar.font), r.changeTxt(e.SIZE, n.toolbar.fontSize), r.removeClass(e.LI_ICON, "se-icon-list-bullets"), r.addClass(e.LI_ICON, "se-icon-list-number"), r.removeClass(e.LI, "active"), r.removeClass(e.STRONG, "active"), r.removeClass(e.INS, "active"), r.removeClass(e.EM, "active"), r.removeClass(e.DEL, "active"), r.removeClass(e.SUB, "active"), r.removeClass(e.SUP, "active"), e.OUTDENT && e.OUTDENT.setAttribute("disabled", !0), e.LI && e.LI.removeAttribute("data-focus"), e.ALIGN && (e.ALIGN.className = "se-icon-align-left", e.ALIGN.removeAttribute("data-focus"))
                        },
                        getRange: function() {
                            return this._variable._range || this._createDefaultRange()
                        },
                        getSelection: function() {
                            return this._ww.getSelection()
                        },
                        getSelectionNode: function() {
                            return this._variable._selectionNode && !r.isWysiwygDiv(this._variable._selectionNode) || this._editorRange(), this._variable._selectionNode || e.element.wysiwyg.firstChild
                        },
                        _editorRange: function() {
                            const e = this.getSelection();
                            let t = null,
                                i = null;
                            t = e.rangeCount > 0 ? e.getRangeAt(0) : this._createDefaultRange(), this._variable._range = t, i = t.collapsed ? t.commonAncestorContainer : e.extentNode || e.anchorNode, this._variable._selectionNode = i
                        },
                        _createDefaultRange: function() {
                            e.element.wysiwyg.focus();
                            const t = this._wd.createRange();
                            return e.element.wysiwyg.firstChild || this.execCommand("formatBlock", !1, "P"), t.setStart(e.element.wysiwyg.firstChild, 0), t.setEnd(e.element.wysiwyg.firstChild, 0), t
                        },
                        getSelectedElements: function(t) {
                            let i = this.getRange();
                            if (r.isWysiwygDiv(i.startContainer)) {
                                const t = e.element.wysiwyg.children;
                                if (0 === t.length) return null;
                                this.setRange(t[0], 0, t[t.length - 1], t[t.length - 1].textContent.trim().length), i = this.getRange()
                            }
                            const n = i.startContainer,
                                l = i.endContainer,
                                o = i.commonAncestorContainer,
                                s = r.getListChildren(o, (function(e) {
                                    return t ? t(e) : r.isFormatElement(e)
                                }));
                            if (r.isWysiwygDiv(o) || r.isRangeFormatElement(o) || s.unshift(r.getFormatElement(o)), n === l || 1 === s.length) return s;
                            let a = r.getFormatElement(n),
                                c = r.getFormatElement(l),
                                d = null,
                                u = null;
                            const h = function(e) {
                                    return !r.isTable(e) || /^TABLE$/i.test(e.nodeName)
                                },
                                p = r.getRangeFormatElement(a, h),
                                g = r.getRangeFormatElement(c, h),
                                m = p === g;
                            for (let e, t = 0, i = s.length; t < i; t++)
                                if (e = s[t], a === e || !m && e === p) d = t;
                                else if (c === e || !m && e === g) {
                                u = t;
                                break
                            }
                            return null === d && (d = 0), null === u && (u = s.length - 1), s.slice(d, u + 1)
                        },
                        getSelectedElementsAndComponents: function() {
                            const e = this.getRange().commonAncestorContainer,
                                t = r.getParentElement(e, r.isComponent);
                            return r.isTable(e) ? this.getSelectedElements() : this.getSelectedElements(function(e) {
                                const i = this.getParentElement(e, this.isComponent);
                                return this.isFormatElement(e) && (!i || i === t) || this.isComponent(e) && !this.getFormatElement(e)
                            }.bind(r))
                        },
                        isEdgePoint: function(e, t) {
                            return 0 === t || t === e.nodeValue.length
                        },
                        showLoading: function() {
                            e.element.loading.style.display = "block"
                        },
                        closeLoading: function() {
                            e.element.loading.style.display = "none"
                        },
                        appendFormatTag: function(e, t) {
                            const i = e,
                                n = r.getFormatElement(this.getSelectionNode()),
                                l = t || (r.isFormatElement(n) ? n.nodeName : "P"),
                                o = r.createElement(l);
                            return o.innerHTML = "<br>", r.isCell(i) ? i.insertBefore(o, e.nextElementSibling) : i.parentNode.insertBefore(o, i.nextElementSibling), o
                        },
                        insertComponent: function(e, t) {
                            let i = null;
                            const n = this.getSelectionNode(),
                                l = r.getFormatElement(n);
                            if (r.isListCell(l))
                                if (/^HR$/i.test(e.nodeName)) {
                                    const t = r.createElement("LI"),
                                        i = r.createTextNode(r.zeroWidthSpace);
                                    t.appendChild(e), t.appendChild(i), l.parentNode.insertBefore(t, l.nextElementSibling), this.setRange(i, 1, i, 1)
                                } else this.insertNode(e, n === l ? null : n), i = r.createElement("LI"), l.parentNode.insertBefore(i, l.nextElementSibling);
                            else this.insertNode(e, l), i = this.appendFormatTag(e);
                            return t || this.history.push(!1), i
                        },
                        selectComponent: function(e, t) {
                            if ("image" === t) {
                                if (!c.plugins.image) return;
                                c.removeRange(), c.callPlugin("image", (function() {
                                    const t = c.plugins.resizing.call_controller_resize.call(c, e, "image");
                                    c.plugins.image.onModifyMode.call(c, e, t), r.getParentElement(e, ".se-image-container") || (c.plugins.image.openModify.call(c, !0), c.plugins.image.update_image.call(c, !0, !0, !0))
                                }))
                            } else if ("video" === t) {
                                if (!c.plugins.video) return;
                                c.removeRange(), c.callPlugin("video", (function() {
                                    const t = c.plugins.resizing.call_controller_resize.call(c, e, "video");
                                    c.plugins.video.onModifyMode.call(c, e, t)
                                }))
                            }
                        },
                        insertNode: function(e, t) {
                            const i = this.getRange();
                            let n = null;
                            if (t) n = t.parentNode, t = t.nextElementSibling;
                            else {
                                const e = i.startContainer,
                                    l = i.startOffset,
                                    o = i.endContainer,
                                    s = i.endOffset,
                                    a = i.commonAncestorContainer;
                                if (n = e, 3 === e.nodeType && (n = e.parentNode), i.collapsed) 3 === a.nodeType ? t = a.splitText(s) : (null !== n.lastChild && r.isBreak(n.lastChild) && n.removeChild(n.lastChild), t = null);
                                else {
                                    if (e === o) {
                                        t = this.isEdgePoint(o, s) ? o.nextSibling : o.splitText(s);
                                        let i = e;
                                        this.isEdgePoint(e, l) || (i = e.splitText(l)), n.removeChild(i)
                                    } else
                                        for (this.removeNode(), n = a, t = o; t.parentNode !== a;) t = t.parentNode
                                }
                            }
                            try {
                                n.insertBefore(e, t)
                            } catch (t) {
                                n.appendChild(e)
                            } finally {
                                if (3 === e.nodeType) {
                                    const t = e.previousSibling,
                                        i = e.nextSibling,
                                        n = !t || r.onlyZeroWidthSpace(t) ? "" : t.textContent,
                                        l = !i || r.onlyZeroWidthSpace(i) ? "" : i.textContent;
                                    return t && (e.textContent = n + e.textContent, r.removeItem(t)), i && (e.textContent += l, r.removeItem(i)), {
                                        startOffset: n.length,
                                        endOffset: e.textContent.length - l.length
                                    }
                                }
                                this.history.push(!0)
                            }
                        },
                        removeNode: function() {
                            const e = this.getRange();
                            if (e.deleteContents) return e.deleteContents(), void this.history.push(!1);
                            const t = e.startContainer,
                                i = e.startOffset,
                                n = e.endContainer,
                                l = e.endOffset,
                                o = e.commonAncestorContainer;
                            let s = null,
                                a = null;
                            const c = r.getListChildNodes(o);
                            let d = r.getArrayIndex(c, t),
                                u = r.getArrayIndex(c, n);
                            for (let e = d + 1, n = t; e >= 0; e--) c[e] === n.parentNode && c[e].firstChild === n && 0 === i && (d = e, n = n.parentNode);
                            for (let e = u - 1, t = n; e > d; e--) c[e] === t.parentNode && 1 === c[e].nodeType && (c.splice(e, 1), t = t.parentNode, --u);
                            for (let e = d; e <= u; e++) {
                                const o = c[e];
                                0 === o.length || 3 === o.nodeType && void 0 === o.data ? r.removeItem(o) : o !== t ? o !== n ? (r.removeItem(o), this.history.push(!1)) : (a = 1 === n.nodeType ? r.createTextNode(n.textContent) : r.createTextNode(n.substringData(l, n.length - l)), a.length > 0 ? n.data = a.data : r.removeItem(n)) : (s = 1 === t.nodeType ? r.createTextNode(t.textContent) : r.createTextNode(t.substringData(0, i)), s.length > 0 ? t.data = s.data : r.removeItem(t))
                            }
                        },
                        applyRangeFormatElement: function(e) {
                            const t = this.getSelectedElementsAndComponents();
                            if (!t || 0 === t.length) return;
                            let i, n, l, o = t[t.length - 1];
                            i = r.isRangeFormatElement(o) || r.isFormatElement(o) ? o : r.getRangeFormatElement(o) || r.getFormatElement(o), r.isCell(i) ? (n = null, l = i) : (n = i.nextSibling, l = i.parentNode);
                            let s = r.getElementDepth(i),
                                a = null;
                            const c = [],
                                d = function(e, t, i) {
                                    let n = null;
                                    return e === t || r.isTable(t) || (n = r.removeItemAllParents(t)), n ? n.ec : i
                                };
                            for (let i, o, u, h, p = 0, g = t.length; p < g; p++)
                                if (i = t[p], o = i.parentNode, u = r.getElementDepth(i), r.isList(o)) {
                                    if (null === a && (a = r.createElement(o.nodeName)), a.innerHTML += i.outerHTML, c.push(i), p === g - 1 || !r.getParentElement(t[p + 1], (function(e) {
                                            return e === o
                                        }))) {
                                        const t = this.detachRangeFormatElement(o, c, null, !0, !0);
                                        s >= u ? (s = u, l = t.cc, n = d(l, o, t.ec), n && (l = n.parentNode)) : l === t.cc && (n = t.ec), l !== t.cc && (h = d(l, t.cc), void 0 !== h && (n = h)), e.appendChild(a), a = null
                                    }
                                } else s >= u && (s = u, l = o, n = i.nextSibling), e.appendChild(i), l !== o && (h = d(l, o), void 0 !== h && (n = h));
                            l.insertBefore(e, n), d(e, n), this.history.push(!1);
                            const u = r.getEdgeChildNodes(e.firstElementChild, e.lastElementChild);
                            t.length > 1 ? this.setRange(u.sc, 0, u.ec, u.ec.textContent.length) : this.setRange(u.ec, u.ec.textContent.length, u.ec, u.ec.textContent.length)
                        },
                        detachRangeFormatElement: function(e, t, i, n, l) {
                            const o = this.getRange(),
                                s = o.startOffset,
                                a = o.endOffset,
                                c = e.childNodes,
                                u = e.parentNode;
                            let h = null,
                                p = null,
                                g = e.cloneNode(!1);
                            const m = r.isList(i);
                            let f = !1;

                            function _(e, t, i) {
                                if (r.onlyZeroWidthSpace(t) && (t.innerHTML = r.zeroWidthSpace), 3 === t.nodeType) return e.insertBefore(t, i), t;
                                const n = t.childNodes;
                                let l = t.cloneNode(!1),
                                    o = null,
                                    s = null;
                                for (; n[0];) s = n[0], r.isIgnoreNodeChange(s) && !r.isListCell(l) ? (l.childNodes.length > 0 && (o || (o = l), e.insertBefore(l, i), l = t.cloneNode(!1)), e.insertBefore(s, i), o || (o = s)) : l.appendChild(s);
                                return l.childNodes.length > 0 && (e.insertBefore(l, i), o || (o = l)), o
                            }
                            for (let l, o = 0, s = c.length; o < s; o++)
                                if (l = c[o], n && 0 === o && (h = t && t.length !== s && t[0] !== l ? g : e.previousSibling), t && -1 === t.indexOf(l)) g || (g = e.cloneNode(!1)), l = l.cloneNode(!0), g.appendChild(l);
                                else {
                                    if (g && g.children.length > 0 && (u.insertBefore(g, e), g = null), !m && r.isListCell(l)) {
                                        const t = l;
                                        l = r.isCell(e.parentNode) ? r.createElement("DIV") : r.createElement("P"), l.innerHTML = t.innerHTML, r.copyFormatAttributes(l, t)
                                    } else l = l.cloneNode(!0);
                                    n || (i ? (f || (u.insertBefore(i, e), f = !0), l = _(i, l, null)) : l = _(u, l, e), t ? (p = l, h || (h = l)) : h || (h = p = l))
                                } const b = e.parentNode,
                                y = e.nextSibling;
                            g && g.children.length > 0 && b.insertBefore(g, y), r.removeItem(e);
                            const v = n ? {
                                cc: b,
                                sc: h,
                                ec: h && h.parentNode ? h.nextSibling : g && g.children.length > 0 ? g : y || null
                            } : r.getEdgeChildNodes(h, p);
                            if (l) return v;
                            !n && v && (t ? this.setRange(v.sc, s, v.ec, a) : this.setRange(v.sc, 0, v.sc, 0)), this.history.push(!1), d._applyTagEffects()
                        },
                        nodeChange: function(t, i, n, l) {
                            const o = this.getRange();
                            i = !!(i && i.length > 0) && i, n = !!(n && n.length > 0) && n;
                            const s = !t,
                                c = s && !n && !i;
                            let d, u, h, p = o.startContainer,
                                g = o.startOffset,
                                m = o.endContainer,
                                f = o.endOffset;
                            if (c && o.collapsed && r.isFormatElement(p.parentNode) && r.isFormatElement(m.parentNode)) return;
                            s && (t = r.createElement("DIV"));
                            const _ = t.nodeName;
                            if (!c && p === m && !n && t) {
                                let e = p,
                                    i = 0;
                                const n = [],
                                    l = t.style;
                                for (let e = 0, t = l.length; e < t; e++) n.push(l[e]);
                                const o = t.classList;
                                for (let e = 0, t = o.length; e < t; e++) n.push("." + o[e]);
                                if (n.length > 0) {
                                    for (; !r.isFormatElement(e) && !r.isWysiwygDiv(e);) {
                                        for (let l = 0; l < n.length; l++)
                                            if (1 === e.nodeType) {
                                                const o = n[l],
                                                    r = !!/^\./.test(o) && new a.RegExp("\\s*" + o.replace(/^\./, "") + "(\\s+|$)", "ig"),
                                                    c = s ? !!e.style[o] : !!e.style[o] && !!t.style[o] && e.style[o] === t.style[o],
                                                    d = !1 !== r && (s ? !!e.className.match(r) : !!e.className.match(r) && !!t.className.match(r));
                                                (c || d) && i++
                                            } e = e.parentNode
                                    }
                                    if (i >= n.length) return
                                }
                            }
                            if (d = r.isWysiwygDiv(p) ? e.element.wysiwyg.firstChild : p, u = g, r.isBreak(d) || 1 === d.nodeType && d.childNodes.length > 0) {
                                const e = r.isBreak(d);
                                if (!e) {
                                    for (; d && !r.isBreak(d) && 1 === d.nodeType;) d = d.childNodes[u] || d.nextElementSibling || d.nextSibling, u = 0;
                                    let e = r.getFormatElement(d);
                                    e === r.getRangeFormatElement(e) && (e = r.createElement(r.isCell(d) ? "DIV" : "P"), d.parentNode.insertBefore(e, d), e.appendChild(d))
                                }
                                if (r.isBreak(d)) {
                                    const t = r.createTextNode(r.zeroWidthSpace);
                                    d.parentNode.insertBefore(t, d), d = t, e && (p === m && (m = d, f = 1), r.removeItem(p))
                                }
                            }
                            if (p = d, g = u, d = r.isWysiwygDiv(m) ? e.element.wysiwyg.lastChild : m, u = f, r.isBreak(d) || 1 === d.nodeType && d.childNodes.length > 0) {
                                const e = r.isBreak(d);
                                if (!e) {
                                    for (; d && !r.isBreak(d) && 1 === d.nodeType;) h = d.childNodes, d = h[u > 0 ? u - 1 : u] || !/FIGURE/i.test(h[0].nodeName) ? h[0] : d.previousElementSibling || d.previousSibling || p, u = u > 0 ? d.textContent.length : u;
                                    let e = r.getFormatElement(d);
                                    e === r.getRangeFormatElement(e) && (e = r.createElement(r.isCell(e) ? "DIV" : "P"), d.parentNode.insertBefore(e, d), e.appendChild(d))
                                }
                                if (r.isBreak(d)) {
                                    const t = r.createTextNode(r.zeroWidthSpace);
                                    d.parentNode.insertBefore(t, d), d = t, u = 1, e && r.removeItem(m)
                                }
                            }
                            m = d, f = u, this.setRange(p, g, m, f);
                            let b, y = {},
                                v = {},
                                C = "",
                                x = "",
                                w = "";
                            if (i) {
                                for (let e, t = 0, n = i.length; t < n; t++) e = i[t], /^\./.test(e) ? x += (x ? "|" : "\\s*(?:") + e.replace(/^\./, "") : C += (C ? "|" : "(?:;|^|\\s)(?:") + e;
                                C && (C += ")\\s*:[^;]*\\s*(?:;|$)", C = new a.RegExp(C, "ig")), x && (x += ")(?=\\s+|$)", x = new a.RegExp(x, "ig"))
                            }
                            if (n) {
                                w = "^(?:" + n[0];
                                for (let e = 1; e < n.length; e++) w += "|" + n[e];
                                w += ")$", w = new a.RegExp(w, "i")
                            }
                            const S = {
                                    v: !1
                                },
                                N = function(e) {
                                    const t = e.cloneNode(!1);
                                    if (3 === t.nodeType || r.isBreak(t)) return t;
                                    if (c) return null;
                                    const i = !w && s || w && w.test(t.nodeName);
                                    if (i && !l) return S.v = !0, null;
                                    const n = t.style.cssText;
                                    let o = "";
                                    C && n.length > 0 && (o = n.replace(C, "").trim(), o !== n && (S.v = !0));
                                    const d = t.className;
                                    let u = "";
                                    return x && d.length > 0 && (u = d.replace(x, "").trim(), u !== d && (S.v = !0)), (!s || !x && d || !C && n || o || u || !i) && (o || u || t.nodeName !== _ || a.Boolean(C) !== a.Boolean(n) || a.Boolean(x) !== a.Boolean(d)) ? (C && n.length > 0 && (t.style.cssText = o), t.style.cssText || t.removeAttribute("style"), x && d.length > 0 && (t.className = u.trim()), t.className.trim() || t.removeAttribute("class"), t.style.cssText || t.className || t.nodeName !== _ && !i ? t : (S.v = !0, null)) : (S.v = !0, null)
                                },
                                E = this.getSelectedElements();
                            r.getFormatElement(p) || (p = r.getChildElement(E[0], (function(e) {
                                return 3 === e.nodeType
                            })), g = 0), r.getFormatElement(m) || (m = r.getChildElement(E[E.length - 1], (function(e) {
                                return 3 === e.nodeType
                            })), f = m.textContent.length);
                            const k = r.getFormatElement(p) === r.getFormatElement(m),
                                z = E.length - (k ? 0 : 1);
                            b = t.cloneNode(!1);
                            const T = c || s && function(e, t) {
                                    for (let i = 0, n = e.length; i < n; i++)
                                        if (t(e[i])) return !0;
                                    return !1
                                }(n, r.isAnchor),
                                A = this._util_getAnchor.bind(r, T),
                                L = this._util_isAnchor.bind(r, T);
                            if (k) {
                                const e = this._nodeChange_oneLine(E[0], b, N, p, g, m, f, c, s, o.collapsed, S, A, L);
                                y.container = e.startContainer, y.offset = e.startOffset, v.container = e.endContainer, v.offset = e.endOffset
                            } else {
                                y = this._nodeChange_startLine(E[0], b, N, p, g, c, s, S, A, L);
                                for (let e = 1; e < z; e++) b = t.cloneNode(!1), this._nodeChange_middleLine(E[e], b, N, c, s, S);
                                z > 0 ? (b = t.cloneNode(!1), v = this._nodeChange_endLine(E[z], b, N, m, f, c, s, S, A, L)) : v = y
                            }
                            this.controllersOff(), this.setRange(y.container, y.offset, v.container, v.offset), this.history.push(!1)
                        },
                        _stripRemoveNode: function(e) {
                            const t = e.parentNode;
                            if (!e || 3 === e.nodeType || !t) return;
                            const i = e.childNodes;
                            for (; i[0];) t.insertBefore(i[0], e);
                            t.removeChild(e)
                        },
                        _removeEmptyNode: function(e, t) {
                            const i = r.onlyZeroWidthSpace(t.textContent);
                            i && (t.textContent = " "), r.removeEmptyNode(e), i && (t.textContent = r.zeroWidthSpace)
                        },
                        _mergeSameTags: function(e, t, i) {
                            const n = this,
                                l = {
                                    a: 0,
                                    b: 0
                                };
                            return function e(o, s, a, r, c) {
                                const d = o.childNodes;
                                for (let u, h, p = 0, g = d.length; p < g && (u = d[p], h = d[p + 1], u); p++) {
                                    if (1 === g && o.nodeName === u.nodeName && (n.util.copyTagAttributes(u, o), o.parentNode.insertBefore(u, o), n.util.removeItem(o), t && t[s] === p && (t.splice(s, 1), t[s] = p), i && i[s] === p && (i.splice(s, 1), i[s] = p)), !h) {
                                        1 === u.nodeType && e(u, s + 1, p, r, c);
                                        break
                                    }
                                    if (u.nodeName === h.nodeName && n.util.isSameAttributes(u, h) && u.href === h.href) {
                                        const e = u.childNodes;
                                        let o = 0;
                                        for (let t = 0, i = e.length; t < i; t++) e[t].textContent.length > 0 && o++;
                                        const d = u.lastChild,
                                            g = h.firstChild,
                                            m = d && g && 3 === d.nodeType && 3 === g.nodeType;
                                        let f = d.textContent.length,
                                            _ = d.previousSibling;
                                        for (; _ && 3 === _.nodeType;) f += _.textContent.length, _ = _.previousSibling;
                                        o > 0 && d && g && 3 === d.nodeType && 3 === g.nodeType && (d.textContent.length > 0 || g.textContent.length > 0) && o--, r && t && t[s] > p && (s > 0 && t[s - 1] !== a ? r = !1 : (t[s] -= 1, t[s + 1] >= 0 && t[s] === p && (t[s + 1] += o, m && d && 3 === d.nodeType && g && 3 === g.nodeType && (l.a += f)))), c && i && i[s] > p && (s > 0 && i[s - 1] !== a ? c = !1 : (i[s] -= 1, i[s + 1] >= 0 && i[s] === p && (i[s + 1] += o, m && d && 3 === d.nodeType && g && 3 === g.nodeType && (l.b += f)))), 3 === u.nodeType ? u.textContent += h.textContent : u.innerHTML += h.innerHTML, n.util.removeItem(h), p--
                                    } else 1 === u.nodeType && e(u, s + 1, p, r, c)
                                }
                            }(e, 0, 0, !0, !0), l
                        },
                        _util_getAnchor: function(e, t) {
                            return t && !e ? this.getParentElement(t, function(e) {
                                return this.isAnchor(e)
                            }.bind(this)) : null
                        },
                        _util_isAnchor: function(e, t) {
                            return t && !e && 3 !== t.nodeType && this.isAnchor(t)
                        },
                        _nodeChange_oneLine: function(e, t, i, n, l, o, s, c, d, u, h, p, g) {
                            let m = n.parentNode;
                            for (; !(m.nextSibling || m.previousSibling || r.isFormatElement(m.parentNode) || r.isWysiwygDiv(m.parentNode)) && m.nodeName !== t.nodeName;) m = m.parentNode;
                            if (!d && m === o.parentNode && m.nodeName === t.nodeName && r.onlyZeroWidthSpace(n.textContent.slice(0, l)) && r.onlyZeroWidthSpace(o.textContent.slice(s))) {
                                const e = m.childNodes;
                                let i = !0;
                                for (let t, l, s, a, c = 0, d = e.length; c < d; c++)
                                    if (t = e[c], a = !r.onlyZeroWidthSpace(t), t !== n)
                                        if (t !== o) {
                                            if (!l && a || l && s && a) {
                                                i = !1;
                                                break
                                            }
                                        } else s = !0;
                                else l = !0;
                                if (i) return r.copyTagAttributes(m, t), {
                                    startContainer: n,
                                    startOffset: l,
                                    endContainer: o,
                                    endOffset: s
                                }
                            }
                            h.v = !1;
                            const f = e,
                                _ = [t],
                                b = e.cloneNode(!1),
                                y = n === o;
                            let v, C, x, w, S, N = n,
                                E = l,
                                k = o,
                                z = s,
                                T = !1,
                                A = !1;

                            function L(e) {
                                const t = new a.RegExp("(?:;|^|\\s)(?:" + w + "null)\\s*:[^;]*\\s*(?:;|$)", "ig");
                                let i = "";
                                return t && e.style.cssText.length > 0 && (i = t.test(e.style.cssText)), !i
                            }
                            if (function e(n, l) {
                                    const o = n.childNodes;
                                    for (let n, s = 0, a = o.length; s < a; s++) {
                                        let a = o[s];
                                        if (!a) continue;
                                        let d, h = l;
                                        if (!T && a === N) {
                                            let e = b;
                                            S = p(a);
                                            const o = r.createTextNode(1 === N.nodeType ? "" : N.substringData(0, E)),
                                                s = r.createTextNode(1 === N.nodeType ? "" : N.substringData(E, y && z >= E ? z - E : N.data.length - E));
                                            if (S) {
                                                const t = p(l);
                                                if (t && t.parentNode !== e) {
                                                    let i = t,
                                                        n = null;
                                                    for (; i.parentNode !== e;) {
                                                        for (l = n = i.parentNode.cloneNode(!1); i.childNodes[0];) n.appendChild(i.childNodes[0]);
                                                        i.appendChild(n), i = i.parentNode
                                                    }
                                                    i.parentNode.appendChild(t)
                                                }
                                                S = S.cloneNode(!1)
                                            }
                                            o.data.length > 0 && l.appendChild(o);
                                            const c = p(l);
                                            for (c && (S = c), S && (e = S), C = a, v = [], w = ""; C !== e && C !== f && null !== C;) n = g(C) ? null : i(C), n && 1 === C.nodeType && L(C) && (v.push(n), w += C.style.cssText.substr(0, C.style.cssText.indexOf(":")) + "|"), C = C.parentNode;
                                            const d = v.pop() || s;
                                            for (x = C = d; v.length > 0;) C = v.pop(), x.appendChild(C), x = C;
                                            if (t.appendChild(d), e.appendChild(t), S && !p(k) && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), N = s, E = 0, T = !0, C !== s && C.appendChild(N), !y) continue
                                        }
                                        if (A || a !== k) {
                                            if (T) {
                                                if (1 === a.nodeType && !r.isBreak(a)) {
                                                    !u && r.isIgnoreNodeChange(a) ? (t = t.cloneNode(!1), b.appendChild(a), b.appendChild(t), _.push(t), s--) : e(a, a);
                                                    continue
                                                }
                                                C = a, v = [], w = "";
                                                const o = [];
                                                for (; null !== C.parentNode && C !== f && C !== t;) n = A ? C.cloneNode(!1) : i(C), 1 === C.nodeType && !r.isBreak(a) && n && L(C) && (n && (g(n) ? S || o.push(n) : v.push(n)), w += C.style.cssText.substr(0, C.style.cssText.indexOf(":")) + "|"), C = C.parentNode;
                                                v = v.concat(o);
                                                const c = v.pop() || a;
                                                for (x = C = c; v.length > 0;) C = v.pop(), x.appendChild(C), x = C;
                                                if (g(t.parentNode) && !g(c) && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), A || S || !g(c)) c === a ? l = A ? b : t : A ? (b.appendChild(c), l = C) : (t.appendChild(c), l = C);
                                                else {
                                                    t = t.cloneNode(!1);
                                                    const e = c.childNodes;
                                                    for (let i = 0, n = e.length; i < n; i++) t.appendChild(e[i]);
                                                    c.appendChild(t), b.appendChild(c), _.push(t), l = t.children.length > 0 ? C : t
                                                }
                                                if (S && 3 === a.nodeType)
                                                    if (p(a)) {
                                                        const e = r.getParentElement(l, function(e) {
                                                            return this.isAnchor(e.parentNode) || e.parentNode === b
                                                        }.bind(r));
                                                        S.appendChild(e), t = e.cloneNode(!1), _.push(t), b.appendChild(t)
                                                    } else S = null
                                            }
                                            d = a.cloneNode(!1), l.appendChild(d), 1 !== a.nodeType || r.isBreak(a) || (h = d), e(a, h)
                                        } else {
                                            S = p(a);
                                            const e = r.createTextNode(1 === k.nodeType ? "" : k.substringData(z, k.length - z)),
                                                l = r.createTextNode(y || 1 === k.nodeType ? "" : k.substringData(0, z));
                                            if (S ? S = S.cloneNode(!1) : g(t.parentNode) && !S && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), e.data.length > 0) {
                                                C = a, w = "", v = [];
                                                const t = [];
                                                for (; C !== b && C !== f && null !== C;) 1 === C.nodeType && L(C) && (g(C) ? t.push(C.cloneNode(!1)) : v.push(C.cloneNode(!1)), w += C.style.cssText.substr(0, C.style.cssText.indexOf(":")) + "|"), C = C.parentNode;
                                                for (v = v.concat(t), d = x = C = v.pop() || e; v.length > 0;) C = v.pop(), x.appendChild(C), x = C;
                                                b.appendChild(d), C.textContent = e.data
                                            }
                                            if (S && d) {
                                                const e = p(d);
                                                e && (S = e)
                                            }
                                            for (C = a, v = [], w = ""; C !== b && C !== f && null !== C;) n = g(C) ? null : i(C), n && 1 === C.nodeType && L(C) && (v.push(n), w += C.style.cssText.substr(0, C.style.cssText.indexOf(":")) + "|"), C = C.parentNode;
                                            const o = v.pop() || l;
                                            for (x = C = o; v.length > 0;) C = v.pop(), x.appendChild(C), x = C;
                                            S ? ((t = t.cloneNode(!1)).appendChild(o), S.insertBefore(t, S.firstChild), b.appendChild(S), _.push(t), S = null) : t.appendChild(o), k = l, z = l.data.length, A = !0, !c && u && (t = l, l.textContent = r.zeroWidthSpace), C !== l && C.appendChild(k)
                                        }
                                    }
                                }(e, b), d && !c && !h.v) return {
                                startContainer: n,
                                startOffset: l,
                                endContainer: o,
                                endOffset: s
                            };
                            if (c = c && d)
                                for (let e = 0; e < _.length; e++) {
                                    let t = _[e],
                                        i = r.createTextNode(u ? r.zeroWidthSpace : t.textContent);
                                    b.insertBefore(i, t), b.removeChild(t), 0 === e && (N = k = i)
                                } else {
                                    if (d)
                                        for (let e = 0; e < _.length; e++) this._stripRemoveNode(_[e]);
                                    u && (N = k = t)
                                }
                            this._removeEmptyNode(b, t), u && (E = N.textContent.length, z = k.textContent.length);
                            const I = c || 0 === k.textContent.length;
                            0 === k.textContent.length && (r.removeItem(k), k = N), z = I ? k.textContent.length : z;
                            const B = {
                                    s: 0,
                                    e: 0
                                },
                                R = r.getNodePath(N, b, B),
                                D = !k.parentNode;
                            D && (k = N);
                            const M = {
                                    s: 0,
                                    e: 0
                                },
                                O = r.getNodePath(k, b, D || I ? null : M);
                            E += B.s, z = u ? E : D ? N.textContent.length : I ? z + B.s : z + M.s;
                            const P = this._mergeSameTags(b, R, O);
                            return e.innerHTML = b.innerHTML, N = r.getNodeFromPath(R, e), k = r.getNodeFromPath(O, e), {
                                startContainer: N,
                                startOffset: E + P.a,
                                endContainer: k,
                                endOffset: z + P.b
                            }
                        },
                        _nodeChange_startLine: function(e, t, i, n, l, o, s, a, c, d) {
                            let u = n.parentNode;
                            for (; !(u.nextSibling || u.previousSibling || r.isFormatElement(u.parentNode) || r.isWysiwygDiv(u.parentNode)) && u.nodeName !== t.nodeName;) u = u.parentNode;
                            if (!s && u.nodeName === t.nodeName && !r.isFormatElement(u) && !u.nextSibling && r.onlyZeroWidthSpace(n.textContent.slice(0, l))) {
                                let e = !0,
                                    i = n.previousSibling;
                                for (; i;) {
                                    if (!r.onlyZeroWidthSpace(i)) {
                                        e = !1;
                                        break
                                    }
                                    i = i.previousSibling
                                }
                                if (e) return r.copyTagAttributes(u, t), {
                                    container: n,
                                    offset: l
                                }
                            }
                            a.v = !1;
                            const h = e,
                                p = [t],
                                g = e.cloneNode(!1);
                            let m, f, _, b, y = n,
                                v = l,
                                C = !1;
                            if (function e(n, l) {
                                    const o = n.childNodes;
                                    for (let n, s = 0, a = o.length; s < a; s++) {
                                        const a = o[s];
                                        if (!a) continue;
                                        let u = l;
                                        if (C && !r.isBreak(a)) {
                                            if (1 === a.nodeType) {
                                                r.isIgnoreNodeChange(a) ? (t = t.cloneNode(!1), g.appendChild(a), g.appendChild(t), p.push(t), s--) : e(a, a);
                                                continue
                                            }
                                            f = a, m = [];
                                            const o = [];
                                            for (; null !== f.parentNode && f !== h && f !== t;) n = i(f), 1 === f.nodeType && n && (d(n) ? b || o.push(n) : m.push(n)), f = f.parentNode;
                                            m = m.concat(o);
                                            const u = m.length > 0,
                                                y = m.pop() || a;
                                            for (_ = f = y; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            if (d(t.parentNode) && !d(y) && (t = t.cloneNode(!1), g.appendChild(t), p.push(t)), !b && d(y)) {
                                                t = t.cloneNode(!1);
                                                const e = y.childNodes;
                                                for (let i = 0, n = e.length; i < n; i++) t.appendChild(e[i]);
                                                y.appendChild(t), g.appendChild(y), l = d(f) ? t : f, p.push(t)
                                            } else u ? (t.appendChild(y), l = f) : l = t;
                                            if (b && 3 === a.nodeType)
                                                if (c(a)) {
                                                    const e = r.getParentElement(l, function(e) {
                                                        return this.isAnchor(e.parentNode) || e.parentNode === g
                                                    }.bind(r));
                                                    b.appendChild(e), t = e.cloneNode(!1), p.push(t), g.appendChild(t)
                                                } else b = null
                                        }
                                        if (C || a !== y) n = C ? i(a) : a.cloneNode(!1), n && (l.appendChild(n), 1 !== a.nodeType || r.isBreak(a) || (u = n)), e(a, u);
                                        else {
                                            let e = g;
                                            b = c(a);
                                            const o = r.createTextNode(1 === y.nodeType ? "" : y.substringData(0, v)),
                                                s = r.createTextNode(1 === y.nodeType ? "" : y.substringData(v, y.length - v));
                                            if (b) {
                                                const t = c(l);
                                                if (t && t.parentNode !== e) {
                                                    let i = t,
                                                        n = null;
                                                    for (; i.parentNode !== e;) {
                                                        for (l = n = i.parentNode.cloneNode(!1); i.childNodes[0];) n.appendChild(i.childNodes[0]);
                                                        i.appendChild(n), i = i.parentNode
                                                    }
                                                    i.parentNode.appendChild(t)
                                                }
                                                b = b.cloneNode(!1)
                                            }
                                            o.data.length > 0 && l.appendChild(o);
                                            const d = c(l);
                                            for (d && (b = d), b && (e = b), f = l, m = []; f !== e && null !== f;) n = i(f), 1 === f.nodeType && n && m.push(n), f = f.parentNode;
                                            const u = m.pop() || l;
                                            for (_ = f = u; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            u !== l ? (t.appendChild(u), l = f) : l = t, r.isBreak(a) && t.appendChild(a.cloneNode(!1)), e.appendChild(t), y = s, v = 0, C = !0, l.appendChild(y)
                                        }
                                    }
                                }(e, g), s && !o && !a.v) return {
                                container: n,
                                offset: l
                            };
                            if (o = o && s)
                                for (let e = 0; e < p.length; e++) {
                                    let t = p[e],
                                        i = r.createTextNode(t.textContent);
                                    g.insertBefore(i, t), g.removeChild(t), 0 === e && (y = i)
                                } else if (s)
                                    for (let e = 0; e < p.length; e++) this._stripRemoveNode(p[e]);
                            if (o || 0 !== g.childNodes.length) {
                                this._removeEmptyNode(g, t), r.onlyZeroWidthSpace(g.textContent) && (y = g.firstChild, v = 0);
                                const i = {
                                        s: 0,
                                        e: 0
                                    },
                                    n = r.getNodePath(y, g, i);
                                v += i.s;
                                const l = this._mergeSameTags(g, n, null);
                                e.innerHTML = g.innerHTML, y = r.getNodeFromPath(n, e), v += l.a
                            } else e.childNodes ? y = e.childNodes[0] : (y = r.createTextNode(r.zeroWidthSpace), e.appendChild(y));
                            return {
                                container: y,
                                offset: v
                            }
                        },
                        _nodeChange_middleLine: function(e, t, i, n, l, o) {
                            if (!l) {
                                const i = e.cloneNode(!0),
                                    n = t.nodeName,
                                    l = t.style.cssText,
                                    o = t.className;
                                let s, a = i.childNodes,
                                    c = 0,
                                    d = a.length;
                                for (; c < d && (s = a[c], 3 !== s.nodeType); c++) {
                                    if (s.nodeName !== n) {
                                        if (1 === d) {
                                            a = s.childNodes, d = a.length, c = -1;
                                            continue
                                        }
                                        break
                                    }
                                    s.style.cssText += l, r.addClass(s, o)
                                }
                                if (d > 0 && c === d) return void(e.innerHTML = i.innerHTML)
                            }
                            o.v = !1;
                            const s = e.cloneNode(!1),
                                a = [t];
                            let c = !0;
                            if (function e(n, l) {
                                    const o = n.childNodes;
                                    for (let n, d = 0, u = o.length; d < u; d++) {
                                        let u = o[d];
                                        if (!u) continue;
                                        let h = l;
                                        r.isIgnoreNodeChange(u) ? (s.appendChild(t), t = t.cloneNode(!1), s.appendChild(u), s.appendChild(t), a.push(t), l = t, d--) : (n = i(u), n && (c = !1, l.appendChild(n), 1 !== u.nodeType || r.isBreak(u) || (h = n)), e(u, h))
                                    }
                                }(e.cloneNode(!0), t), !c && (!l || n || o.v)) {
                                if (s.appendChild(t), n && l)
                                    for (let e = 0; e < a.length; e++) {
                                        let t = a[e],
                                            i = r.createTextNode(t.textContent);
                                        s.insertBefore(i, t), s.removeChild(t)
                                    } else if (l)
                                        for (let e = 0; e < a.length; e++) this._stripRemoveNode(a[e]);
                                this._removeEmptyNode(s, t), this._mergeSameTags(s, null, null), e.innerHTML = s.innerHTML
                            }
                        },
                        _nodeChange_endLine: function(e, t, i, n, l, o, s, a, c, d) {
                            let u = n.parentNode;
                            for (; !(u.nextSibling || u.previousSibling || r.isFormatElement(u.parentNode) || r.isWysiwygDiv(u.parentNode)) && u.nodeName !== t.nodeName;) u = u.parentNode;
                            if (!s && u.nodeName === t.nodeName && !r.isFormatElement(u) && !u.previousSibling && r.onlyZeroWidthSpace(n.textContent.slice(l))) {
                                let e = !0,
                                    i = n.nextSibling;
                                for (; i;) {
                                    if (!r.onlyZeroWidthSpace(i)) {
                                        e = !1;
                                        break
                                    }
                                    i = i.nextSibling
                                }
                                if (e) return r.copyTagAttributes(u, t), {
                                    container: n,
                                    offset: l
                                }
                            }
                            a.v = !1;
                            const h = e,
                                p = [t],
                                g = e.cloneNode(!1);
                            let m, f, _, b, y = n,
                                v = l,
                                C = !1;
                            if (function e(n, l) {
                                    const o = n.childNodes;
                                    for (let n, s = o.length - 1; 0 <= s; s--) {
                                        const a = o[s];
                                        if (!a) continue;
                                        let u = l;
                                        if (C && !r.isBreak(a)) {
                                            if (1 === a.nodeType) {
                                                r.isIgnoreNodeChange(a) ? (t = t.cloneNode(!1), g.insertBefore(a, l), g.insertBefore(t, a), p.push(t), s--) : e(a, a);
                                                continue
                                            }
                                            f = a, m = [];
                                            const o = [];
                                            for (; null !== f.parentNode && f !== h && f !== t;) n = i(f), n && 1 === f.nodeType && (d(n) ? b || o.push(n) : m.push(n)), f = f.parentNode;
                                            m = m.concat(o);
                                            const u = m.length > 0,
                                                y = m.pop() || a;
                                            for (_ = f = y; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            if (d(t.parentNode) && !d(y) && (t = t.cloneNode(!1), g.insertBefore(t, g.firstChild), p.push(t)), !b && d(y)) {
                                                t = t.cloneNode(!1);
                                                const e = y.childNodes;
                                                for (let i = 0, n = e.length; i < n; i++) t.appendChild(e[i]);
                                                y.appendChild(t), g.insertBefore(y, g.firstChild), p.push(t), l = t.children.length > 0 ? f : t
                                            } else u ? (t.insertBefore(y, t.firstChild), l = f) : l = t;
                                            if (b && 3 === a.nodeType)
                                                if (c(a)) {
                                                    const e = r.getParentElement(l, function(e) {
                                                        return this.isAnchor(e.parentNode) || e.parentNode === g
                                                    }.bind(r));
                                                    b.appendChild(e), t = e.cloneNode(!1), p.push(t), g.insertBefore(t, g.firstChild)
                                                } else b = null
                                        }
                                        if (C || a !== y) n = C ? i(a) : a.cloneNode(!1), n && (l.insertBefore(n, l.firstChild), 1 !== a.nodeType || r.isBreak(a) || (u = n)), e(a, u);
                                        else {
                                            b = c(a);
                                            const e = r.createTextNode(1 === y.nodeType ? "" : y.substringData(v, y.length - v)),
                                                o = r.createTextNode(1 === y.nodeType ? "" : y.substringData(0, v));
                                            if (b) {
                                                b = b.cloneNode(!1);
                                                const e = c(l);
                                                if (e && e.parentNode !== g) {
                                                    let t = e,
                                                        i = null;
                                                    for (; t.parentNode !== g;) {
                                                        for (l = i = t.parentNode.cloneNode(!1); t.childNodes[0];) i.appendChild(t.childNodes[0]);
                                                        t.appendChild(i), t = t.parentNode
                                                    }
                                                    t.parentNode.insertBefore(e, t.parentNode.firstChild)
                                                }
                                                b = b.cloneNode(!1)
                                            } else d(t.parentNode) && !b && (t = t.cloneNode(!1), g.appendChild(t), p.push(t));
                                            for (e.data.length > 0 && l.insertBefore(e, l.firstChild), f = l, m = []; f !== g && null !== f;) n = d(f) ? null : i(f), n && 1 === f.nodeType && m.push(n), f = f.parentNode;
                                            const s = m.pop() || l;
                                            for (_ = f = s; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            s !== l ? (t.insertBefore(s, t.firstChild), l = f) : l = t, r.isBreak(a) && t.appendChild(a.cloneNode(!1)), b ? (b.insertBefore(t, b.firstChild), g.insertBefore(b, g.firstChild), b = null) : g.insertBefore(t, g.firstChild), y = o, v = o.data.length, C = !0, l.insertBefore(y, l.firstChild)
                                        }
                                    }
                                }(e, g), s && !o && !a.v) return {
                                container: n,
                                offset: l
                            };
                            if (o = o && s)
                                for (let e = 0; e < p.length; e++) {
                                    let t = p[e],
                                        i = r.createTextNode(t.textContent);
                                    g.insertBefore(i, t), g.removeChild(t), e === p.length - 1 && (y = i, v = i.textContent.length)
                                } else if (s)
                                    for (let e = 0; e < p.length; e++) this._stripRemoveNode(p[e]);
                            if (o || 0 !== g.childNodes.length) {
                                this._removeEmptyNode(g, t), r.onlyZeroWidthSpace(g.textContent) ? (y = g.firstChild, v = y.textContent.length) : r.onlyZeroWidthSpace(y) && (y = g, v = 0);
                                const i = {
                                        s: 0,
                                        e: 0
                                    },
                                    n = r.getNodePath(y, g, i);
                                v += i.s;
                                const l = this._mergeSameTags(g, n, null);
                                e.innerHTML = g.innerHTML, y = r.getNodeFromPath(n, e), v += l.a
                            } else e.childNodes ? y = e.childNodes[0] : (y = r.createTextNode(r.zeroWidthSpace), e.appendChild(y));
                            return {
                                container: y,
                                offset: v
                            }
                        },
                        commandHandler: function(t, i) {
                            switch (i) {
                                case "selectAll":
                                    const n = e.element.wysiwyg,
                                        l = r.getChildElement(n.firstChild, (function(e) {
                                            return 0 === e.childNodes.length || 3 === e.nodeType
                                        }), !1) || n.firstChild,
                                        o = r.getChildElement(n.lastChild, (function(e) {
                                            return 0 === e.childNodes.length || 3 === e.nodeType
                                        }), !0) || n.lastChild;
                                    this.setRange(l, 0, o, o.textContent.length), this.focus();
                                    break;
                                case "codeView":
                                    this.toggleCodeView(), r.toggleClass(t, "active");
                                    break;
                                case "fullScreen":
                                    this.toggleFullScreen(t), r.toggleClass(t, "active");
                                    break;
                                case "indent":
                                case "outdent":
                                    this.indent(i);
                                    break;
                                case "undo":
                                    this.history.undo();
                                    break;
                                case "redo":
                                    this.history.redo();
                                    break;
                                case "removeFormat":
                                    this.removeFormat(), this.focus();
                                    break;
                                case "print":
                                    this.print();
                                    break;
                                case "preview":
                                    this.preview();
                                    break;
                                case "showBlocks":
                                    this.toggleDisplayBlocks(), r.toggleClass(t, "active");
                                    break;
                                case "save":
                                    if ("function" == typeof e.option.callBackSave) e.option.callBackSave(this.getContents(!1));
                                    else {
                                        if ("function" != typeof g.save) throw Error("[SUNEDITOR.core.commandHandler.fail] Please register call back function in creation option. (callBackSave : Function)");
                                        g.save()
                                    }
                                    // e.tool.save && e.tool.save.setAttribute("disabled", !0);
                                    break;
                                default:
                                    const s = r.hasClass(this.commandMap[i], "active") ? null : r.createElement(i);
                                    let a = i;
                                    "SUB" === i && r.hasClass(this.commandMap.SUP, "active") ? a = "SUP" : "SUP" === i && r.hasClass(this.commandMap.SUB, "active") && (a = "SUB"), this.nodeChange(s, null, [a], !1), this.focus()
                            }
                        },
                        removeFormat: function() {
                            this.nodeChange(null, null, null, null)
                        },
                        indent: function(e) {
                            const t = this.getSelectedElements();
                            let i, n;
                            for (let l = 0, o = t.length; l < o; l++) i = t[l], n = /\d+/.test(i.style.marginLeft) ? r.getNumber(i.style.marginLeft, 0) : 0, "indent" === e ? n += 25 : n -= 25, i.style.marginLeft = (n < 0 ? 0 : n) + "px";
                            d._applyTagEffects(), this.history.push(!1)
                        },
                        toggleDisplayBlocks: function() {
                            r.toggleClass(e.element.wysiwyg, "se-show-block"), this._resourcesStateChange()
                        },
                        toggleCodeView: function() {
                            const t = this._variable.isCodeView,
                                i = this.codeViewDisabledButtons;
                            for (let e = 0, n = i.length; e < n; e++) i[e].disabled = !t;
                            this.controllersOff(), t ? (this._setCodeDataToEditor(), e.element.wysiwygFrame.scrollTop = 0, e.element.code.style.display = "none", e.element.wysiwygFrame.style.display = "block", this._variable._codeOriginCssText = this._variable._codeOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: none"), this._variable._wysiwygOriginCssText = this._variable._wysiwygOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: block"), "auto" !== e.option.height || e.option.codeMirrorEditor || (e.element.code.style.height = "0px"), this._variable.isCodeView = !1, this._variable.isFullScreen || (this._notHideToolbar = !1, /balloon/i.test(e.option.mode) && (e.element._arrow.style.display = "", this._isInline = !1, this._isBalloon = !0, d._hideToolbar())), this._resourcesStateChange(), this._checkComponents(), this.focus(), this.history.push(!1)) : (this._setEditorDataToCodeView(), this._variable._codeOriginCssText = this._variable._codeOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: block"), this._variable._wysiwygOriginCssText = this._variable._wysiwygOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: none"), "auto" !== e.option.height || e.option.codeMirrorEditor || (e.element.code.style.height = e.element.code.scrollHeight > 0 ? e.element.code.scrollHeight + "px" : "auto"), e.option.codeMirrorEditor && e.option.codeMirrorEditor.refresh(), this._variable.isCodeView = !0, this._variable.isFullScreen || (this._notHideToolbar = !0, this._isBalloon && (e.element._arrow.style.display = "none", e.element.toolbar.style.left = "", this._isInline = !0, this._isBalloon = !1, d._showToolbarInline())), this._variable._range = null, e.element.code.focus()), this._checkPlaceholder()
                        },
                        _setCodeDataToEditor: function() {
                            const t = this._getCodeView();
                            if (e.option.fullPage) {
                                const e = (new this._w.DOMParser).parseFromString(t, "text/html"),
                                    i = e.head.children;
                                for (let t = 0, n = i.length; t < n; t++) /script/i.test(i[t].tagName) && e.head.removeChild(i[t]);
                                this._wd.head.innerHTML = e.head.innerHTML, this._wd.body.innerHTML = r.convertContentsForEditor(e.body.innerHTML);
                                const n = e.body.attributes;
                                for (let e = 0, t = n.length; e < t; e++) "contenteditable" !== n[e].name && this._wd.body.setAttribute(n[e].name, n[e].value)
                            } else e.element.wysiwyg.innerHTML = t.length > 0 ? r.convertContentsForEditor(t) : "<p><br></p>"
                        },
                        _setEditorDataToCodeView: function() {
                            const t = r.convertHTMLForCodeView(e.element.wysiwyg, this._variable.codeIndent);
                            let i = "";
                            if (e.option.fullPage) {
                                const e = r.getAttributesToString(this._wd.body, null);
                                i = "<!DOCTYPE html>\n<html>\n" + this._wd.head.outerHTML.replace(/>(?!\n)/g, ">\n") + "<body " + e + ">\n" + t + "</body>\n</html>"
                            } else i = t;
                            e.element.code.style.display = "block", e.element.wysiwygFrame.style.display = "none", this._setCodeView(i)
                        },
                        toggleFullScreen: function(t) {
                            const i = e.element.topArea,
                                n = e.element.toolbar,
                                l = e.element.editorArea,
                                s = e.element.wysiwygFrame,
                                c = e.element.code,
                                u = this._variable;
                            u.isFullScreen ? (u.isFullScreen = !1, s.style.cssText = u._wysiwygOriginCssText, c.style.cssText = u._codeOriginCssText, n.style.cssText = "", l.style.cssText = u._editorAreaOriginCssText, i.style.cssText = u._originCssText, o.body.style.overflow = u._bodyOverflow, e.option.stickyToolbar > -1 && r.removeClass(n, "se-toolbar-sticky"), u._fullScreenAttrs.sticky && (u._fullScreenAttrs.sticky = !1, e.element._stickyDummy.style.display = "block", r.addClass(n, "se-toolbar-sticky")), this._isInline = u._fullScreenAttrs.inline, this._isBalloon = u._fullScreenAttrs.balloon, this._isInline && d._showToolbarInline(), d.onScroll_window(), r.removeClass(t.firstElementChild, "se-icon-reduction"), r.addClass(t.firstElementChild, "se-icon-expansion")) : (u.isFullScreen = !0, u._fullScreenAttrs.inline = this._isInline, u._fullScreenAttrs.balloon = this._isBalloon, (this._isInline || this._isBalloon) && (this._isInline = !1, this._isBalloon = !1), i.style.position = "fixed", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.zIndex = "2147483647", "" !== e.element._stickyDummy.style.display && (u._fullScreenAttrs.sticky = !0, e.element._stickyDummy.style.display = "none", r.removeClass(n, "se-toolbar-sticky")), u._bodyOverflow = o.body.style.overflow, o.body.style.overflow = "hidden", u._editorAreaOriginCssText = l.style.cssText, u._wysiwygOriginCssText = s.style.cssText, u._codeOriginCssText = c.style.cssText, l.style.cssText = n.style.cssText = "", s.style.cssText = (s.style.cssText.match(/\s?display(\s+)?:(\s+)?[a-zA-Z]+;/) || [""])[0], c.style.cssText = (c.style.cssText.match(/\s?display(\s+)?:(\s+)?[a-zA-Z]+;/) || [""])[0], n.style.width = s.style.height = c.style.height = "100%", n.style.position = "relative", n.style.display = "block", u.innerHeight_fullScreen = a.innerHeight - n.offsetHeight, l.style.height = u.innerHeight_fullScreen + "px", r.removeClass(t.firstElementChild, "se-icon-expansion"), r.addClass(t.firstElementChild, "se-icon-reduction"), e.option.iframe && "auto" === e.option.height && (l.style.overflow = "auto", this._iframeAutoHeight()))
                        },
                        print: function() {
                            const t = r.createElement("IFRAME");
                            t.style.display = "none", o.body.appendChild(t);
                            const i = r.getIframeDocument(t),
                                n = this.getContents(!0);
                            if (e.option.iframe) {
                                const t = r.getIframeDocument(e.element.wysiwygFrame),
                                    l = e.option.fullPage ? r.getAttributesToString(t.body, ["contenteditable"]) : 'class="sun-editor-editable"';
                                i.write("<!DOCTYPE html><html><head>" + t.head.innerHTML + "<style>" + r.getPageStyle(e.element.wysiwygFrame) + "</style></head><body " + l + ">" + n + "</body></html>")
                            } else {
                                const e = r.createElement("DIV"),
                                    t = r.createElement("STYLE");
                                t.innerHTML = r.getPageStyle(), e.className = "sun-editor-editable", e.innerHTML = n, i.head.appendChild(t), i.body.appendChild(e)
                            }
                            try {
                                if (t.focus(), -1 !== a.navigator.userAgent.indexOf("MSIE") || o.documentMode || a.StyleMedia) try {
                                    t.contentWindow.document.execCommand("print", !1, null)
                                } catch (e) {
                                    t.contentWindow.print()
                                } else t.contentWindow.print()
                            } catch (e) {
                                throw Error("[SUNEDITOR.core.print.fail] error: " + e)
                            } finally {
                                r.removeItem(t)
                            }
                        },
                        preview: function() {
                            const t = this.getContents(!0),
                                i = a.open("", "_blank");
                            if (i.mimeType = "text/html", e.option.iframe) {
                                const n = r.getIframeDocument(e.element.wysiwygFrame),
                                    l = e.option.fullPage ? r.getAttributesToString(n.body, ["contenteditable"]) : 'class="sun-editor-editable"';
                                i.document.write("<!DOCTYPE html><html><head>" + n.head.innerHTML + "<style>body {overflow: auto !important;}</style></head><body " + l + ">" + t + "</body></html>")
                            } else i.document.write('<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + n.toolbar.preview + "</title><style>" + r.getPageStyle() + '</style></head><body class="sun-editor-editable">' + t + "</body></html>")
                        },
                        setContents: function(t) {
                            const i = r.convertContentsForEditor(t);
                            if (c._variable.isCodeView) {
                                const e = r.convertHTMLForCodeView(i, c._variable.codeIndent);
                                c._setCodeView(e)
                            } else e.element.wysiwyg.innerHTML = i, c.history.push(!1)
                        },
                        getContents: function(t) {
                            const i = e.element.wysiwyg.innerHTML,
                                n = r.createElement("DIV");
                            n.innerHTML = i;
                            const l = r.getListChildren(n, (function(e) {
                                return /FIGCAPTION/i.test(e.nodeName)
                            }));
                            for (let e = 0, t = l.length; e < t; e++) l[e].removeAttribute("contenteditable");
                            if (e.option.fullPage && !t) {
                                const e = r.getAttributesToString(this._wd.body, ["contenteditable"]);
                                return "<!DOCTYPE html><html>" + this._wd.head.outerHTML + "<body " + e + ">" + n.innerHTML + "</body></html>"
                            }
                            return n.innerHTML
                        },
                        addDocEvent: function(t, i, n) {
                            o.addEventListener(t, i, n), e.option.iframe && this._wd.addEventListener(t, i)
                        },
                        removeDocEvent: function(t, i) {
                            o.removeEventListener(t, i), e.option.iframe && this._wd.removeEventListener(t, i)
                        },
                        _charCount: function(t, i) {
                            const n = e.element.charCounter;
                            if (!n) return !0;
                            (!t || t < 0) && (t = 0);
                            const l = e.option.maxCharCount;
                            if (a.setTimeout((function() {
                                    n.textContent = e.element.wysiwyg.textContent.length
                                })), l > 0) {
                                let o = !1;
                                const s = e.element.wysiwyg.textContent.length;
                                if (s > l) {
                                    c._editorRange();
                                    const e = c.getRange(),
                                        t = e.endOffset - 1,
                                        i = c.getSelectionNode().textContent;
                                    c.getSelectionNode().textContent = i.slice(0, e.endOffset - 1) + i.slice(e.endOffset, i.length), c.setRange(e.endContainer, t, e.endContainer, t), o = !0
                                } else s + t > l && (o = !0);
                                if (o) return i && !r.hasClass(n, "se-blink") && (r.addClass(n, "se-blink"), a.setTimeout((function() {
                                    r.removeClass(n, "se-blink")
                                }), 600)), !1
                            }
                            return !0
                        },
                        _checkComponents: function() {
                            this.plugins.image && (this.initPlugins.image ? this.plugins.image.checkImagesInfo.call(this) : this.callPlugin("image", this.plugins.image.checkImagesInfo.bind(this))), this.plugins.video && (this.initPlugins.video ? this.plugins.video.checkVideosInfo.call(this) : this.callPlugin("video", this.plugins.video.checkVideosInfo.bind(this)))
                        },
                        _setCodeView: function(t) {
                            e.option.codeMirrorEditor ? e.option.codeMirrorEditor.getDoc().setValue(t) : e.element.code.value = t
                        },
                        _getCodeView: function() {
                            return e.option.codeMirrorEditor ? e.option.codeMirrorEditor.getDoc().getValue() : e.element.code.value
                        },
                        _init: function(t) {
                            this._ww = e.option.iframe ? e.element.wysiwygFrame.contentWindow : a, this._wd = o, a.setTimeout(function() {
                                if (this._checkComponents(), this._imagesInfoInit = !1, this._imagesInfoReset = !1, this.history.reset(!0), l.iframe && (this._wd = e.element.wysiwygFrame.contentDocument, e.element.wysiwyg = this._wd.body, "auto" === l.height && (this._iframeAuto = this._wd.body), this._iframeAutoHeight()), "function" == typeof g.onload) return g.onload(c, t)
                            }.bind(this)), this.codeViewDisabledButtons = e.element.toolbar.querySelectorAll('.se-toolbar button:not([class~="code-view-enabled"])'), this._isInline = /inline/i.test(e.option.mode), this._isBalloon = /balloon/i.test(e.option.mode), this.commandMap = {
                                FORMAT: e.tool.format,
                                FONT: e.tool.font,
                                FONT_TOOLTIP: e.tool.fontTooltip,
                                SIZE: e.tool.fontSize,
                                ALIGN: e.tool.align,
                                LI: e.tool.list,
                                LI_ICON: e.tool.list && e.tool.list.querySelector("i"),
                                STRONG: e.tool.bold,
                                INS: e.tool.underline,
                                EM: e.tool.italic,
                                DEL: e.tool.strike,
                                SUB: e.tool.subscript,
                                SUP: e.tool.superscript,
                                OUTDENT: e.tool.outdent
                            }, this._variable._originCssText = e.element.topArea.style.cssText, this._placeholder = e.element.placeholder, this._checkPlaceholder(), this.history = function(e, t) {
                                const i = window,
                                    n = e.context.element,
                                    l = e.util,
                                    o = e.context.tool.undo,
                                    s = e.context.tool.redo;
                                let a = null,
                                    r = 0,
                                    c = [];

                                function d() {
                                    const i = c[r];
                                    n.wysiwyg.innerHTML = i.contents, e.setRange(l.getNodeFromPath(i.s.path, n.wysiwyg), i.s.offset, l.getNodeFromPath(i.e.path, n.wysiwyg), i.e.offset), e.focus(), 0 === r ? (o && o.setAttribute("disabled", !0), s && s.removeAttribute("disabled")) : r === c.length - 1 ? (o && o.removeAttribute("disabled"), s && s.setAttribute("disabled", !0)) : (o && o.removeAttribute("disabled"), s && s.removeAttribute("disabled")), e._checkComponents(), e._charCount(0, !1), e._resourcesStateChange(), t()
                                }

                                function u() {
                                    const i = e.getContents(!0);
                                    if (c[r] && i === c[r].contents) return;
                                    r++;
                                    const n = e.getRange();
                                    c.length > r && (c = c.slice(0, r), s && s.setAttribute("disabled", !0)), c[r] = {
                                        contents: i,
                                        s: {
                                            path: l.getNodePath(n.startContainer, null),
                                            offset: n.startOffset
                                        },
                                        e: {
                                            path: l.getNodePath(n.endContainer, null),
                                            offset: n.endOffset
                                        }
                                    }, 1 === r && o && o.removeAttribute("disabled"), e._checkComponents(), e._charCount(0, !1), t()
                                }
                                return {
                                    stack: c,
                                    push: function(t) {
                                        i.setTimeout(e._resourcesStateChange), t && !a || (i.clearTimeout(a), t) ? a = i.setTimeout((function() {
                                            i.clearTimeout(a), a = null, u()
                                        }), 500) : u()
                                    },
                                    undo: function() {
                                        r > 0 && (r--, d())
                                    },
                                    redo: function() {
                                        c.length - 1 > r && (r++, d())
                                    },
                                    go: function(e) {
                                        r = e < 0 ? c.length - 1 : e, d()
                                    },
                                    reset: function(i) {
                                        o && o.setAttribute("disabled", !0), s && s.setAttribute("disabled", !0), e.context.tool.save /*&& e.context.tool.save.setAttribute("disabled", !0)*/, c.splice(0), r = 0, c[r] = {
                                            contents: e.getContents(!0),
                                            s: {
                                                path: [0, 0],
                                                offset: 0
                                            },
                                            e: {
                                                path: [0, 0],
                                                offset: 0
                                            }
                                        }, i || t()
                                    }
                                }
                            }(this, d._onChange_historyStack)
                        },
                        _resourcesStateChange: function() {
                            c._iframeAutoHeight(), c._checkPlaceholder()
                        },
                        _iframeAutoHeight: function() {
                            this._iframeAuto && (e.element.wysiwygFrame.style.height = this._iframeAuto.offsetHeight + "px")
                        },
                        _checkPlaceholder: function() {
                            if (this._placeholder) {
                                if (this._variable.isCodeView) return void(this._placeholder.style.display = "none");
                                const t = e.element.wysiwyg;
                                !r.onlyZeroWidthSpace(t.textContent) || t.querySelector(".se-component, pre, blockquote, hr, li, table, img, iframe, video") || (t.innerText.match(/\n/g) || "").length > 1 ? this._placeholder.style.display = "none" : this._placeholder.style.display = "block"
                            }
                        }
                    },
                    d = {
                        _directionKeyCode: new a.RegExp("^(8|13|32|46|3[3-9]|40|46)$"),
                        _nonTextKeyCode: new a.RegExp("^(8|13|1[6-9]|20|27|3[3-9]|40|45|46|11[2-9]|12[0-3]|144|145)$"),
                        _historyIgnoreKeyCode: new a.RegExp("^(1[6-9]|20|27|3[3-9]|40|45|11[2-9]|12[0-3]|144|145)$"),
                        _onButtonsCheck: new a.RegExp("^(STRONG|INS|EM|DEL|SUB|SUP|LI)$"),
                        _frontZeroWidthReg: new a.RegExp(r.zeroWidthSpace + "+", ""),
                        _keyCodeShortcut: {
                            65: "A",
                            66: "B",
                            83: "S",
                            85: "U",
                            73: "I",
                            89: "Y",
                            90: "Z",
                            219: "[",
                            221: "]"
                        },
                        _shortcutCommand: function(e, t) {
                            let i = null;
                            switch (d._keyCodeShortcut[e]) {
                                case "A":
                                    i = "selectAll";
                                    break;
                                case "B":
                                    i = "STRONG";
                                    break;
                                case "S":
                                    t && (i = "DEL");
                                    break;
                                case "U":
                                    i = "INS";
                                    break;
                                case "I":
                                    i = "EM";
                                    break;
                                case "Z":
                                    i = t ? "redo" : "undo";
                                    break;
                                case "Y":
                                    i = "redo";
                                    break;
                                case "[":
                                    i = "outdent";
                                    break;
                                case "]":
                                    i = "indent"
                            }
                            return !!i && (c.commandHandler(c.commandMap[i], i), !0)
                        },
                        _applyTagEffects: function() {
                            const t = c.commandMap,
                                i = this._onButtonsCheck,
                                l = [],
                                o = [];
                            let s = !0,
                                a = !0,
                                d = !0,
                                u = !0,
                                h = !0,
                                p = !0,
                                g = !0,
                                m = "";
                            for (let f = c.getSelectionNode(); !r.isWysiwygDiv(f) && f; f = f.parentNode)
                                if (1 === f.nodeType && !r.isBreak(f))
                                    if (m = f.nodeName.toUpperCase(), o.push(m), r.isFormatElement(f)) {
                                        s && t.FORMAT && (l.push("FORMAT"), r.changeTxt(t.FORMAT, m), t.FORMAT.setAttribute("data-focus", m), s = !1);
                                        const e = f.style.textAlign;
                                        a && e && t.ALIGN && (l.push("ALIGN"), t.ALIGN.className = "se-icon-align-" + e, t.ALIGN.setAttribute("data-focus", e), a = !1), p && f.style.marginLeft && r.getNumber(f.style.marginLeft, 0) > 0 && t.OUTDENT && (l.push("OUTDENT"), t.OUTDENT.removeAttribute("disabled"), p = !1)
                                    } else {
                                        if (d && r.isList(m) && t.LI && (l.push("LI"), t.LI.setAttribute("data-focus", m), /UL/i.test(m) ? (r.removeClass(t.LI_ICON, "se-icon-list-number"), r.addClass(t.LI_ICON, "se-icon-list-bullets")) : (r.removeClass(t.LI_ICON, "se-icon-list-bullets"), r.addClass(t.LI_ICON, "se-icon-list-number")), d = !1), u && f.style.fontFamily.length > 0 && t.FONT) {
                                            l.push("FONT");
                                            const e = (f.style.fontFamily || f.face || n.toolbar.font).replace(/["']/g, "");
                                            r.changeTxt(t.FONT, e), r.changeTxt(t.FONT_TOOLTIP, e), u = !1
                                        }
                                        h && f.style.fontSize.length > 0 && t.SIZE && (l.push("SIZE"), r.changeTxt(t.SIZE, f.style.fontSize), h = !1), g && /^A$/.test(m) && null === f.getAttribute("data-image-link") && c.plugins.link ? (e.link && c.controllerArray[0] === e.link.linkBtn || c.callPlugin("link", (function() {
                                            c.plugins.link.call_controller_linkButton.call(c, f)
                                        })), g = !1) : g && e.link && c.controllerArray[0] === e.link.linkBtn && c.controllersOff(), i.test(m) && l.push(m)
                                    } for (let e = 0; e < l.length; e++) m = l[e], i.test(m) && r.addClass(t[m], "active");
                            for (let e in t) l.indexOf(e) > -1 || (t.FONT && /^FONT$/i.test(e) ? (r.changeTxt(t.FONT, n.toolbar.font), r.changeTxt(t.FONT_TOOLTIP, n.toolbar.font)) : t.SIZE && /^SIZE$/i.test(e) ? r.changeTxt(t.SIZE, n.toolbar.fontSize) : t.ALIGN && /^ALIGN$/i.test(e) ? (t.ALIGN.className = "se-icon-align-left", t.ALIGN.removeAttribute("data-focus")) : t.OUTDENT && /^OUTDENT$/i.test(e) ? t.OUTDENT.setAttribute("disabled", !0) : t.LI && r.isListCell(e) ? (t.LI.removeAttribute("data-focus"), r.removeClass(t.LI_ICON, "se-icon-list-bullets"), r.addClass(t.LI_ICON, "se-icon-list-number"), r.removeClass(t.LI, "active")) : r.removeClass(t[e], "active"));
                            c._variable.currentNodes = o.reverse(), e.option.showPathLabel && (e.element.navigation.textContent = c._variable.currentNodes.join(" > "))
                        },
                        _cancelCaptionEdit: function() {
                            this.setAttribute("contenteditable", !1), this.removeEventListener("blur", d._cancelCaptionEdit)
                        },
                        onMouseDown_toolbar: function(e) {
                            let t = e.target;
                            if (r.getParentElement(t, ".se-submenu")) e.stopPropagation(), c._notHideToolbar = !0;
                            else {
                                e.preventDefault();
                                let i = t.getAttribute("data-command"),
                                    n = t.className;
                                for (; !i && !/se-menu-list/.test(n) && !/se-toolbar/.test(n);) t = t.parentNode, i = t.getAttribute("data-command"), n = t.className;
                                i === c._submenuName && e.stopPropagation()
                            }
                        },
                        onClick_toolbar: function(e) {
                            e.preventDefault(), e.stopPropagation();
                            let t = e.target,
                                i = t.getAttribute("data-display"),
                                n = t.getAttribute("data-command"),
                                l = t.className;
                            for (; !n && !/se-menu-list/.test(l) && !/se-toolbar/.test(l);) t = t.parentNode, n = t.getAttribute("data-command"), i = t.getAttribute("data-display"), l = t.className;
                            if ((n || i) && !t.disabled) {
                                if (c.focus(), i) return !/submenu/.test(i) || null !== t.nextElementSibling && t === c.submenuActiveButton ? /dialog/.test(i) ? void c.callPlugin(n, (function() {
                                    c.plugins.dialog.open.call(c, n, !1)
                                })) : void c.submenuOff() : void c.callPlugin(n, (function() {
                                    c.submenuOn(t)
                                }));
                                n && c.commandHandler(t, n)
                            }
                        },
                        onMouseDown_wysiwyg: function(e) {
                            c._isBalloon && d._hideToolbar();
                            const t = r.getParentElement(e.target, r.isCell);
                            if (!t) return;
                            const i = c.plugins.table;
                            t === i._fixedCell || i._shift || c.callPlugin("table", (function() {
                                i.onTableCellMultiSelect.call(c, t, !1)
                            }))
                        },
                        onClick_wysiwyg: function(t) {
                            const i = t.target;
                            if ("false" === e.element.wysiwyg.getAttribute("contenteditable")) return;
                            if (t.stopPropagation(), /^FIGURE$/i.test(i.nodeName)) {
                                const e = i.querySelector("IMG"),
                                    n = i.querySelector("IFRAME");
                                if (e) return t.preventDefault(), void c.selectComponent(e, "image");
                                if (n) return t.preventDefault(), void c.selectComponent(n, "video")
                            }
                            const n = r.getParentElement(i, "FIGCAPTION");
                            if (n && (!n.getAttribute("contenteditable") || "false" === n.getAttribute("contenteditable")) && (t.preventDefault(), n.setAttribute("contenteditable", !0), n.focus(), c._isInline && !c._inlineToolbarAttr.isShow)) {
                                d._showToolbarInline();
                                const e = function() {
                                    d._hideToolbar(), n.removeEventListener("blur", e)
                                };
                                n.addEventListener("blur", e)
                            }
                            c._editorRange();
                            const l = c.getSelectionNode(),
                                o = r.getFormatElement(l),
                                s = r.getRangeFormatElement(l);
                            if (c.getRange().collapsed && (!o || o === s) && "false" !== i.getAttribute("contenteditable")) {
                                if (r.isList(s)) {
                                    const e = r.createElement("LI"),
                                        t = l.nextElementSibling;
                                    e.appendChild(l), s.insertBefore(e, t)
                                } else c.execCommand("formatBlock", !1, r.isRangeFormatElement(s) ? "DIV" : "P");
                                c.focus()
                            }
                            if (d._applyTagEffects(), c._isBalloon) {
                                const e = c.getRange();
                                e.collapsed ? d._hideToolbar() : d._showToolbarBalloon(e)
                            }
                            g.onClick && g.onClick(t)
                        },
                        _showToolbarBalloon: function(t) {
                            if (!c._isBalloon) return;
                            const i = t || c.getRange(),
                                n = e.element.toolbar,
                                l = c.getSelection();
                            let s;
                            if (l.focusNode === l.anchorNode) s = l.focusOffset < l.anchorOffset;
                            else {
                                const e = r.getListChildNodes(i.commonAncestorContainer);
                                s = r.getArrayIndex(e, l.focusNode) < r.getArrayIndex(e, l.anchorNode)
                            }
                            let u = i.getClientRects();
                            u = u[s ? 0 : u.length - 1];
                            const h = a.scrollX || o.documentElement.scrollLeft,
                                p = a.scrollY || o.documentElement.scrollTop,
                                g = e.element.topArea.offsetWidth,
                                m = d._getStickyOffsetTop();
                            let f = 0,
                                _ = e.element.topArea;
                            for (; _ && !/^(BODY|HTML)$/i.test(_.nodeName);) f += _.offsetLeft, _ = _.offsetParent;
                            n.style.visibility = "hidden", n.style.display = "block";
                            const b = a.Math.round(e.element._arrow.offsetWidth / 2),
                                y = n.offsetWidth,
                                v = n.offsetHeight,
                                C = /iframe/i.test(e.element.wysiwygFrame.nodeName) ? e.element.wysiwygFrame.getClientRects()[0] : null;
                            C && (u = {
                                left: u.left + C.left,
                                top: u.top + C.top,
                                right: u.right + C.right - C.width,
                                bottom: u.bottom + C.bottom - C.height
                            }), d._setToolbarOffset(s, u, n, f, g, h, p, m, b), y === n.offsetWidth && v === n.offsetHeight || d._setToolbarOffset(s, u, n, f, g, h, p, m, b), n.style.visibility = ""
                        },
                        _setToolbarOffset: function(t, i, n, l, o, s, c, d, u) {
                            const h = n.offsetWidth,
                                p = n.offsetHeight,
                                g = (t ? i.left : i.right) - l - h / 2 + s,
                                m = g + h - o,
                                f = (t ? i.top - p - u : i.bottom + u) - d + c;
                            let _ = g < 0 ? 1 : m < 0 ? g : g - m - 1 - 1;
                            n.style.left = a.Math.floor(_) + "px", n.style.top = a.Math.floor(f) + "px", t ? (r.removeClass(e.element._arrow, "se-arrow-up"), r.addClass(e.element._arrow, "se-arrow-down"), e.element._arrow.style.top = p + "px") : (r.removeClass(e.element._arrow, "se-arrow-down"), r.addClass(e.element._arrow, "se-arrow-up"), e.element._arrow.style.top = -u + "px");
                            const b = a.Math.floor(h / 2 + (g - _));
                            e.element._arrow.style.left = (b + u > n.offsetWidth ? n.offsetWidth - u : b < u ? u : b) + "px"
                        },
                        _showToolbarInline: function() {
                            if (!c._isInline) return;
                            const t = e.element.toolbar;
                            t.style.visibility = "hidden", t.style.display = "block", c._inlineToolbarAttr.width = t.style.width = e.option.toolbarWidth, c._inlineToolbarAttr.top = t.style.top = -1 - t.offsetHeight + "px", "function" == typeof g.showInline && g.showInline(t, e), d.onScroll_window(), c._inlineToolbarAttr.isShow = !0, t.style.visibility = ""
                        },
                        _hideToolbar: function() {
                            c._notHideToolbar || c._variable.isFullScreen || (e.element.toolbar.style.display = "none", c._inlineToolbarAttr.isShow = !1)
                        },
                        _onShortcutKey: !1,
                        onKeyDown_wysiwyg: function(t) {
                            const i = t.keyCode,
                                n = t.shiftKey,
                                l = t.ctrlKey || t.metaKey,
                                o = t.altKey;
                            if (d._directionKeyCode.test(i) || a.setTimeout(c._resourcesStateChange), c._isBalloon && d._hideToolbar(), l && d._shortcutCommand(i, n)) return d._onShortcutKey = !0, t.preventDefault(), t.stopPropagation(), !1;
                            d._onShortcutKey && (d._onShortcutKey = !1);
                            const s = c.getSelectionNode(),
                                u = c.getRange(),
                                h = !u.collapsed || u.startContainer !== u.endContainer,
                                p = c._resizingName;
                            let m = r.getFormatElement(s) || s,
                                f = r.getRangeFormatElement(s);
                            switch (i) {
                                case 8:
                                    if (h) break;
                                    if (p) {
                                        t.preventDefault(), t.stopPropagation(), c.plugins[p].destroy.call(c);
                                        break
                                    }
                                    if (r.isWysiwygDiv(s.parentNode) && !s.previousSibling && r.isFormatElement(s) && !r.isListCell(s)) {
                                        if (t.preventDefault(), t.stopPropagation(), s.innerHTML = "<br>", !s.nextElementSibling) {
                                            const e = s.attributes;
                                            for (; e[0];) s.removeAttribute(e[0].name);
                                            c.execCommand("formatBlock", !1, "P")
                                        }
                                        return !1
                                    }
                                    const i = u.commonAncestorContainer;
                                    if (0 === u.startOffset && 0 === u.endOffset) {
                                        if (f && m && !r.isCell(f) && !/^FIGCAPTION$/i.test(f.nodeName)) {
                                            let e = !0,
                                                n = i;
                                            for (; n && n !== f && !r.isWysiwygDiv(n);) {
                                                if (n.previousSibling) {
                                                    e = !1;
                                                    break
                                                }
                                                n = n.parentNode
                                            }
                                            if (e && f.parentNode) {
                                                t.preventDefault(), c.detachRangeFormatElement(f, r.isListCell(m) ? [m] : null, null, !1, !1);
                                                break
                                            }
                                        }
                                        if (r.isComponent(i.previousSibling) || 3 === i.nodeType && !i.previousSibling && 0 === u.startOffset && 0 === u.endOffset && r.isComponent(m.previousSibling)) {
                                            const e = m.previousSibling;
                                            r.removeItem(e)
                                        }
                                    }
                                    break;
                                case 46:
                                    if (p) {
                                        t.preventDefault(), t.stopPropagation(), c.plugins[p].destroy.call(c);
                                        break
                                    }
                                    if ((r.isFormatElement(s) || null === s.nextSibling) && u.startOffset === s.textContent.length) {
                                        let e = m.nextElementSibling;
                                        if (r.isComponent(e)) {
                                            t.preventDefault(), r.onlyZeroWidthSpace(m) && r.removeItem(m), (r.hasClass(e, "se-component") || /^IMG$/i.test(e.nodeName)) && (t.stopPropagation(), r.hasClass(e, "se-image-container") || /^IMG$/i.test(e.nodeName) ? (e = /^IMG$/i.test(e.nodeName) ? e : e.querySelector("img"), c.selectComponent(e, "image")) : r.hasClass(e, "se-video-container") && c.selectComponent(e.querySelector("iframe"), "video"));
                                            break
                                        }
                                    }
                                    break;
                                case 9:
                                    if (t.preventDefault(), l || o || r.isWysiwygDiv(s)) break;
                                    c.controllersOff();
                                    let d = s;
                                    for (; !r.isCell(d) && !r.isWysiwygDiv(d);) d = d.parentNode;
                                    if (d && r.isCell(d)) {
                                        const e = r.getParentElement(d, "table"),
                                            t = r.getListChildren(e, r.isCell);
                                        let i = n ? r.prevIdx(t, d) : r.nextIdx(t, d);
                                        i !== t.length || n || (i = 0), -1 === i && n && (i = t.length - 1);
                                        const l = t[i];
                                        if (!l) return !1;
                                        c.setRange(l, 0, l, 0);
                                        break
                                    }
                                    const g = c.getSelectedElements();
                                    if (n) {
                                        const e = g.length - 1;
                                        for (let t, i = 0; i <= e; i++) t = g[i].firstChild, t && (/^\s{1,4}$/.test(t.textContent) ? r.removeItem(t) : /^\s{1,4}/.test(t.textContent) && (t.textContent = t.textContent.replace(/^\s{1,4}/, "")));
                                        const t = r.getChildElement(g[0], "text", !1),
                                            i = r.getChildElement(g[e], "text", !0);
                                        t && i && c.setRange(t, 0, i, i.textContent.length)
                                    } else {
                                        const e = r.createTextNode(new a.Array(c._variable.tabSize + 1).join(" "));
                                        if (1 === g.length) {
                                            const t = c.insertNode(e);
                                            c.setRange(e, t.endOffset, e, t.endOffset)
                                        } else {
                                            const t = g.length - 1;
                                            for (let i, n = 0; n <= t; n++) i = g[n].firstChild, i && (r.isBreak(i) ? g[n].insertBefore(e.cloneNode(!1), i) : i.textContent = e.textContent + i.textContent);
                                            const i = r.getChildElement(g[0], "text", !1),
                                                n = r.getChildElement(g[t], "text", !0);
                                            i && n && c.setRange(i, 0, n, n.textContent.length)
                                        }
                                    }
                                    break;
                                case 13:
                                    if (h) break;
                                    const _ = r.getParentElement(f, "FIGCAPTION");
                                    if (f && m && !r.isCell(f) && !/^FIGCAPTION$/i.test(f.nodeName)) {
                                        if (!c.getRange().commonAncestorContainer.nextElementSibling && r.onlyZeroWidthSpace(m.innerText.trim())) {
                                            t.preventDefault();
                                            const e = c.appendFormatTag(f, r.isCell(f.parentNode) ? "DIV" : r.isListCell(m) ? "P" : null);
                                            r.copyFormatAttributes(e, m), r.removeItemAllParents(m), c.setRange(e, 1, e, 1);
                                            break
                                        }
                                    }
                                    if (f && _ && r.getParentElement(f, r.isList) && (t.preventDefault(), m = c.appendFormatTag(m), c.setRange(m, 0, m, 0)), p) {
                                        t.preventDefault(), t.stopPropagation();
                                        const i = e[p],
                                            n = i._container,
                                            l = n.previousElementSibling || n.nextElementSibling;
                                        let o = null;
                                        r.isListCell(n.parentNode) ? o = r.createElement("BR") : (o = r.createElement(r.isFormatElement(l) ? l.nodeName : "P"), o.innerHTML = "<br>"), n.parentNode.insertBefore(o, n), c.callPlugin(p, (function() {
                                            const e = c.plugins.resizing.call_controller_resize.call(c, i._element, p);
                                            c.plugins[p].onModifyMode.call(c, i._element, e)
                                        }))
                                    }
                            }
                            if (n && /16/.test(i)) {
                                t.preventDefault(), t.stopPropagation();
                                const e = c.plugins.table;
                                if (e && !e._shift && !e._ref) {
                                    const t = r.getParentElement(m, r.isCell);
                                    if (t) return void e.onTableCellMultiSelect.call(c, t, !0)
                                }
                            }
                            const _ = !(l || o || h || d._nonTextKeyCode.test(i));
                            if (!c._charCount(1, _) && _) return t.preventDefault(), t.stopPropagation(), !1;
                            g.onKeyDown && g.onKeyDown(t)
                        },
                        onKeyUp_wysiwyg: function(e) {
                            if (d._onShortcutKey) return;
                            c._editorRange();
                            const t = e.keyCode,
                                i = e.ctrlKey || e.metaKey || 91 === t || 92 === t,
                                n = e.altKey;
                            let l = c.getSelectionNode();
                            if (c._isBalloon && !c.getRange().collapsed) return void d._showToolbarBalloon();
                            if (8 === t && r.isWysiwygDiv(l) && "" === l.textContent) {
                                e.preventDefault(), e.stopPropagation(), l.innerHTML = "";
                                const t = r.createElement(r.isFormatElement(c._variable.currentNodes[0]) ? c._variable.currentNodes[0] : "P");
                                return t.innerHTML = "<br>", l.appendChild(t), c.setRange(t, 0, t, 0), d._applyTagEffects(), c._checkComponents(), void c.history.push(!1)
                            }
                            const o = r.getFormatElement(l),
                                s = r.getRangeFormatElement(l);
                            o && o !== s || (c.execCommand("formatBlock", !1, r.isRangeFormatElement(s) ? "DIV" : "P"), c.focus(), l = c.getSelectionNode()), d._directionKeyCode.test(t) && d._applyTagEffects(), c._checkComponents();
                            const a = !i && !n && !d._historyIgnoreKeyCode.test(t);
                            if (a && r.zeroWidthRegExp.test(l.textContent)) {
                                const e = c.getRange();
                                let t = e.startOffset,
                                    i = e.endOffset;
                                const n = (l.textContent.substring(0, i).match(d._frontZeroWidthReg) || "").length;
                                t = e.startOffset - n, i = e.endOffset - n, l.textContent = l.textContent.replace(r.zeroWidthRegExp, ""), c.setRange(l, t < 0 ? 0 : t, l, i < 0 ? 0 : i)
                            }
                            const u = !i && !n && !d._nonTextKeyCode.test(t);
                            if (!c._charCount(1, u) && 1 === e.key.length) return e.preventDefault(), e.stopPropagation(), !1;
                            a && c.history.push(!0), g.onKeyUp && g.onKeyUp(e)
                        },
                        onScroll_wysiwyg: function(e) {
                            c.controllersOff(), c._isBalloon && d._hideToolbar(), g.onScroll && g.onScroll(e)
                        },
                        onMouseDown_resizingBar: function(t) {
                            t.stopPropagation(), c._variable.resizeClientY = t.clientY, e.element.resizeBackground.style.display = "block", o.addEventListener("mousemove", d._resize_editor), o.addEventListener("mouseup", (function t() {
                                e.element.resizeBackground.style.display = "none", o.removeEventListener("mousemove", d._resize_editor), o.removeEventListener("mouseup", t)
                            }))
                        },
                        _resize_editor: function(t) {
                            const i = e.element.editorArea.offsetHeight + (t.clientY - c._variable.resizeClientY);
                            e.element.wysiwygFrame.style.height = e.element.code.style.height = (i < c._variable.minResizingSize ? c._variable.minResizingSize : i) + "px", c._variable.resizeClientY = t.clientY
                        },
                        onResize_window: function() {
                            if (c.controllersOff(), 0 !== e.element.toolbar.offsetWidth) return c._variable.isFullScreen ? (c._variable.innerHeight_fullScreen += a.innerHeight - e.element.toolbar.offsetHeight - c._variable.innerHeight_fullScreen, void(e.element.editorArea.style.height = c._variable.innerHeight_fullScreen + "px")) : void(c._variable.isCodeView && c._isInline ? d._showToolbarInline() : (c._iframeAutoHeight(), c._sticky && (e.element.toolbar.style.width = e.element.topArea.offsetWidth - 2 + "px", d.onScroll_window())))
                        },
                        onScroll_window: function() {
                            if (c._variable.isFullScreen || 0 === e.element.toolbar.offsetWidth || e.option.stickyToolbar < 0) return;
                            const t = e.element,
                                i = t.editorArea.offsetHeight,
                                n = (this.scrollY || o.documentElement.scrollTop) + e.option.stickyToolbar,
                                l = d._getStickyOffsetTop() - (c._isInline ? t.toolbar.offsetHeight : 0);
                            n < l ? d._offStickyToolbar() : n + c._variable.minResizingSize >= i + l ? (c._sticky || d._onStickyToolbar(), t.toolbar.style.top = i + l + e.option.stickyToolbar - n - c._variable.minResizingSize + "px") : n >= l && d._onStickyToolbar()
                        },
                        _getStickyOffsetTop: function() {
                            let t = e.element.topArea,
                                i = 0;
                            for (; t;) i += t.offsetTop, t = t.offsetParent;
                            return i
                        },
                        _onStickyToolbar: function() {
                            const t = e.element;
                            c._isInline || (t._stickyDummy.style.height = t.toolbar.offsetHeight + "px", t._stickyDummy.style.display = "block"), t.toolbar.style.top = e.option.stickyToolbar + "px", t.toolbar.style.width = c._isInline ? c._inlineToolbarAttr.width : t.toolbar.offsetWidth + "px", r.addClass(t.toolbar, "se-toolbar-sticky"), c._sticky = !0
                        },
                        _offStickyToolbar: function() {
                            const t = e.element;
                            t._stickyDummy.style.display = "none", t.toolbar.style.top = c._isInline ? c._inlineToolbarAttr.top : "", t.toolbar.style.width = c._isInline ? c._inlineToolbarAttr.width : "", t.editorArea.style.marginTop = "", r.removeClass(t.toolbar, "se-toolbar-sticky"), c._sticky = !1
                        },
                        _codeViewAutoHeight: function() {
                            e.element.code.style.height = e.element.code.scrollHeight + "px"
                        },
                        onPaste_wysiwyg: function(e) {
                            const t = e.clipboardData;
                            if (!t) return !0;
                            const i = c._charCount(t.getData("text/plain").length, !0),
                                n = r.cleanHTML(t.getData("text/html"));
                            return ("function" != typeof g.onPaste || g.onPaste(e, n, i)) && i ? void(n ? (e.stopPropagation(), e.preventDefault(), c.execCommand("insertHTML", !1, n)) : c.history.push(!0)) : (e.preventDefault(), e.stopPropagation(), !1)
                        },
                        onCut_wysiwyg: function() {
                            a.setTimeout((function() {
                                c._resourcesStateChange(), c._charCount(0, !1), c.history.push(!1)
                            }))
                        },
                        onDragOver_wysiwyg: function(e) {
                            e.preventDefault()
                        },
                        onDrop_wysiwyg: function(t) {
                            const i = t.dataTransfer;
                            if (!i) return !0;
                            const n = i.files;
                            if (n.length > 0 && c.plugins.image) d._setDropLocationSelection(t), c.callPlugin("image", (function() {
                                e.image.imgInputFile.files = n, c.plugins.image.onRender_imgInput.call(c), e.image.imgInputFile.files = null
                            }));
                            else {
                                if (!c._charCount(i.getData("text/plain").length, !0)) return t.preventDefault(), t.stopPropagation(), !1; {
                                    const e = r.cleanHTML(i.getData("text/html"));
                                    e && (d._setDropLocationSelection(t), c.execCommand("insertHTML", !1, e))
                                }
                            }
                            g.onDrop && g.onDrop(t)
                        },
                        _setDropLocationSelection: function(e) {
                            e.stopPropagation(), e.preventDefault();
                            const t = c.getRange();
                            c.setRange(t.startContainer, t.startOffset, t.endContainer, t.endOffset)
                        },
                        _onChange_historyStack: function() {
                            e.tool.save && e.tool.save.removeAttribute("disabled"), g.onChange && g.onChange(c.getContents(!0))
                        },
                        _addEvent: function() {
                            const t = l.iframe ? c._ww : e.element.wysiwyg;
                            e.element.toolbar.addEventListener("mousedown", d.onMouseDown_toolbar, !1), e.element.toolbar.addEventListener("click", d.onClick_toolbar, !1), t.addEventListener("click", d.onClick_wysiwyg, !1), t.addEventListener("keydown", d.onKeyDown_wysiwyg, !1), t.addEventListener("keyup", d.onKeyUp_wysiwyg, !1), t.addEventListener("paste", d.onPaste_wysiwyg, !1), t.addEventListener("cut", d.onCut_wysiwyg, !1), t.addEventListener("dragover", d.onDragOver_wysiwyg, !1), t.addEventListener("drop", d.onDrop_wysiwyg, !1), t.addEventListener("scroll", d.onScroll_wysiwyg, !1), (c._isBalloon || c.plugins.table) && t.addEventListener("mousedown", d.onMouseDown_wysiwyg, !1), c.plugins.table && t.addEventListener("touchstart", d.onMouseDown_wysiwyg, {
                                passive: !0,
                                useCapture: !1
                            }), "auto" !== e.option.height || e.option.codeMirrorEditor || (e.element.code.addEventListener("keydown", d._codeViewAutoHeight, !1), e.element.code.addEventListener("keyup", d._codeViewAutoHeight, !1), e.element.code.addEventListener("paste", d._codeViewAutoHeight, !1)), e.element.resizingBar && (/\d+/.test(e.option.height) ? e.element.resizingBar.addEventListener("mousedown", d.onMouseDown_resizingBar, !1) : r.addClass(e.element.resizingBar, "se-resizing-none")), c._isInline && t.addEventListener("focus", d._showToolbarInline, !1), (c._isInline || c._isBalloon) && t.addEventListener("blur", d._hideToolbar, !1), a.removeEventListener("resize", d.onResize_window), a.removeEventListener("scroll", d.onScroll_window), a.addEventListener("resize", d.onResize_window, !1), e.option.stickyToolbar > -1 && a.addEventListener("scroll", d.onScroll_window, !1)
                        },
                        _removeEvent: function() {
                            const t = l.iframe ? c._ww : e.element.wysiwyg;
                            e.element.toolbar.removeEventListener("mousedown", d.onMouseDown_toolbar), e.element.toolbar.removeEventListener("click", d.onClick_toolbar), t.removeEventListener("click", d.onClick_wysiwyg), t.removeEventListener("keydown", d.onKeyDown_wysiwyg), t.removeEventListener("keyup", d.onKeyUp_wysiwyg), t.removeEventListener("paste", d.onPaste_wysiwyg), t.removeEventListener("cut", d.onCut_wysiwyg), t.removeEventListener("dragover", d.onDragOver_wysiwyg), t.removeEventListener("drop", d.onDrop_wysiwyg), t.removeEventListener("scroll", d.onScroll_wysiwyg), t.removeEventListener("mousedown", d.onMouseDown_wysiwyg), t.removeEventListener("touchstart", d.onMouseDown_wysiwyg, {
                                passive: !0,
                                useCapture: !1
                            }), t.removeEventListener("focus", d._showToolbarInline), t.removeEventListener("blur", d._hideToolbar), e.element.code.removeEventListener("keydown", d._codeViewAutoHeight), e.element.code.removeEventListener("keyup", d._codeViewAutoHeight), e.element.code.removeEventListener("paste", d._codeViewAutoHeight), e.element.resizingBar && e.element.resizingBar.removeEventListener("mousedown", d.onMouseDown_resizingBar), a.removeEventListener("resize", d.onResize_window), a.removeEventListener("scroll", d.onScroll_window)
                        }
                    },
                    g = {
                        core: c,
                        util: r,
                        onload: null,
                        onScroll: null,
                        onClick: null,
                        onKeyDown: null,
                        onKeyUp: null,
                        onDrop: null,
                        onChange: null,
                        onPaste: null,
                        showInline: null,
                        onImageUpload: null,
                        onImageUploadError: null,
                        setOptions: function(o) {
                            d._removeEvent(), c.plugins = o.plugins || c.plugins;
                            const s = [e.option, o].reduce((function(e, t) {
                                    return Object.keys(t).forEach((function(i) {
                                        e[i] = t[i]
                                    })), e
                                }), {}),
                                a = h._setOptions(s, e, c.plugins, e.option);
                            a.callButtons && (t = a.callButtons, c.initPlugins = {}), a.plugins && (c.plugins = i = a.plugins);
                            const r = e.element,
                                u = {
                                    _top: r.topArea,
                                    _relative: r.relative,
                                    _toolBar: r.toolbar,
                                    _editorArea: r.editorArea,
                                    _wysiwygArea: r.wysiwygFrame,
                                    _codeArea: r.code,
                                    _placeholder: r.placeholder,
                                    _resizingBar: r.resizingBar,
                                    _navigation: r.navigation,
                                    _charCounter: r.charCounter,
                                    _loading: r.loading,
                                    _resizeBack: r.resizeBackground,
                                    _stickyDummy: r._stickyDummy,
                                    _arrow: r._arrow
                                };
                            l = s, c.lang = n = l.lang, c.context = e = p(e.element.originElement, u, l), c._imagesInfoReset = !0, c._init(!0), d._addEvent(), c._charCount(0, !1), d._offStickyToolbar(), d.onResize_window(), c.focus()
                        },
                        noticeOpen: function(e) {
                            c.addModule([s]), s.open.call(c, e)
                        },
                        noticeClose: function() {
                            c.addModule([s]), s.close.call(c)
                        },
                        save: function() {
                            e.element.originElement.value = c.getContents(!1)
                        },
                        getContext: function() {
                            return e
                        },
                        getContents: function(e) {
                            return c.getContents(e)
                        },
                        getImagesInfo: function() {
                            return c._variable._imagesInfo
                        },
                        insertImage: function(e) {
                            c.plugins.image && e && (c.initPlugins.image ? c.plugins.image.submitAction.call(c, e) : c.callPlugin("image", c.plugins.image.submitAction.bind(c, e)), c.focus())
                        },
                        insertHTML: function(e) {
                            if (!e.nodeType || 1 !== e.nodeType) {
                                const t = r.createElement("DIV");
                                t.innerHTML = e, e = t.firstChild || t.content.firstChild
                            }
                            let t = null;
                            (r.isFormatElement(e) || /^(IMG|IFRAME)$/i.test(e.nodeName)) && (t = r.getFormatElement(c.getSelectionNode())), r.isComponent(e) ? c.insertComponent(e, !1) : c.insertNode(e, t), c.focus()
                        },
                        setContents: function(e) {
                            c.setContents(e)
                        },
                        appendContents: function(t) {
                            const i = r.convertContentsForEditor(t);
                            c._variable.isCodeView ? c._setCodeView(c._getCodeView() + "\n" + r.convertHTMLForCodeView(i, c._variable.codeIndent)) : e.element.wysiwyg.innerHTML += i, c.history.push(!1)
                        },
                        disabled: function() {
                            e.tool.cover.style.display = "block", e.element.wysiwyg.setAttribute("contenteditable", !1), e.option.codeMirrorEditor ? e.option.codeMirrorEditor.setOption("readOnly", !0) : e.element.code.setAttribute("disabled", "disabled")
                        },
                        enabled: function() {
                            e.tool.cover.style.display = "none", e.element.wysiwyg.setAttribute("contenteditable", !0), e.option.codeMirrorEditor ? e.option.codeMirrorEditor.setOption("readOnly", !1) : e.element.code.removeAttribute("disabled")
                        },
                        show: function() {
                            const t = e.element.topArea.style;
                            "none" === t.display && (t.display = e.option.display)
                        },
                        hide: function() {
                            e.element.topArea.style.display = "none"
                        },
                        destroy: function() {
                            d._removeEvent(), r.removeItem(e.element.topArea), a.Object.keys(c).forEach((function(e) {
                                delete c[e]
                            })), a.Object.keys(d).forEach((function(e) {
                                delete d[e]
                            })), a.Object.keys(e).forEach((function(t) {
                                delete e[t]
                            })), a.Object.keys(t).forEach((function(e) {
                                delete t[e]
                            })), a.Object.keys(this).forEach(function(e) {
                                delete this[e]
                            }.bind(this))
                        },
                        toolbar: {
                            disabled: function() {
                                e.tool.cover.style.display = "block"
                            },
                            enabled: function() {
                                e.tool.cover.style.display = "none"
                            },
                            show: function() {
                                c._isInline ? d._showToolbarInline() : (e.element.toolbar.style.display = "", e.element._stickyDummy.style.display = "")
                            },
                            hide: function() {
                                c._isInline ? d._hideToolbar() : (e.element.toolbar.style.display = "none", e.element._stickyDummy.style.display = "none")
                            }
                        }
                    };
                return c._init(!1), d._addEvent(), c._charCount(0, !1), g
            },
            m = {
                init: function(e) {
                    return {
                        create: function(t, i) {
                            return this.create(t, i, e)
                        }.bind(this)
                    }
                },
                create: function(e, t, i) {
                    "object" != typeof t && (t = {}), i && (t = [i, t].reduce((function(e, t) {
                        return Object.keys(t).forEach((function(i) {
                            if ("plugins" === i && t[i] && e[i]) {
                                let n = e[i],
                                    l = t[i];
                                n = n.length ? n : Object.keys(n).map((function(e) {
                                    return n[e]
                                })), l = l.length ? l : Object.keys(l).map((function(e) {
                                    return l[e]
                                })), e[i] = l.filter((function(e) {
                                    return -1 === n.indexOf(e)
                                })).concat(n)
                            } else e[i] = t[i]
                        })), e
                    }), {}));
                    const n = "string" == typeof e ? document.getElementById(e) : e;
                    if (!n) {
                        if ("string" == typeof e) throw Error('[SUNEDITOR.create.fail] The element for that id was not found (ID:"' + e + '")');
                        throw Error("[SUNEDITOR.create.fail] suneditor requires textarea's element or id value")
                    }
                    const l = h.init(n, t);
                    if (l.constructed._top.id && document.getElementById(l.constructed._top.id)) throw Error('[SUNEDITOR.create.fail] The ID of the suneditor you are trying to create already exists (ID:"' + l.constructed._top.id + '")');
                    return n.style.display = "none", l.constructed._top.style.display = "block", "object" == typeof n.nextElementSibling ? n.parentNode.insertBefore(l.constructed._top, n.nextElementSibling) : n.parentNode.appendChild(l.constructed._top), g(p(n, l.constructed, l.options), l.pluginCallButtons, l.plugins, l.options.lang, t)
                }
            };
        window.SUNEDITOR = m.init({
            plugins: a
        })
    }
});