! function(e) {
    var t = {};

    function n(i) {
        if (t[i]) return t[i].exports;
        var l = t[i] = {
            i: i,
            l: !1,
            exports: {}
        };
        return e[i].call(l.exports, l, l.exports, n), l.l = !0, l.exports
    }
    n.m = e, n.c = t, n.d = function(e, t, i) {
        n.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: i
        })
    }, n.r = function(e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, n.t = function(e, t) {
        if (1 & t && (e = n(e)), 8 & t) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var i = Object.create(null);
        if (n.r(i), Object.defineProperty(i, "default", {
                enumerable: !0,
                value: e
            }), 2 & t && "string" != typeof e)
            for (var l in e) n.d(i, l, function(t) {
                return e[t]
            }.bind(null, l));
        return i
    }, n.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default
        } : function() {
            return e
        };
        return n.d(t, "a", t), t
    }, n.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, n.p = "", n(n.s = "XJR1")
}({
    "1kvd": function(e, t, n) {
        "use strict";
        var i, l;
        i = "undefined" != typeof window ? window : this, l = function(e, t) {
            const n = {
                name: "dialog",
                add: function(e) {
                    const t = e.context;
                    t.dialog = {
                        kind: "",
                        updateModal: !1,
                        _closeSignal: !1
                    };
                    let n = e.util.createElement("DIV");
                    n.className = "se-dialog sun-editor-common";
                    let i = e.util.createElement("DIV");
                    i.className = "se-dialog-back", i.style.display = "none";
                    let l = e.util.createElement("DIV");
                    l.className = "se-dialog-inner", l.style.display = "none", n.appendChild(i), n.appendChild(l), t.dialog.modalArea = n, t.dialog.back = i, t.dialog.modal = l, t.dialog.modal.addEventListener("mousedown", this.onMouseDown_dialog.bind(e)), t.dialog.modal.addEventListener("click", this.onClick_dialog.bind(e)), t.element.relative.appendChild(n), n = null, i = null, l = null
                },
                onMouseDown_dialog: function(e) {
                    /se-dialog-inner/.test(e.target.className) ? this.context.dialog._closeSignal = !0 : this.context.dialog._closeSignal = !1
                },
                onClick_dialog: function(e) {
                    e.stopPropagation(), (/close/.test(e.target.getAttribute("data-command")) || this.context.dialog._closeSignal) && this.plugins.dialog.close.call(this)
                },
                open: function(e, t) {
                    if (this.modalForm) return !1;
                    this.plugins.dialog._bindClose && (this._d.removeEventListener("keydown", this.plugins.dialog._bindClose), this.plugins.dialog._bindClose = null), this.plugins.dialog._bindClose = function(e) {
                        /27/.test(e.keyCode) && this.plugins.dialog.close.call(this)
                    }.bind(this), this._d.addEventListener("keydown", this.plugins.dialog._bindClose), this.context.dialog.updateModal = t, "full" === this.context.option.popupDisplay ? this.context.dialog.modalArea.style.position = "fixed" : this.context.dialog.modalArea.style.position = "absolute", this.context.dialog.kind = e, this.modalForm = this.context[e].modal;
                    const n = this.context[e].focusElement;
                    "function" == typeof this.plugins[e].on && this.plugins[e].on.call(this, t), this.context.dialog.modalArea.style.display = "block", this.context.dialog.back.style.display = "block", this.context.dialog.modal.style.display = "block", this.modalForm.style.display = "block", n && n.focus()
                },
                _bindClose: null,
                close: function() {
                    this.plugins.dialog._bindClose && (this._d.removeEventListener("keydown", this.plugins.dialog._bindClose), this.plugins.dialog._bindClose = null);
                    const e = this.context.dialog.kind;
                    this.modalForm.style.display = "none", this.context.dialog.back.style.display = "none", this.context.dialog.modalArea.style.display = "none", this.context.dialog.updateModal = !1, this.plugins[e].init.call(this), this.context.dialog.kind = "", this.modalForm = null, this.focus()
                }
            };
            return void 0 === t && (e.SUNEDITOR_MODULES || (e.SUNEDITOR_MODULES = {}), e.SUNEDITOR_MODULES.dialog = n), n
        }, "object" == typeof e.exports ? e.exports = i.document ? l(i, !0) : function(e) {
            if (!e.document) throw new Error("SUNEDITOR_MODULES a window with a document");
            return l(e)
        } : l(i)
    },
    "3FqI": function(e, t, n) {},
    P6u4: function(e, t, n) {
        "use strict";
        var i, l;
        i = "undefined" != typeof window ? window : this, l = function(e, t) {
            const n = {
                code: "en",
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
                    math: "Math",
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
                    mathBox: {
                        title: "Math",
                        inputLabel: "Mathematical Notation",
                        fontSizeLabel: "Font Size",
                        previewLabel: "Preview"
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
                    fixedColumnWidth: "Fixed column width",
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
            return void 0 === t && (e.SUNEDITOR_LANG || (e.SUNEDITOR_LANG = {}), e.SUNEDITOR_LANG.en = n), n
        }, "object" == typeof e.exports ? e.exports = i.document ? l(i, !0) : function(e) {
            if (!e.document) throw new Error("SUNEDITOR_LANG a window with a document");
            return l(e)
        } : l(i)
    },
    WUQj: function(e, t, n) {},
    XJR1: function(e, t, n) {
        "use strict";
        n.r(t);
        n("3FqI"), n("WUQj");
        var i = {
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
                    let n = this.createColorList(e, this._makeColorList);
                    t.colorPicker.colorListHTML = n, n = null
                },
                createColorList: function(e, t) {
                    const n = e.context.option,
                        i = e.lang,
                        l = n.colorList && 0 !== n.colorList.length ? n.colorList : ["#ff0000", "#ff5e00", "#ffe400", "#abf200", "#00d8ff", "#0055ff", "#6600ff", "#ff00dd", "#000000", "#ffd8d8", "#fae0d4", "#faf4c0", "#e4f7ba", "#d4f4fa", "#d9e5ff", "#e8d9ff", "#ffd9fa", "#f1f1f1", "#ffa7a7", "#ffc19e", "#faed7d", "#cef279", "#b2ebf4", "#b2ccff", "#d1b2ff", "#ffb2f5", "#bdbdbd", "#f15f5f", "#f29661", "#e5d85c", "#bce55c", "#5cd1e5", "#6699ff", "#a366ff", "#f261df", "#8c8c8c", "#980000", "#993800", "#998a00", "#6b9900", "#008299", "#003399", "#3d0099", "#990085", "#353535", "#670000", "#662500", "#665c00", "#476600", "#005766", "#002266", "#290066", "#660058", "#222222"];
                    let s = [],
                        o = '<div class="se-list-inner">';
                    for (let e, n = 0, i = l.length; n < i; n++) e = l[n], e && ("string" == typeof e && (s.push(e), n < i - 1) || (s.length > 0 && (o += '<div class="se-selector-color">' + t(s) + "</div>", s = []), "object" == typeof e && (o += '<div class="se-selector-color">' + t(e) + "</div>")));
                    return o += '<form class="se-submenu-form-group"><input type="text" maxlength="9" class="_se_color_picker_input se-color-input"/><button type="submit" class="se-btn-primary se-tooltip _se_color_picker_submit">' + e.icons.checked + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + i.dialogBox.submitButton + '</span></span></button><button type="button" class="se-btn se-tooltip _se_color_picker_remove">' + e.icons.erase + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + i.toolbar.removeFormat + "</span></span></button></form></div>", o
                },
                _makeColorList: function(e) {
                    let t = "";
                    t += '<ul class="se-color-pallet">';
                    for (let n, i = 0, l = e.length; i < l; i++) n = e[i], "string" == typeof n && (t += '<li><button type="button" data-value="' + n + '" title="' + n + '" style="background-color:' + n + ';"></button></li>');
                    return t += "</ul>", t
                },
                init: function(e, t) {
                    const n = this.plugins.colorPicker;
                    let i = t || (n.getColorInNode.call(this, e) || this.context.colorPicker._defaultColor);
                    i = n.isHexColor(i) ? i : n.rgb2hex(i) || i;
                    const l = this.context.colorPicker._colorList;
                    if (l)
                        for (let e = 0, t = l.length; e < t; e++) i.toLowerCase() === l[e].getAttribute("data-value").toLowerCase() ? this.util.addClass(l[e], "active") : this.util.removeClass(l[e], "active");
                    n.setInputText.call(this, n.colorName2hex.call(this, i))
                },
                setCurrentColor: function(e) {
                    this.context.colorPicker._currentColor = e, this.context.colorPicker._colorInput.style.borderColor = e
                },
                setInputText: function(e) {
                    e = /^#/.test(e) ? e : "#" + e, this.context.colorPicker._colorInput.value = e, this.plugins.colorPicker.setCurrentColor.call(this, e)
                },
                getColorInNode: function(e) {
                    let t = "";
                    const n = this.context.colorPicker._styleProperty;
                    for (; e && !this.util.isWysiwygDiv(e) && 0 === t.length;) 1 === e.nodeType && e.style[n] && (t = e.style[n]), e = e.parentNode;
                    return t
                },
                isHexColor: function(e) {
                    return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(e)
                },
                rgb2hex: function(e) {
                    const t = e.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
                    return t && 4 === t.length ? "#" + ("0" + parseInt(t[1], 10).toString(16)).slice(-2) + ("0" + parseInt(t[2], 10).toString(16)).slice(-2) + ("0" + parseInt(t[3], 10).toString(16)).slice(-2) : ""
                },
                colorName2hex: function(e) {
                    if (/^#/.test(e)) return e;
                    var t = this.util.createElement("div");
                    t.style.display = "none", t.style.color = e;
                    var n = this._w.getComputedStyle(this._d.body.appendChild(t)).color.match(/\d+/g).map((function(e) {
                        return parseInt(e, 10)
                    }));
                    return this.util.removeItem(t), n.length >= 3 && "#" + ((1 << 24) + (n[0] << 16) + (n[1] << 8) + n[2]).toString(16).substr(1)
                }
            },
            l = {
                name: "fontColor",
                display: "submenu",
                add: function(e, t) {
                    e.addModule([i]);
                    const n = e.context;
                    n.fontColor = {
                        previewEl: null,
                        colorInput: null,
                        colorList: null
                    };
                    let l = this.setSubmenu.call(e);
                    n.fontColor.colorInput = l.querySelector("._se_color_picker_input"), n.fontColor.colorInput.addEventListener("keyup", this.onChangeInput.bind(e)), l.querySelector("._se_color_picker_submit").addEventListener("click", this.submit.bind(e)), l.querySelector("._se_color_picker_remove").addEventListener("click", this.remove.bind(e)), l.addEventListener("click", this.pickup.bind(e)), n.fontColor.colorList = l.querySelectorAll("li button"), e.initMenuTarget(this.name, t, l), l = null
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
            s = {
                name: "hiliteColor",
                display: "submenu",
                add: function(e, t) {
                    e.addModule([i]);
                    const n = e.context;
                    n.hiliteColor = {
                        previewEl: null,
                        colorInput: null,
                        colorList: null
                    };
                    let l = this.setSubmenu.call(e);
                    n.hiliteColor.colorInput = l.querySelector("._se_color_picker_input"), n.hiliteColor.colorInput.addEventListener("keyup", this.onChangeInput.bind(e)), l.querySelector("._se_color_picker_submit").addEventListener("click", this.submit.bind(e)), l.querySelector("._se_color_picker_remove").addEventListener("click", this.remove.bind(e)), l.addEventListener("click", this.pickup.bind(e)), n.hiliteColor.colorList = l.querySelectorAll("li button"), e.initMenuTarget(this.name, t, l), l = null
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
            o = {
                name: "template",
                display: "submenu",
                add: function(e, t) {
                    e.context.template = {};
                    let n = this.setSubmenu.call(e);
                    n.querySelector("ul").addEventListener("click", this.pickup.bind(e)), e.initMenuTarget(this.name, t, n), n = null
                },
                setSubmenu: function() {
                    const e = this.context.option.templates;
                    if (!e || 0 === e.length) throw Error('[SUNEDITOR.plugins.template.fail] To use the "template" plugin, please define the "templates" option.');
                    const t = this.util.createElement("DIV");
                    t.className = "se-list-layer";
                    let n = '<div class="se-submenu se-list-inner"><ul class="se-list-basic">';
                    for (let t, i = 0, l = e.length; i < l; i++) t = e[i], n += '<li><button type="button" class="se-btn-list" data-value="' + i + '" title="' + t.name + '">' + t.name + "</button></li>";
                    return n += "</ul></div>", t.innerHTML = n, t
                },
                pickup: function(e) {
                    if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                    e.preventDefault(), e.stopPropagation();
                    const t = this.context.option.templates[e.target.getAttribute("data-value")];
                    if (!t.html) throw this.submenuOff(), Error('[SUNEDITOR.template.fail] cause : "templates[i].html not found"');
                    this.setContents(t.html), this.submenuOff()
                }
            },
            a = n("1kvd"),
            r = n.n(a),
            c = {
                name: "link",
                display: "dialog",
                add: function(e) {
                    e.addModule([r.a]);
                    const t = e.context;
                    t.link = {
                        focusElement: null,
                        linkNewWindowCheck: null,
                        linkAnchorText: null,
                        _linkAnchor: null
                    };
                    let n = this.setDialog.call(e);
                    t.link.modal = n, t.link.focusElement = n.querySelector("._se_link_url"), t.link.linkAnchorText = n.querySelector("._se_link_text"), t.link.linkNewWindowCheck = n.querySelector("._se_link_check");
                    let i = this.setController_LinkButton.call(e);
                    t.link.linkController = i, t.link._linkAnchor = null, i.addEventListener("mousedown", (function(e) {
                        e.stopPropagation()
                    }), !1), n.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), i.addEventListener("click", this.onClick_linkController.bind(e)), t.dialog.modal.appendChild(n), t.element.relative.appendChild(i), n = null, i = null
                },
                setDialog: function() {
                    const e = this.lang,
                        t = this.util.createElement("DIV");
                    return t.className = "se-dialog-content", t.style.display = "none", t.innerHTML = '<form class="editor_link"><div class="se-dialog-header"><button type="button" data-command="close" class="se-btn se-dialog-close" aria-label="Close" title="' + e.dialogBox.close + '">' + this.icons.cancel + '</button><span class="se-modal-title">' + e.dialogBox.linkBox.title + '</span></div><div class="se-dialog-body"><div class="se-dialog-form"><label>' + e.dialogBox.linkBox.url + '</label><input class="se-input-form _se_link_url" type="text" /></div><div class="se-dialog-form"><label>' + e.dialogBox.linkBox.text + '</label><input class="se-input-form _se_link_text" type="text" /></div><div class="se-dialog-form-footer"><label><input type="checkbox" class="se-dialog-btn-check _se_link_check" />&nbsp;' + e.dialogBox.linkBox.newWindowCheck + '</label></div></div><div class="se-dialog-footer"><button type="submit" class="se-btn-primary" title="' + e.dialogBox.submitButton + '"><span>' + e.dialogBox.submitButton + "</span></button></div></form>", t
                },
                setController_LinkButton: function() {
                    const e = this.lang,
                        t = this.icons,
                        n = this.util.createElement("DIV");
                    return n.className = "se-controller se-controller-link", n.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="link-content"><span><a target="_blank" href=""></a>&nbsp;</span><div class="se-btn-group"><button type="button" data-command="update" tabindex="-1" class="se-btn se-tooltip">' + t.edit + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.edit + '</span></span></button><button type="button" data-command="unlink" tabindex="-1" class="se-btn se-tooltip">' + t.unlink + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.unlink + '</span></span></button><button type="button" data-command="delete" tabindex="-1" class="se-btn se-tooltip">' + t.delete + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div></div>", n
                },
                open: function() {
                    this.plugins.dialog.open.call(this, "link", "link" === this.currentControllerName)
                },
                submit: function(e) {
                    this.showLoading(), e.preventDefault(), e.stopPropagation();
                    const t = function() {
                        if (0 === this.context.link.focusElement.value.trim().length) return !1;
                        const e = this.context.link,
                            t = e.focusElement.value,
                            n = e.linkAnchorText,
                            i = 0 === n.value.length ? t : n.value;
                        if (this.context.dialog.updateModal) {
                            e._linkAnchor.href = t, e._linkAnchor.textContent = i, e._linkAnchor.target = e.linkNewWindowCheck.checked ? "_blank" : "";
                            const n = e._linkAnchor.childNodes[0];
                            this.setRange(n, 0, n, n.textContent.length)
                        } else {
                            const n = this.util.createElement("A");
                            n.href = t, n.textContent = i, n.target = e.linkNewWindowCheck.checked ? "_blank" : "";
                            const l = this.getSelectedElements();
                            if (l.length > 1) {
                                const e = this.util.createElement(l[0].nodeName);
                                e.appendChild(n), this.insertNode(e)
                            } else this.insertNode(n);
                            this.setRange(n.childNodes[0], 0, n.childNodes[0], n.textContent.length)
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
                active: function(e) {
                    if (e) {
                        if (this.util.isAnchor(e) && null === e.getAttribute("data-image-link")) return this.controllerArray.indexOf(this.context.link.linkController) < 0 && this.plugins.link.call_controller.call(this, e), !0
                    } else this.controllerArray.indexOf(this.context.link.linkController) > -1 && this.controllersOff();
                    return !1
                },
                on: function(e) {
                    e ? this.context.link._linkAnchor && (this.context.dialog.updateModal = !0, this.context.link.focusElement.value = this.context.link._linkAnchor.href, this.context.link.linkAnchorText.value = this.context.link._linkAnchor.textContent, this.context.link.linkNewWindowCheck.checked = !!/_blank/i.test(this.context.link._linkAnchor.target)) : (this.plugins.link.init.call(this), this.context.link.linkAnchorText.value = this.getSelection().toString())
                },
                call_controller: function(e) {
                    this.editLink = this.context.link._linkAnchor = e;
                    const t = this.context.link.linkController,
                        n = t.querySelector("a");
                    n.href = e.href, n.title = e.textContent, n.textContent = e.textContent;
                    const i = this.util.getOffset(e, this.context.element.wysiwygFrame);
                    t.style.top = i.top + e.offsetHeight + 10 + "px", t.style.left = i.left - this.context.element.wysiwygFrame.scrollLeft + "px", t.style.display = "block";
                    const l = this.context.element.wysiwygFrame.offsetWidth - (t.offsetLeft + t.offsetWidth);
                    l < 0 ? (t.style.left = t.offsetLeft + l + "px", t.firstElementChild.style.left = 20 - l + "px") : t.firstElementChild.style.left = "20px", this.controllersOn(t, e, "link")
                },
                onClick_linkController: function(e) {
                    e.stopPropagation();
                    const t = e.target.getAttribute("data-command") || e.target.parentNode.getAttribute("data-command");
                    if (t) {
                        if (e.preventDefault(), /update/.test(t)) {
                            const e = this.context.link;
                            e.focusElement.value = e._linkAnchor.href, e.linkAnchorText.value = e._linkAnchor.textContent, e.linkNewWindowCheck.checked = !!/_blank/i.test(e._linkAnchor.target), this.plugins.dialog.open.call(this, "link", !0)
                        } else if (/unlink/.test(t)) {
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
                    const e = this.context.link;
                    e.linkController.style.display = "none", e._linkAnchor = null, e.focusElement.value = "", e.linkAnchorText.value = "", e.linkNewWindowCheck.checked = !1
                }
            },
            d = n("ee5k"),
            u = n.n(d),
            h = {
                blockquote: {
                    name: "blockquote",
                    display: "command",
                    add: function(e, t) {
                        e.context.blockquote = {
                            targetButton: t,
                            tag: e.util.createElement("BLOCKQUOTE")
                        }
                    },
                    active: function(e) {
                        if (e) {
                            if (/blockquote/i.test(e.nodeName)) return this.util.addClass(this.context.blockquote.targetButton, "active"), !0
                        } else this.util.removeClass(this.context.blockquote.targetButton, "active");
                        return !1
                    },
                    action: function() {
                        const e = this.util.getParentElement(this.getSelectionNode(), "blockquote");
                        e ? this.detachRangeFormatElement(e, null, null, !1, !1) : this.applyRangeFormatElement(this.context.blockquote.tag.cloneNode(!1))
                    }
                },
                align: {
                    name: "align",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.icons,
                            i = e.context;
                        i.align = {
                            targetButton: t,
                            _alignList: null,
                            currentAlign: "",
                            icons: {
                                justify: n.align_justify,
                                left: n.align_left,
                                right: n.align_right,
                                center: n.align_center
                            }
                        };
                        let l = this.setSubmenu.call(e),
                            s = l.querySelector("ul");
                        s.addEventListener("click", this.pickup.bind(e)), i.align._alignList = s.querySelectorAll("li button"), e.initMenuTarget(this.name, t, l), l = null, s = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.icons,
                            n = this.util.createElement("DIV");
                        return n.className = "se-list-layer", n.innerHTML = '<div class="se-submenu se-list-inner se-list-align"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyleft" data-value="left" title="' + e.toolbar.alignLeft + '"><span class="se-list-icon">' + t.align_left + "</span>" + e.toolbar.alignLeft + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifycenter" data-value="center" title="' + e.toolbar.alignCenter + '"><span class="se-list-icon">' + t.align_center + "</span>" + e.toolbar.alignCenter + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyright" data-value="right" title="' + e.toolbar.alignRight + '"><span class="se-list-icon">' + t.align_right + "</span>" + e.toolbar.alignRight + '</button></li><li><button type="button" class="se-btn-list se-btn-align" data-command="justifyfull" data-value="justify" title="' + e.toolbar.alignJustify + '"><span class="se-list-icon">' + t.align_justify + "</span>" + e.toolbar.alignJustify + "</button></li></ul></div>", n
                    },
                    active: function(e) {
                        const t = this.context.align.targetButton,
                            n = t.querySelector("svg");
                        if (e) {
                            if (this.util.isFormatElement(e)) {
                                const i = e.style.textAlign;
                                if (i) return this.util.changeElement(n, this.context.align.icons[i]), t.setAttribute("data-focus", i), !0
                            }
                        } else this.util.changeElement(n, this.context.align.icons.left), t.removeAttribute("data-focus");
                        return !1
                    },
                    on: function() {
                        const e = this.context.align,
                            t = e._alignList,
                            n = e.targetButton.getAttribute("data-focus") || "left";
                        if (n !== e.currentAlign) {
                            for (let e = 0, i = t.length; e < i; e++) n === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentAlign = n
                        }
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = null;
                        for (; !n && !/UL/i.test(t.tagName);) n = t.getAttribute("data-value"), t = t.parentNode;
                        if (!n) return;
                        const i = this.getSelectedElements();
                        for (let e = 0, t = i.length; e < t; e++) this.util.setStyle(i[e], "textAlign", "left" === n ? "" : n);
                        this.effectNode = null, this.submenuOff(), this.focus(), this.history.push(!1)
                    }
                },
                font: {
                    name: "font",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.font = {
                            targetText: t.querySelector(".txt"),
                            targetTooltip: t.parentNode.querySelector(".se-tooltip-text"),
                            _fontList: null,
                            currentFont: ""
                        };
                        let i = this.setSubmenu.call(e);
                        i.querySelector(".se-list-font-family").addEventListener("click", this.pickup.bind(e)), n.font._fontList = i.querySelectorAll("ul li button"), e.initMenuTarget(this.name, t, i), i = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            n = this.util.createElement("DIV");
                        let i, l, s, o;
                        n.className = "se-list-layer";
                        let a = e.font ? e.font : ["Arial", "Comic Sans MS", "Courier New", "Impact", "Georgia", "tahoma", "Trebuchet MS", "Verdana"],
                            r = '<div class="se-submenu se-list-inner se-list-font-family"><ul class="se-list-basic"><li><button type="button" class="default_value se-btn-list" title="' + t.toolbar.default+'">(' + t.toolbar.default+")</button></li>";
                        for (s = 0, o = a.length; s < o; s++) i = a[s], l = i.split(",")[0], r += '<li><button type="button" class="se-btn-list" data-value="' + i + '" data-txt="' + l + '" title="' + l + '" style="font-family:' + i + ';">' + l + "</button></li>";
                        return r += "</ul></div>", n.innerHTML = r, n
                    },
                    active: function(e) {
                        const t = this.context.font.targetText,
                            n = this.context.font.targetTooltip;
                        if (e) {
                            if (e.style && e.style.fontFamily.length > 0) {
                                const i = e.style.fontFamily.replace(/["']/g, "");
                                return this.util.changeTxt(t, i), this.util.changeTxt(n, i), !0
                            }
                        } else {
                            const e = this.lang.toolbar.font;
                            this.util.changeTxt(t, e), this.util.changeTxt(n, e)
                        }
                        return !1
                    },
                    on: function() {
                        const e = this.context.font,
                            t = e._fontList,
                            n = e.targetText.textContent;
                        if (n !== e.currentFont) {
                            for (let e = 0, i = t.length; e < i; e++) n === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentFont = n
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
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.fontSize = {
                            targetText: t.querySelector(".txt"),
                            _sizeList: null,
                            currentSize: ""
                        };
                        let i = this.setSubmenu.call(e),
                            l = i.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), n.fontSize._sizeList = l.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            n = this.util.createElement("DIV");
                        n.className = "se-submenu se-list-layer";
                        const i = e.fontSize ? e.fontSize : [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
                        let l = '<div class="se-list-inner se-list-font-size"><ul class="se-list-basic"><li><button type="button" class="default_value se-btn-list" title="' + t.toolbar.default+'">(' + t.toolbar.default+")</button></li>";
                        for (let t, n = 0, s = e.fontSizeUnit, o = i.length; n < o; n++) t = i[n], l += '<li><button type="button" class="se-btn-list" data-value="' + t + s + '" title="' + t + s + '" style="font-size:' + t + s + ';">' + t + "</button></li>";
                        return l += "</ul></div>", n.innerHTML = l, n
                    },
                    active: function(e) {
                        if (e) {
                            if (e.style && e.style.fontSize.length > 0) return this.util.changeTxt(this.context.fontSize.targetText, e.style.fontSize), !0
                        } else this.util.changeTxt(this.context.fontSize.targetText, this.lang.toolbar.fontSize);
                        return !1
                    },
                    on: function() {
                        const e = this.context.fontSize,
                            t = e._sizeList,
                            n = e.targetText.textContent;
                        if (n !== e.currentSize) {
                            for (let e = 0, i = t.length; e < i; e++) n === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentSize = n
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
                fontColor: l,
                hiliteColor: s,
                horizontalRule: {
                    name: "horizontalRule",
                    display: "submenu",
                    add: function(e, t) {
                        let n = this.setSubmenu.call(e);
                        n.querySelector("ul").addEventListener("click", this.horizontalRulePick.bind(e)), e.initMenuTarget(this.name, t, n), n = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = '<div class="se-list-inner se-list-line"><ul class="se-list-basic"><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="solid"><hr style="border-width: 1px 0 0; border-style: solid none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_solid + '</span></span></button></li><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="dotted"><hr style="border-width: 1px 0 0; border-style: dotted none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_dotted + '</span></span></button></li><li><button type="button" class="se-btn-list btn_line se-tooltip" data-command="horizontalRule" data-value="dashed"><hr style="border-width: 1px 0 0; border-style: dashed none none; border-color: black; border-image: initial; height: 1px;" /><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.hr_dashed + "</span></span></button></li></ul></div>", t
                    },
                    appendHr: function(e) {
                        const t = this.util.createElement("HR");
                        t.className = e, this.focus();
                        let n = this.insertComponent(t, !1);
                        this.setRange(n, 0, n, 0)
                    },
                    horizontalRulePick: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = null;
                        for (; !n && !/UL/i.test(t.tagName);) n = t.getAttribute("data-value"), t = t.parentNode;
                        n && (this.plugins.horizontalRule.appendHr.call(this, "__se__" + n), this.submenuOff())
                    }
                },
                list: {
                    name: "list",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.list = {
                            targetButton: t,
                            _list: null,
                            currentList: "",
                            icons: {
                                bullets: e.icons.list_bullets,
                                number: e.icons.list_number
                            }
                        };
                        let i = this.setSubmenu.call(e),
                            l = i.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), n.list._list = l.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-submenu se-list-layer", t.innerHTML = '<div class="se-list-inner"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-tooltip" data-command="OL">' + this.icons.list_number + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.orderList + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="UL">' + this.icons.list_bullets + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.unorderList + "</span></span></button></li></ul></div>", t
                    },
                    active: function(e) {
                        const t = this.context.list.targetButton,
                            n = t.querySelector("svg"),
                            i = this.util;
                        if (e) {
                            if (i.isList(e)) {
                                const l = e.nodeName;
                                return t.setAttribute("data-focus", l), i.addClass(t, "active"), /UL/i.test(l) ? i.changeElement(n, this.context.list.icons.bullets) : i.changeElement(n, this.context.list.icons.number), !0
                            }
                        } else t.removeAttribute("data-focus"), i.changeElement(n, this.context.list.icons.number), i.removeClass(t, "active");
                        return !1
                    },
                    on: function() {
                        const e = this.context.list,
                            t = e._list,
                            n = e.targetButton.getAttribute("data-focus") || "";
                        if (n !== e.currentList) {
                            for (let e = 0, i = t.length; e < i; e++) n === t[e].getAttribute("data-command") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentList = n
                        }
                    },
                    editList: function(e, t, n) {
                        const i = t || this.getSelectedElementsAndComponents(!1);
                        if (!i || 0 === i.length) return;
                        const l = this.util;
                        l.sortByDepth(i, !0);
                        let s = i[0],
                            o = i[i.length - 1],
                            a = !l.isListCell(s) && !l.isComponent(s) || s.previousElementSibling ? s.previousElementSibling : s.parentNode.previousElementSibling,
                            r = !l.isListCell(o) && !l.isComponent(o) || o.nextElementSibling ? o.nextElementSibling : o.parentNode.nextElementSibling;
                        const c = this.getRange(),
                            d = {
                                sc: c.startContainer,
                                so: c.startOffset,
                                ec: c.endContainer,
                                eo: c.endOffset
                            };
                        let u = !0;
                        for (let e = 0, t = i.length; e < t; e++)
                            if (!l.isList(l.getRangeFormatElement(i[e], function(t) {
                                    return this.getRangeFormatElement(t) && t !== i[e]
                                }.bind(l)))) {
                                u = !1;
                                break
                            } if (!u || a && s.tagName === a.tagName && e === a.tagName.toUpperCase() || r && o.tagName === r.tagName && e === r.tagName.toUpperCase()) {
                            const t = a ? a.parentNode : a,
                                n = r ? r.parentNode : r;
                            a = t && !l.isWysiwygDiv(t) && t.nodeName === e ? t : a, r = n && !l.isWysiwygDiv(n) && n.nodeName === e ? n : r;
                            const s = a && a.tagName === e,
                                o = r && r.tagName === e;
                            let c = s ? a : l.createElement(e),
                                d = null,
                                u = null,
                                h = null,
                                g = null;
                            const p = function(e) {
                                return !this.isComponent(e) && !this.isList(e)
                            }.bind(l);
                            for (let t, n, o, a, r, g, m, f, _, b = 0, v = i.length; b < v; b++)
                                if (n = i[b], 0 !== n.childNodes.length || l._isIgnoreNodeChange(n)) {
                                    if (a = i[b + 1], r = n.parentNode, g = a ? a.parentNode : null, o = l.isListCell(n), _ = l.isRangeFormatElement(r) ? r : null, m = o && !l.isWysiwygDiv(r) ? r.parentNode : r, f = o && !l.isWysiwygDiv(r) ? !a || l.isListCell(m) ? r : r.nextSibling : n.nextSibling, t = l.createElement("LI"), l.copyFormatAttributes(t, n), l.isComponent(n)) {
                                        const e = /^HR$/i.test(n.nodeName);
                                        e || (t.innerHTML = "<br>"), t.innerHTML += n.outerHTML, e && (t.innerHTML += "<br>")
                                    } else {
                                        const e = n.childNodes;
                                        for (; e[0];) t.appendChild(e[0])
                                    }
                                    c.appendChild(t), a || (u = c), a && m === g && !l.isRangeFormatElement(f) || (d || (d = c), s && a && m === g || a && l.isList(g) && g === r || c.parentNode !== m && m.insertBefore(c, f)), l.removeItem(n), s && null === h && (h = c.children.length - 1), a && (l.getRangeFormatElement(g, p) !== l.getRangeFormatElement(r, p) || l.isList(g) && l.isList(r) && l.getElementDepth(g) !== l.getElementDepth(r)) && (c = l.createElement(e)), _ && 0 === _.children.length && l.removeItem(_)
                                } else l.removeItem(n);
                            h && (d = d.children[h]), o && (g = c.children.length - 1, c.innerHTML += r.innerHTML, u = c.children[g], l.removeItem(r))
                        } else {
                            if (n)
                                for (let e = 0, t = i.length; e < t; e++)
                                    for (let n = e - 1; n >= 0; n--)
                                        if (i[n].contains(i[e])) {
                                            i.splice(e, 1), e--, t--;
                                            break
                                        } const t = l.getRangeFormatElement(s),
                                o = t && t.tagName === e;
                            let a, r;
                            const c = function(e) {
                                return !this.isComponent(e)
                            }.bind(l);
                            o || (r = l.createElement(e));
                            for (let t, s, d = 0, u = i.length; d < u; d++) s = l.getRangeFormatElement(i[d], c), s && l.isList(s) && (t ? t !== s ? (n && l.isListCell(s.parentNode) ? this.plugins.list._detachNested.call(this, a.f) : this.detachRangeFormatElement(a.f[0].parentNode, a.f, r, !1, !0), s = i[d].parentNode, o || (r = l.createElement(e)), t = s, a = {
                                r: t,
                                f: [l.getParentElement(i[d], "LI")]
                            }) : a.f.push(l.getParentElement(i[d], "LI")) : (t = s, a = {
                                r: t,
                                f: [l.getParentElement(i[d], "LI")]
                            }), d === u - 1 && (n && l.isListCell(s.parentNode) ? this.plugins.list._detachNested.call(this, a.f) : this.detachRangeFormatElement(a.f[0].parentNode, a.f, r, !1, !0)))
                        }
                        return this.effectNode = null, d
                    },
                    _detachNested: function(e) {
                        const t = e[0],
                            n = e[e.length - 1],
                            i = n.nextElementSibling,
                            l = t.parentNode,
                            s = l.parentNode.nextElementSibling,
                            o = l.parentNode.parentNode;
                        for (let t = 0, n = e.length; t < n; t++) o.insertBefore(e[t], s);
                        if (i && l.children.length > 0) {
                            const e = l.cloneNode(!1),
                                t = l.childNodes,
                                s = this.util.getPositionIndex(i);
                            for (; t[s];) e.appendChild(t[s]);
                            n.appendChild(e)
                        }
                        0 === l.children.length && this.util.removeItem(l), this.util.mergeSameTags(o);
                        const a = this.util.getEdgeChildNodes(t, n);
                        return {
                            cc: t.parentNode,
                            sc: a.sc,
                            ec: a.ec
                        }
                    },
                    editInsideList: function(e, t) {
                        const n = (t = t || this.getSelectedElements().filter(function(e) {
                            return this.isListCell(e)
                        }.bind(this.util))).length;
                        if (0 === n || !e && !this.util.isListCell(t[0].previousElementSibling) && !this.util.isListCell(t[n - 1].nextElementSibling)) return {
                            sc: t[0],
                            so: 0,
                            ec: t[n - 1],
                            eo: 1
                        };
                        let i = t[0].parentNode,
                            l = t[n - 1],
                            s = null;
                        if (e) {
                            if (i !== l.parentNode && this.util.isList(l.parentNode.parentNode) && l.nextElementSibling)
                                for (l = l.nextElementSibling; l;) t.push(l), l = l.nextElementSibling;
                            s = this.plugins.list.editList.call(this, i.nodeName.toUpperCase(), t, !0)
                        } else {
                            let e = this.util.createElement(i.nodeName),
                                o = t[0].previousElementSibling,
                                a = l.nextElementSibling;
                            const r = {
                                s: null,
                                e: null,
                                sl: i,
                                el: i
                            };
                            for (let l, s = 0, c = n; s < c; s++) l = t[s], l.parentNode !== i && (this.plugins.list._insiedList.call(this, i, e, o, a, r), i = l.parentNode, e = this.util.createElement(i.nodeName)), o = l.previousElementSibling, a = l.nextElementSibling, e.appendChild(l);
                            this.plugins.list._insiedList.call(this, i, e, o, a, r);
                            const c = this.util.getNodeFromPath(r.s, r.sl),
                                d = this.util.getNodeFromPath(r.e, r.el);
                            s = {
                                sc: c,
                                so: 0,
                                ec: d,
                                eo: d.textContent.length
                            }
                        }
                        return s
                    },
                    _insiedList: function(e, t, n, i, l) {
                        let s = !1;
                        if (n && t.tagName === n.tagName) {
                            const e = t.children;
                            for (; e[0];) n.appendChild(e[0]);
                            t = n, s = !0
                        }
                        if (i && t.tagName === i.tagName) {
                            const e = i.children;
                            for (; e[0];) t.appendChild(e[0]);
                            const n = i.nextElementSibling;
                            i.parentNode.removeChild(i), i = n
                        }
                        if (!s) {
                            this.util.isListCell(n) && (e = n, i = null), e.insertBefore(t, i), l.s || (l.s = this.util.getNodePath(t.firstElementChild.firstChild, e, null), l.sl = e);
                            const s = e.contains(l.sl) ? this.util.getNodePath(l.sl, e) : null;
                            l.e = this.util.getNodePath(t.lastElementChild.firstChild, e, null), l.el = e, this.util.mergeSameTags(e, [l.s, l.e, s], !1), this.util.mergeNestedTags(e), s && (l.sl = this.util.getNodeFromPath(s, e))
                        }
                        return t
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = "";
                        for (; !n && !/^UL$/i.test(t.tagName);) n = t.getAttribute("data-command"), t = t.parentNode;
                        if (!n) return;
                        const i = this.plugins.list.editList.call(this, n, null, !1);
                        this.setRange(i.sc, i.so, i.ec, i.eo), this.submenuOff(), this.history.push(!1)
                    }
                },
                table: {
                    name: "table",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.table = {
                            _element: null,
                            _tdElement: null,
                            _trElement: null,
                            _trElements: null,
                            _tableXY: [],
                            _maxWidth: !0,
                            _fixedColumn: !1,
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
                            _current_rowSpan: 0,
                            icons: {
                                expansion: e.icons.expansion,
                                reduction: e.icons.reduction
                            }
                        };
                        let i = this.setSubmenu.call(e),
                            l = i.querySelector(".se-controller-table-picker");
                        n.table.tableHighlight = i.querySelector(".se-table-size-highlighted"), n.table.tableUnHighlight = i.querySelector(".se-table-size-unhighlighted"), n.table.tableDisplay = i.querySelector(".se-table-size-display");
                        let s = this.setController_table.call(e);
                        n.table.tableController = s, n.table.resizeButton = s.querySelector("._se_table_resize"), n.table.resizeText = s.querySelector("._se_table_resize > span > span"), n.table.columnFixedButton = s.querySelector("._se_table_fixed_column"), n.table.headerButton = s.querySelector("._se_table_header"), s.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1);
                        let o = this.setController_tableEditor.call(e);
                        n.table.resizeDiv = o, n.table.splitMenu = o.querySelector(".se-btn-group-sub"), n.table.mergeButton = o.querySelector("._se_table_merge_button"), n.table.splitButton = o.querySelector("._se_table_split_button"), n.table.insertRowAboveButton = o.querySelector("._se_table_insert_row_a"), n.table.insertRowBelowButton = o.querySelector("._se_table_insert_row_b"), o.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1), l.addEventListener("mousemove", this.onMouseMove_tablePicker.bind(e)), l.addEventListener("click", this.appendTable.bind(e)), o.addEventListener("click", this.onClick_tableController.bind(e)), s.addEventListener("click", this.onClick_tableController.bind(e)), e.initMenuTarget(this.name, t, i), n.element.relative.appendChild(o), n.element.relative.appendChild(s), i = null, l = null, o = null, s = null
                    },
                    setSubmenu: function() {
                        const e = this.util.createElement("DIV");
                        return e.className = "se-submenu se-selector-table", e.innerHTML = '<div class="se-table-size"><div class="se-table-size-picker se-controller-table-picker"></div><div class="se-table-size-highlighted"></div><div class="se-table-size-unhighlighted"></div></div><div class="se-table-size-display">1 x 1</div>', e
                    },
                    setController_table: function() {
                        const e = this.lang,
                            t = this.icons,
                            n = this.util.createElement("DIV");
                        return n.className = "se-controller se-controller-table", n.innerHTML = '<div><div class="se-btn-group"><button type="button" data-command="resize" class="se-btn se-tooltip _se_table_resize">' + t.expansion + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.maxSize + '</span></span></button><button type="button" data-command="layout" class="se-btn se-tooltip _se_table_fixed_column">' + t.fixed_column_width + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.fixedColumnWidth + '</span></span></button><button type="button" data-command="header" class="se-btn se-tooltip _se_table_header">' + t.table_header + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.tableHeader + '</span></span></button><button type="button" data-command="remove" class="se-btn se-tooltip">' + t.delete + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div></div>", n
                    },
                    setController_tableEditor: function() {
                        const e = this.lang,
                            t = this.icons,
                            n = this.util.createElement("DIV");
                        return n.className = "se-controller se-controller-table-cell", n.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="se-btn-group"><button type="button" data-command="insert" data-value="row" data-option="up" class="se-btn se-tooltip _se_table_insert_row_a">' + t.insert_row_above + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertRowAbove + '</span></span></button><button type="button" data-command="insert" data-value="row" data-option="down" class="se-btn se-tooltip _se_table_insert_row_b">' + t.insert_row_below + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertRowBelow + '</span></span></button><button type="button" data-command="delete" data-value="row" class="se-btn se-tooltip">' + t.delete_row + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.deleteRow + '</span></span></button><button type="button" data-command="merge" class="_se_table_merge_button se-btn se-tooltip" disabled>' + t.merge_cell + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mergeCells + '</span></span></button></div><div class="se-btn-group" style="padding-top: 0;"><button type="button" data-command="insert" data-value="cell" data-option="left" class="se-btn se-tooltip">' + t.insert_column_left + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertColumnBefore + '</span></span></button><button type="button" data-command="insert" data-value="cell" data-option="right" class="se-btn se-tooltip">' + t.insert_column_right + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.insertColumnAfter + '</span></span></button><button type="button" data-command="delete" data-value="cell" class="se-btn se-tooltip">' + t.delete_column + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.deleteColumn + '</span></span></button><button type="button" data-command="onsplit" class="_se_table_split_button se-btn se-tooltip">' + t.split_cell + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.splitCells + '</span></span></button><div class="se-btn-group-sub sun-editor-common se-list-layer"><div class="se-list-inner"><ul class="se-list-basic"><li class="se-btn-list" data-command="split" data-value="vertical" style="line-height:32px;" title="' + e.controller.VerticalSplit + '">' + e.controller.VerticalSplit + '</li><li class="se-btn-list" data-command="split" data-value="horizontal" style="line-height:32px;" title="' + e.controller.HorizontalSplit + '">' + e.controller.HorizontalSplit + "</li></ul></div></div></div>", n
                    },
                    appendTable: function() {
                        const e = this.util.createElement("TABLE"),
                            t = this.plugins.table.createCells,
                            n = this.context.table._tableXY[0];
                        let i = this.context.table._tableXY[1],
                            l = "<tbody>";
                        for (; i > 0;) l += "<tr>" + t.call(this, "td", n) + "</tr>", --i;
                        l += "</tbody>", e.innerHTML = l, this.insertComponent(e, !1);
                        const s = e.querySelector("td div");
                        this.setRange(s, 0, s, 0), this.plugins.table.reset_table_picker.call(this)
                    },
                    createCells: function(e, t, n) {
                        if (e = e.toLowerCase(), n) {
                            const t = this.util.createElement(e);
                            return t.innerHTML = "<div><br></div>", t
                        } {
                            let n = "";
                            for (; t > 0;) n += "<" + e + "><div><br></div></" + e + ">", t--;
                            return n
                        }
                    },
                    onMouseMove_tablePicker: function(e) {
                        e.stopPropagation();
                        let t = this._w.Math.ceil(e.offsetX / 18),
                            n = this._w.Math.ceil(e.offsetY / 18);
                        t = t < 1 ? 1 : t, n = n < 1 ? 1 : n, this.context.table.tableHighlight.style.width = t + "em", this.context.table.tableHighlight.style.height = n + "em";
                        this.context.table.tableUnHighlight.style.width = "10em", this.context.table.tableUnHighlight.style.height = "10em", this.util.changeTxt(this.context.table.tableDisplay, t + " x " + n), this.context.table._tableXY = [t, n]
                    },
                    reset_table_picker: function() {
                        if (!this.context.table.tableHighlight) return;
                        const e = this.context.table.tableHighlight.style,
                            t = this.context.table.tableUnHighlight.style;
                        e.width = "1em", e.height = "1em", t.width = "10em", t.height = "10em", this.util.changeTxt(this.context.table.tableDisplay, "1 x 1"), this.submenuOff()
                    },
                    init: function() {
                        const e = this.context.table,
                            t = this.plugins.table;
                        if (t._removeEvents.call(this), t._selectedTable) {
                            const e = t._selectedTable.querySelectorAll(".se-table-selected-cell");
                            for (let t = 0, n = e.length; t < n; t++) this.util.removeClass(e[t], "se-table-selected-cell")
                        }
                        t._toggleEditor.call(this, !0), e._element = null, e._tdElement = null, e._trElement = null, e._trElements = null, e._tableXY = [], e._maxWidth = !0, e._fixedColumn = !1, e._physical_cellCnt = 0, e._logical_cellCnt = 0, e._rowCnt = 0, e._rowIndex = 0, e._physical_cellIndex = 0, e._logical_cellIndex = 0, e._current_colSpan = 0, e._current_rowSpan = 0, t._shift = !1, t._selectedCells = null, t._selectedTable = null, t._ref = null, t._fixedCell = null, t._selectedCell = null, t._fixedCellName = null
                    },
                    call_controller_tableEdit: function(e) {
                        const t = this.plugins.table;
                        if (!this.getSelection().isCollapsed && !t._selectedCell) return this.controllersOff(), void this.util.removeClass(e, "se-table-selected-cell");
                        const n = this.context.table,
                            i = n.tableController;
                        t.setPositionControllerDiv.call(this, e, t._shift);
                        const l = n._element;
                        n._maxWidth = this.util.hasClass(l, "se-table-size-100") || "100%" === l.style.width || !l.style.width && !this.util.hasClass(l, "se-table-size-auto"), n._fixedColumn = this.util.hasClass(l, "se-table-layout-fixed") || "fixed" === l.style.tableLayout, t.setTableStyle.call(this, n._maxWidth ? "width|column" : "width"), t.setPositionControllerTop.call(this, l), t._shift || this.controllersOn(n.resizeDiv, i, t.init.bind(this), e, "table")
                    },
                    setPositionControllerTop: function(e) {
                        const t = this.context.table.tableController,
                            n = this.util.getOffset(e, this.context.element.wysiwygFrame);
                        t.style.left = n.left + "px", t.style.display = "block", t.style.top = n.top - t.offsetHeight - 2 + "px"
                    },
                    setPositionControllerDiv: function(e, t) {
                        const n = this.context.table.resizeDiv;
                        this.plugins.table.setCellInfo.call(this, e, t), n.style.display = "block";
                        const i = this.util.getOffset(e, this.context.element.wysiwygFrame);
                        n.style.left = i.left - this.context.element.wysiwygFrame.scrollLeft + "px", n.style.top = i.top + e.offsetHeight + 12 + "px";
                        const l = this.context.element.wysiwygFrame.offsetWidth - (n.offsetLeft + n.offsetWidth);
                        l < 0 ? (n.style.left = n.offsetLeft + l + "px", n.firstElementChild.style.left = 20 - l + "px") : n.firstElementChild.style.left = "20px"
                    },
                    setCellInfo: function(e, t) {
                        const n = this.context.table,
                            i = n._element = this.plugins.table._selectedTable || this.util.getParentElement(e, "TABLE");
                        if (/THEAD/i.test(i.firstElementChild.nodeName) ? this.util.addClass(n.headerButton, "active") : this.util.removeClass(n.headerButton, "active"), t || 0 === n._physical_cellCnt) {
                            n._tdElement !== e && (n._tdElement = e, n._trElement = e.parentNode);
                            const t = n._trElements = i.rows,
                                l = e.cellIndex;
                            let s = 0;
                            for (let e = 0, n = t[0].cells, i = t[0].cells.length; e < i; e++) s += n[e].colSpan;
                            const o = n._rowIndex = n._trElement.rowIndex;
                            n._rowCnt = t.length, n._physical_cellCnt = n._trElement.cells.length, n._logical_cellCnt = s, n._physical_cellIndex = l, n._current_colSpan = n._tdElement.colSpan - 1, n._current_rowSpan, n._trElement.cells[l].rowSpan;
                            let a = [],
                                r = [];
                            for (let e, i, s = 0; s <= o; s++) {
                                e = t[s].cells, i = 0;
                                for (let t, c, d, u, h = 0, g = e.length; h < g; h++) {
                                    if (t = e[h], c = t.colSpan - 1, d = t.rowSpan - 1, u = h + i, r.length > 0)
                                        for (let e, t = 0; t < r.length; t++) e = r[t], e.row > s || (u >= e.index ? (i += e.cs, u += e.cs, e.rs -= 1, e.row = s + 1, e.rs < 1 && (r.splice(t, 1), t--)) : h === g - 1 && (e.rs -= 1, e.row = s + 1, e.rs < 1 && (r.splice(t, 1), t--)));
                                    if (s === o && h === l) {
                                        n._logical_cellIndex = u;
                                        break
                                    }
                                    d > 0 && a.push({
                                        index: u,
                                        cs: c + 1,
                                        rs: d,
                                        row: -1
                                    }), i += c
                                }
                                r = r.concat(a).sort((function(e, t) {
                                    return e.index - t.index
                                })), a = []
                            }
                            a = null, r = null
                        }
                    },
                    editTable: function(e, t) {
                        const n = this.plugins.table,
                            i = this.context.table,
                            l = i._element,
                            s = "row" === e;
                        if (s) {
                            const e = i._trElement.parentNode;
                            if (/^THEAD$/i.test(e.nodeName)) {
                                if ("up" === t) return;
                                if (!e.nextElementSibling || !/^TBODY$/i.test(e.nextElementSibling.nodeName)) return void(l.innerHTML += "<tbody><tr>" + n.createCells.call(this, "td", i._logical_cellCnt, !1) + "</tr></tbody>")
                            }
                        }
                        if (n._ref) {
                            const e = i._tdElement,
                                l = n._selectedCells;
                            if (s)
                                if (t) n.setCellInfo.call(this, "up" === t ? l[0] : l[l.length - 1], !0), n.editRow.call(this, t, e);
                                else {
                                    let e = l[0].parentNode;
                                    const i = [l[0]];
                                    for (let t, n = 1, s = l.length; n < s; n++) t = l[n], e !== t.parentNode && (i.push(t), e = t.parentNode);
                                    for (let e = 0, l = i.length; e < l; e++) n.setCellInfo.call(this, i[e], !0), n.editRow.call(this, t)
                                }
                            else {
                                const i = l[0].parentNode;
                                if (t) {
                                    let s = null;
                                    for (let e = 0, t = l.length - 1; e < t; e++)
                                        if (i !== l[e + 1].parentNode) {
                                            s = l[e];
                                            break
                                        } n.setCellInfo.call(this, "left" === t ? l[0] : s || l[0], !0), n.editCell.call(this, t, e)
                                } else {
                                    const e = [l[0]];
                                    for (let t, n = 1, s = l.length; n < s && (t = l[n], i === t.parentNode); n++) e.push(t);
                                    for (let i = 0, l = e.length; i < l; i++) n.setCellInfo.call(this, e[i], !0), n.editCell.call(this, t)
                                }
                            }
                            t || n.init.call(this)
                        } else n[s ? "editRow" : "editCell"].call(this, t);
                        if (!t) {
                            const e = l.children;
                            for (let t = 0; t < e.length; t++) 0 === e[t].children.length && (this.util.removeItem(e[t]), t--);
                            0 === l.children.length && this.util.removeItem(l)
                        }
                    },
                    editRow: function(e, t) {
                        const n = this.context.table,
                            i = !e,
                            l = "up" === e,
                            s = n._rowIndex,
                            o = i || l ? s : s + n._current_rowSpan + 1,
                            a = i ? -1 : 1,
                            r = n._trElements;
                        let c = n._logical_cellCnt;
                        for (let e, t = 0, n = s + (i ? -1 : 0); t <= n; t++) {
                            if (e = r[t].cells, 0 === e.length) return;
                            for (let n, i, l = 0, s = e.length; l < s; l++) n = e[l].rowSpan, i = e[l].colSpan, n < 2 && i < 2 || n + t > o && o > t && (e[l].rowSpan = n + a, c -= i)
                        }
                        if (i) {
                            const e = r[s + 1];
                            if (e) {
                                const t = [];
                                let n = r[s].cells,
                                    i = 0;
                                for (let e, l, s = 0, o = n.length; s < o; s++) e = n[s], l = s + i, i += e.colSpan - 1, e.rowSpan > 1 && (e.rowSpan -= 1, t.push({
                                    cell: e.cloneNode(!1),
                                    index: l
                                }));
                                if (t.length > 0) {
                                    let l = t.shift();
                                    n = e.cells, i = 0;
                                    for (let s, o, a = 0, r = n.length; a < r && (s = n[a], o = a + i, i += s.colSpan - 1, !(o >= l.index) || (a--, i--, i += l.cell.colSpan - 1, e.insertBefore(l.cell, s), l = t.shift(), l)); a++);
                                    if (l) {
                                        e.appendChild(l.cell);
                                        for (let n = 0, i = t.length; n < i; n++) e.appendChild(t[n].cell)
                                    }
                                }
                            }
                            n._element.deleteRow(o)
                        } else {
                            n._element.insertRow(o).innerHTML = this.plugins.table.createCells.call(this, "td", c, !1)
                        }
                        i ? this.controllersOff() : this.plugins.table.setPositionControllerDiv.call(this, t || n._tdElement, !0)
                    },
                    editCell: function(e, t) {
                        const n = this.context.table,
                            i = this.util,
                            l = !e,
                            s = "left" === e,
                            o = n._current_colSpan,
                            a = l || s ? n._logical_cellIndex : n._logical_cellIndex + o + 1,
                            r = n._trElements;
                        let c = [],
                            d = [],
                            u = 0;
                        const h = [],
                            g = [];
                        for (let e, t, s, p, m, f, _ = 0, b = n._rowCnt; _ < b; _++) {
                            e = r[_], t = a, m = !1, s = e.cells, f = 0;
                            for (let e, n, r, p, b = 0, v = s.length; b < v && (e = s[b], e); b++)
                                if (n = e.rowSpan - 1, r = e.colSpan - 1, l) {
                                    if (p = b + f, d.length > 0) {
                                        const e = !s[b + 1];
                                        for (let t, n = 0; n < d.length; n++) t = d[n], t.row > _ || (p >= t.index ? (f += t.cs, p = b + f, t.rs -= 1, t.row = _ + 1, t.rs < 1 && (d.splice(n, 1), n--)) : e && (t.rs -= 1, t.row = _ + 1, t.rs < 1 && (d.splice(n, 1), n--)))
                                    }
                                    n > 0 && c.push({
                                        rs: n,
                                        cs: r + 1,
                                        index: p,
                                        row: -1
                                    }), p >= t && p + r <= t + o ? h.push(e) : p <= t + o && p + r >= t ? e.colSpan -= i.getOverlapRangeAtIndex(a, a + o, p, p + r) : n > 0 && (p < t || p + r > t + o) && g.push({
                                        cell: e,
                                        i: _,
                                        rs: _ + n
                                    }), f += r
                                } else {
                                    if (b >= t) break;
                                    if (r > 0) {
                                        if (u < 1 && r + b >= t) {
                                            e.colSpan += 1, t = null, u = n + 1;
                                            break
                                        }
                                        t -= r
                                    }
                                    if (!m) {
                                        for (let e, n = 0; n < d.length; n++) e = d[n], t -= e.cs, e.rs -= 1, e.rs < 1 && (d.splice(n, 1), n--);
                                        m = !0
                                    }
                                } if (d = d.concat(c).sort((function(e, t) {
                                    return e.index - t.index
                                })), c = [], !l) {
                                if (u > 0) {
                                    u -= 1;
                                    continue
                                }
                                null !== t && s.length > 0 && (p = this.plugins.table.createCells.call(this, s[0].nodeName, 0, !0), p = e.insertBefore(p, s[t]))
                            }
                        }
                        if (l) {
                            let e, t;
                            for (let n, l = 0, s = h.length; l < s; l++) n = h[l].parentNode, i.removeItem(h[l]), 0 === n.cells.length && (e || (e = i.getArrayIndex(r, n)), t = i.getArrayIndex(r, n), i.removeItem(n));
                            for (let n, l = 0, s = g.length; l < s; l++) n = g[l], n.cell.rowSpan = i.getOverlapRangeAtIndex(e, t, n.i, n.rs);
                            this.controllersOff()
                        } else this.plugins.table.setPositionControllerDiv.call(this, t || n._tdElement, !0)
                    },
                    _closeSplitMenu: null,
                    openSplitMenu: function() {
                        this.util.addClass(this.context.table.splitButton, "on"), this.context.table.splitMenu.style.display = "inline-table", this.plugins.table._closeSplitMenu = function() {
                            this.util.removeClass(this.context.table.splitButton, "on"), this.context.table.splitMenu.style.display = "none", this.removeDocEvent("mousedown", this.plugins.table._closeSplitMenu), this.plugins.table._closeSplitMenu = null
                        }.bind(this), this.addDocEvent("mousedown", this.plugins.table._closeSplitMenu)
                    },
                    splitCells: function(e) {
                        const t = this.util,
                            n = "vertical" === e,
                            i = this.context.table,
                            l = i._tdElement,
                            s = i._trElements,
                            o = i._trElement,
                            a = i._logical_cellIndex,
                            r = i._rowIndex,
                            c = this.plugins.table.createCells.call(this, l.nodeName, 0, !0);
                        if (n) {
                            const e = l.colSpan;
                            if (c.rowSpan = l.rowSpan, e > 1) c.colSpan = this._w.Math.floor(e / 2), l.colSpan = e - c.colSpan, o.insertBefore(c, l.nextElementSibling);
                            else {
                                let t = [],
                                    n = [];
                                for (let o, r, c = 0, d = i._rowCnt; c < d; c++) {
                                    o = s[c].cells, r = 0;
                                    for (let i, s, d, u, h = 0, g = o.length; h < g; h++) {
                                        if (i = o[h], s = i.colSpan - 1, d = i.rowSpan - 1, u = h + r, n.length > 0)
                                            for (let e, t = 0; t < n.length; t++) e = n[t], e.row > c || (u >= e.index ? (r += e.cs, u += e.cs, e.rs -= 1, e.row = c + 1, e.rs < 1 && (n.splice(t, 1), t--)) : h === g - 1 && (e.rs -= 1, e.row = c + 1, e.rs < 1 && (n.splice(t, 1), t--)));
                                        if (u <= a && d > 0 && t.push({
                                                index: u,
                                                cs: s + 1,
                                                rs: d,
                                                row: -1
                                            }), i !== l && u <= a && u + s >= a + e - 1) {
                                            i.colSpan += 1;
                                            break
                                        }
                                        if (u > a) break;
                                        r += s
                                    }
                                    n = n.concat(t).sort((function(e, t) {
                                        return e.index - t.index
                                    })), t = []
                                }
                                o.insertBefore(c, l.nextElementSibling)
                            }
                        } else {
                            const e = l.rowSpan;
                            if (c.colSpan = l.colSpan, e > 1) {
                                c.rowSpan = this._w.Math.floor(e / 2);
                                const n = e - c.rowSpan,
                                    i = [],
                                    r = t.getArrayIndex(s, o) + n;
                                for (let e, t, n = 0; n < r; n++) {
                                    e = s[n].cells, t = 0;
                                    for (let l, s, o, c = 0, d = e.length; c < d && (o = c + t, !(o >= a)); c++) l = e[c], s = l.rowSpan - 1, s > 0 && s + n >= r && o < a && i.push({
                                        index: o,
                                        cs: l.colSpan
                                    }), t += l.colSpan - 1
                                }
                                const d = s[r],
                                    u = d.cells;
                                let h = i.shift();
                                for (let e, t, n, l, s = 0, o = u.length, r = 0; s < o; s++) {
                                    if (n = s + r, e = u[s], t = e.colSpan - 1, l = n + t + 1, h && l >= h.index && (r += h.cs, l += h.cs, h = i.shift()), l >= a || s === o - 1) {
                                        d.insertBefore(c, e.nextElementSibling);
                                        break
                                    }
                                    r += t
                                }
                                l.rowSpan = n
                            } else {
                                c.rowSpan = l.rowSpan;
                                const e = t.createElement("TR");
                                e.appendChild(c);
                                for (let e, t = 0; t < r; t++) {
                                    if (e = s[t].cells, 0 === e.length) return;
                                    for (let n = 0, i = e.length; n < i; n++) t + e[n].rowSpan - 1 >= r && (e[n].rowSpan += 1)
                                }
                                const n = i._physical_cellIndex,
                                    a = o.cells;
                                for (let e = 0, t = a.length; e < t; e++) e !== n && (a[e].rowSpan += 1);
                                o.parentNode.insertBefore(e, o.nextElementSibling)
                            }
                        }
                        this.focusEdge(l), this.plugins.table.setPositionControllerDiv.call(this, l, !0)
                    },
                    mergeCells: function() {
                        const e = this.plugins.table,
                            t = this.context.table,
                            n = this.util,
                            i = e._ref,
                            l = e._selectedCells,
                            s = l[0];
                        let o = null,
                            a = null,
                            r = i.ce - i.cs + 1,
                            c = i.re - i.rs + 1,
                            d = "",
                            u = null;
                        for (let e, t, i = 1, s = l.length; i < s; i++) {
                            e = l[i], u !== e.parentNode && (u = e.parentNode), t = e.children;
                            for (let e = 0, i = t.length; e < i; e++) n.isFormatElement(t[e]) && n.onlyZeroWidthSpace(t[e].textContent) && n.removeItem(t[e]);
                            d += e.innerHTML, n.removeItem(e), 0 === u.cells.length && (o ? a = u : o = u, c -= 1)
                        }
                        if (o) {
                            const e = t._trElements,
                                i = n.getArrayIndex(e, o),
                                l = n.getArrayIndex(e, a || o),
                                s = [];
                            for (let t, o = 0; o <= l; o++)
                                if (t = e[o].cells, 0 !== t.length)
                                    for (let e, s, a = 0, r = t.length; a < r; a++) e = t[a], s = e.rowSpan - 1, s > 0 && o + s >= i && (e.rowSpan -= n.getOverlapRangeAtIndex(i, l, o, o + s));
                                else s.push(e[o]);
                            for (let e = 0, t = s.length; e < t; e++) n.removeItem(s[e])
                        }
                        s.innerHTML += d, s.colSpan = r, s.rowSpan = c, this.controllersOff(), e.setActiveButton.call(this, !0, !1), e.call_controller_tableEdit.call(this, s), n.addClass(s, "se-table-selected-cell"), this.focusEdge(s)
                    },
                    toggleHeader: function() {
                        const e = this.util,
                            t = this.context.table.headerButton,
                            n = e.hasClass(t, "active"),
                            i = this.context.table._element;
                        if (n) e.removeItem(i.querySelector("thead"));
                        else {
                            const t = e.createElement("THEAD");
                            t.innerHTML = "<tr>" + this.plugins.table.createCells.call(this, "th", this.context.table._logical_cellCnt, !1) + "</tr>", i.insertBefore(t, i.firstElementChild)
                        }
                        e.toggleClass(t, "active"), /TH/i.test(this.context.table._tdElement.nodeName) ? this.controllersOff() : this.plugins.table.setPositionControllerDiv.call(this, this.context.table._tdElement, !1)
                    },
                    setTableStyle: function(e) {
                        const t = this.context.table,
                            n = t._element;
                        let i, l, s, o;
                        e.indexOf("width") > -1 && (i = t.resizeButton.querySelector("svg"), l = t.resizeText, t._maxWidth ? (s = t.icons.reduction, o = t.minText, t.columnFixedButton.style.display = "block", this.util.removeClass(n, "se-table-size-auto"), this.util.addClass(n, "se-table-size-100")) : (s = t.icons.expansion, o = t.maxText, t.columnFixedButton.style.display = "none", this.util.removeClass(n, "se-table-size-100"), this.util.addClass(n, "se-table-size-auto")), this.util.changeElement(i, s), this.util.changeTxt(l, o)), e.indexOf("column") > -1 && (t._fixedColumn ? (this.util.removeClass(n, "se-table-layout-auto"), this.util.addClass(n, "se-table-layout-fixed"), this.util.addClass(t.columnFixedButton, "active")) : (this.util.removeClass(n, "se-table-layout-fixed"), this.util.addClass(n, "se-table-layout-auto"), this.util.removeClass(t.columnFixedButton, "active")))
                    },
                    setActiveButton: function(e, t) {
                        const n = this.context.table;
                        /^TH$/i.test(e.nodeName) ? (n.insertRowAboveButton.setAttribute("disabled", !0), n.insertRowBelowButton.setAttribute("disabled", !0)) : (n.insertRowAboveButton.removeAttribute("disabled"), n.insertRowBelowButton.removeAttribute("disabled")), t && e !== t ? (n.splitButton.setAttribute("disabled", !0), n.mergeButton.removeAttribute("disabled")) : (n.splitButton.removeAttribute("disabled"), n.mergeButton.setAttribute("disabled", !0))
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
                        this._antiBlur = !0;
                        const t = this.plugins.table,
                            n = this.util.getParentElement(e.target, this.util.isCell);
                        if (t._shift) n === t._fixedCell ? t._toggleEditor.call(this, !0) : t._toggleEditor.call(this, !1);
                        else if (!t._ref) {
                            if (n === t._fixedCell) return;
                            t._toggleEditor.call(this, !1)
                        }
                        n && n !== t._selectedCell && t._fixedCellName === n.nodeName && t._selectedTable === this.util.getParentElement(n, "TABLE") && (t._selectedCell = n, t._setMultiCells.call(this, t._fixedCell, n))
                    },
                    _setMultiCells: function(e, t) {
                        const n = this.plugins.table,
                            i = n._selectedTable.rows,
                            l = this.util,
                            s = n._selectedTable.querySelectorAll(".se-table-selected-cell");
                        for (let e = 0, t = s.length; e < t; e++) l.removeClass(s[e], "se-table-selected-cell");
                        if (e === t && (l.addClass(e, "se-table-selected-cell"), !n._shift)) return;
                        let o = !0,
                            a = [],
                            r = [];
                        const c = n._ref = {
                            _i: 0,
                            cs: null,
                            ce: null,
                            rs: null,
                            re: null
                        };
                        for (let n, s, d = 0, u = i.length; d < u; d++) {
                            n = i[d].cells, s = 0;
                            for (let i, u, h, g, p = 0, m = n.length; p < m; p++) {
                                if (i = n[p], h = i.colSpan - 1, g = i.rowSpan - 1, u = p + s, a.length > 0)
                                    for (let e, t = 0; t < a.length; t++) e = a[t], e.row > d || (u >= e.index ? (s += e.cs, u += e.cs, e.rs -= 1, e.row = d + 1, e.rs < 1 && (a.splice(t, 1), t--)) : p === m - 1 && (e.rs -= 1, e.row = d + 1, e.rs < 1 && (a.splice(t, 1), t--)));
                                if (o) {
                                    if (i !== e && i !== t || (c.cs = null !== c.cs && c.cs < u ? c.cs : u, c.ce = null !== c.ce && c.ce > u + h ? c.ce : u + h, c.rs = null !== c.rs && c.rs < d ? c.rs : d, c.re = null !== c.re && c.re > d + g ? c.re : d + g, c._i += 1), 2 === c._i) {
                                        o = !1, a = [], r = [], d = -1;
                                        break
                                    }
                                } else if (l.getOverlapRangeAtIndex(c.cs, c.ce, u, u + h) && l.getOverlapRangeAtIndex(c.rs, c.re, d, d + g)) {
                                    const e = c.cs < u ? c.cs : u,
                                        t = c.ce > u + h ? c.ce : u + h,
                                        n = c.rs < d ? c.rs : d,
                                        s = c.re > d + g ? c.re : d + g;
                                    if (c.cs !== e || c.ce !== t || c.rs !== n || c.re !== s) {
                                        c.cs = e, c.ce = t, c.rs = n, c.re = s, d = -1, a = [], r = [];
                                        break
                                    }
                                    l.addClass(i, "se-table-selected-cell")
                                }
                                g > 0 && r.push({
                                    index: u,
                                    cs: h + 1,
                                    rs: g,
                                    row: -1
                                }), s += i.colSpan - 1
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
                        const n = this.plugins.table;
                        n._removeEvents.call(this), this.controllersOff(), n._shift = t, n._fixedCell = e, n._fixedCellName = e.nodeName, n._selectedTable = this.util.getParentElement(e, "TABLE");
                        const i = n._selectedTable.querySelectorAll(".se-table-selected-cell");
                        for (let e = 0, t = i.length; e < t; e++) this.util.removeClass(i[e], "se-table-selected-cell");
                        this.util.addClass(e, "se-table-selected-cell"), n._bindOnSelect = n._onCellMultiSelect.bind(this), n._bindOffSelect = n._offCellMultiSelect.bind(this), t ? (n._bindOffShift = function() {
                            this.controllersOn(this.context.table.resizeDiv, this.context.table.tableController, this.plugins.table.init.bind(this), this.focus.bind(this), e, "table"), n._ref || this.controllersOff()
                        }.bind(this), this._wd.addEventListener("keyup", n._bindOffShift, !1), this._wd.addEventListener("mousedown", n._bindOnSelect, !1)) : this._wd.addEventListener("mousemove", n._bindOnSelect, !1), this._wd.addEventListener("mouseup", n._bindOffSelect, !1), n._initBind = n.init.bind(this), this._wd.addEventListener("touchmove", n._initBind, !1)
                    },
                    onClick_tableController: function(e) {
                        e.stopPropagation();
                        const t = e.target.getAttribute("data-command") ? e.target : e.target.parentNode;
                        if (t.getAttribute("disabled")) return;
                        const n = t.getAttribute("data-command"),
                            i = t.getAttribute("data-value"),
                            l = t.getAttribute("data-option"),
                            s = this.plugins.table;
                        if ("function" == typeof s._closeSplitMenu && (s._closeSplitMenu(), "onsplit" === n)) return;
                        if (!n) return;
                        e.preventDefault();
                        const o = this.context.table;
                        switch (n) {
                            case "insert":
                            case "delete":
                                s.editTable.call(this, i, l);
                                break;
                            case "header":
                                s.toggleHeader.call(this);
                                break;
                            case "onsplit":
                                s.openSplitMenu.call(this);
                                break;
                            case "split":
                                s.splitCells.call(this, i);
                                break;
                            case "merge":
                                s.mergeCells.call(this);
                                break;
                            case "resize":
                                o._maxWidth = !o._maxWidth, s.setTableStyle.call(this, "width"), s.setPositionControllerTop.call(this, o._element), s.setPositionControllerDiv.call(this, o._tdElement, s._shift);
                                break;
                            case "layout":
                                o._fixedColumn = !o._fixedColumn, s.setTableStyle.call(this, "column"), s.setPositionControllerTop.call(this, o._element), s.setPositionControllerDiv.call(this, o._tdElement, s._shift);
                                break;
                            case "remove":
                                const e = o._element.parentNode;
                                this.util.removeItem(o._element), this.controllersOff(), e !== this.context.element.wysiwyg && this.util.removeItemAllParents(e, (function(e) {
                                    return 0 === e.childNodes.length
                                }), null)
                        }
                        this.focus(), this.history.push(!1)
                    }
                },
                formatBlock: {
                    name: "formatBlock",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.formatBlock = {
                            targetText: t.querySelector(".txt"),
                            targetTooltip: t.parentNode.querySelector(".se-tooltip-text"),
                            _formatList: null,
                            currentFormat: ""
                        };
                        let i = this.setSubmenu.call(e);
                        i.querySelector("ul").addEventListener("click", this.pickUp.bind(e)), n.formatBlock._formatList = i.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang.toolbar,
                            n = this.util.createElement("DIV");
                        n.className = "se-submenu se-list-layer";
                        const i = ["p", "div", "blockquote", "pre", "h1", "h2", "h3", "h4", "h5", "h6"],
                            l = e.formats && 0 !== e.formats.length ? e.formats : i;
                        let s = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, n, o, a, r, c, d, u = 0, h = l.length; u < h; u++) e = l[u], "string" == typeof e && i.indexOf(e) > -1 ? (n = e.toLowerCase(), o = "blockquote" === n ? "range" : "pre" === n ? "free" : "replace", r = /^h/.test(n) ? n.match(/\d+/)[0] : "", a = t["tag_" + (r ? "h" : n)] + r, d = "", c = "") : (n = e.tag.toLowerCase(), o = e.command, a = e.name || n, d = e.class, c = d ? ' class="' + d + '"' : ""), s += '<li><button type="button" class="se-btn-list" data-command="' + o + '" data-value="' + n + '" data-class="' + d + '" title="' + a + '"><' + n + c + ">" + a + "</" + n + "></button></li>";
                        return s += "</ul></div>", n.innerHTML = s, n
                    },
                    active: function(e) {
                        let t = this.lang.toolbar.formats;
                        const n = this.context.formatBlock.targetText,
                            i = this.context.formatBlock.targetTooltip;
                        if (e) {
                            if (this.util.isFormatElement(e)) {
                                const l = this.context.formatBlock._formatList,
                                    s = e.nodeName.toLowerCase(),
                                    o = (e.className.match(/(\s|^)__se__format__[^\s]+/) || [""])[0].trim();
                                for (let e, n = 0, i = l.length; n < i; n++)
                                    if (e = l[n], s === e.getAttribute("data-value") && o === e.getAttribute("data-class")) {
                                        t = e.title;
                                        break
                                    } return this.util.changeTxt(n, t), this.util.changeTxt(i, t), n.setAttribute("data-value", s), n.setAttribute("data-class", o), !0
                            }
                        } else this.util.changeTxt(n, t), this.util.changeTxt(i, t);
                        return !1
                    },
                    on: function() {
                        const e = this.context.formatBlock,
                            t = e._formatList,
                            n = e.targetText,
                            i = (n.getAttribute("data-value") || "") + (n.getAttribute("data-class") || "");
                        if (i !== e.currentFormat) {
                            for (let e, n = 0, l = t.length; n < l; n++) e = t[n], i === e.getAttribute("data-value") + e.getAttribute("data-class") ? this.util.addClass(e, "active") : this.util.removeClass(e, "active");
                            e.currentFormat = i
                        }
                    },
                    pickUp: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = null,
                            i = null,
                            l = null,
                            s = "";
                        for (; !n && !/UL/i.test(t.tagName);) {
                            if (n = t.getAttribute("data-command"), i = t.getAttribute("data-value"), s = t.getAttribute("data-class"), n) {
                                l = t.firstChild;
                                break
                            }
                            t = t.parentNode
                        }
                        if (n) {
                            if ("range" === n) {
                                const e = l.cloneNode(!1);
                                this.applyRangeFormatElement(e)
                            } else {
                                const e = this.getRange(),
                                    t = e.startOffset,
                                    o = e.endOffset,
                                    a = this.util,
                                    r = this.getSelectedElementsAndComponents(!1);
                                if (0 === r.length) return;
                                let c = r[0],
                                    d = r[r.length - 1];
                                const u = a.getNodePath(e.startContainer, c, null, null),
                                    h = a.getNodePath(e.endContainer, d, null, null),
                                    g = this.detachList(r, !1);
                                g.sc && (c = g.sc), g.ec && (d = g.ec), this.setRange(a.getNodeFromPath(u, c), t, a.getNodeFromPath(h, d), o);
                                const p = this.getSelectedElementsAndComponents(!1);
                                if ("free" === n) {
                                    const e = p.length - 1;
                                    let t = p[e].parentNode,
                                        n = l.cloneNode(!1);
                                    const i = n;
                                    for (let i, s, o, r, c, d, u = e, h = !0; u >= 0; u--)
                                        if (i = p[u], i !== (p[u + 1] ? p[u + 1].parentNode : null)) {
                                            if (d = a.isComponent(i), s = d ? "" : i.innerHTML.replace(/(?!>)\s+(?=<)|\n/g, " "), o = a.getParentElement(i, (function(e) {
                                                    return e.parentNode === t
                                                })), (t !== i.parentNode || d) && (a.isFormatElement(t) ? (t.parentNode.insertBefore(n, t.nextSibling), t = t.parentNode) : (t.insertBefore(n, o ? o.nextSibling : null), t = i.parentNode), r = n.nextSibling, r && n.nodeName === r.nodeName && a.isSameAttributes(n, r) && (n.innerHTML += "<BR>" + r.innerHTML, a.removeItem(r)), n = l.cloneNode(!1), h = !0), c = n.innerHTML, n.innerHTML = (h || !s || !c || /<br>$/i.test(s) ? s : s + "<BR>") + c, 0 === u) {
                                                t.insertBefore(n, i), r = i.nextSibling, r && n.nodeName === r.nodeName && a.isSameAttributes(n, r) && (n.innerHTML += "<BR>" + r.innerHTML, a.removeItem(r));
                                                const e = n.previousSibling;
                                                e && n.nodeName === e.nodeName && a.isSameAttributes(n, e) && (e.innerHTML += "<BR>" + n.innerHTML, a.removeItem(n))
                                            }
                                            d || a.removeItem(i), s && (h = !1)
                                        } this.setRange(i, 0, i, 0)
                                } else {
                                    for (let e, t, n = 0, o = p.length; n < o; n++) e = p[n], e.nodeName.toLowerCase() === i.toLowerCase() && (e.className.match(/(\s|^)__se__format__[^\s]+/) || [""])[0].trim() === s || a.isComponent(e) || (t = l.cloneNode(!1), a.copyFormatAttributes(t, e), t.innerHTML = e.innerHTML, e.parentNode.replaceChild(t, e)), 0 === n && (c = t || e), n === o - 1 && (d = t || e), t = null;
                                    this.setRange(a.getNodeFromPath(u, c), t, a.getNodeFromPath(h, d), o)
                                }
                                this.history.push(!1)
                            }
                            this.submenuOff()
                        }
                    }
                },
                lineHeight: {
                    name: "lineHeight",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.lineHeight = {
                            _sizeList: null,
                            currentSize: -1
                        };
                        let i = this.setSubmenu.call(e),
                            l = i.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), n.lineHeight._sizeList = l.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.lang,
                            n = this.util.createElement("DIV");
                        n.className = "se-submenu se-list-layer";
                        const i = e.lineHeights ? e.lineHeights : [{
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
                        for (let e, t = 0, n = i.length; t < n; t++) e = i[t], l += '<li><button type="button" class="se-btn-list" data-value="' + e.value + '" title="' + e.text + '">' + e.text + "</button></li>";
                        return l += "</ul></div>", n.innerHTML = l, n
                    },
                    on: function() {
                        const e = this.context.lineHeight,
                            t = e._sizeList,
                            n = this.util.getFormatElement(this.getSelectionNode()).style.lineHeight + "";
                        if (n !== e.currentSize) {
                            for (let e = 0, i = t.length; e < i; e++) n === t[e].getAttribute("data-value") ? this.util.addClass(t[e], "active") : this.util.removeClass(t[e], "active");
                            e.currentSize = n
                        }
                    },
                    pickup: function(e) {
                        if (!/^BUTTON$/i.test(e.target.tagName)) return !1;
                        e.preventDefault(), e.stopPropagation();
                        const t = e.target.getAttribute("data-value") || "",
                            n = this.getSelectedElements();
                        for (let e = 0, i = n.length; e < i; e++) n[e].style.lineHeight = t;
                        this.submenuOff(), this.history.push(!1)
                    }
                },
                template: o,
                paragraphStyle: {
                    name: "paragraphStyle",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.paragraphStyle = {
                            _classList: null
                        };
                        let i = this.setSubmenu.call(e);
                        i.querySelector("ul").addEventListener("click", this.pickUp.bind(e)), n.paragraphStyle._classList = i.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.util.createElement("DIV");
                        t.className = "se-submenu se-list-layer";
                        const n = this.lang.menu,
                            i = {
                                spaced: {
                                    name: n.spaced,
                                    class: "__se__p-spaced",
                                    _class: ""
                                },
                                bordered: {
                                    name: n.bordered,
                                    class: "__se__p-bordered",
                                    _class: ""
                                },
                                neon: {
                                    name: n.neon,
                                    class: "__se__p-neon",
                                    _class: ""
                                }
                            },
                            l = e.paragraphStyles && 0 !== e.paragraphStyles.length ? e.paragraphStyles : ["spaced", "bordered", "neon"];
                        let s = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, t, n, o, a = 0, r = l.length; a < r; a++) {
                            if (e = l[a], "string" == typeof e) {
                                const t = i[e.toLowerCase()];
                                if (!t) continue;
                                e = t
                            }
                            t = e.name, n = e.class ? ' class="' + e.class + '"' : "", o = e._class, s += '<li><button type="button" class="se-btn-list' + (o ? " " + o : "") + '" data-value="' + e.class + '" title="' + t + '"><div' + n + ">" + t + "</div></button></li>"
                        }
                        return s += "</ul></div>", t.innerHTML = s, t
                    },
                    on: function() {
                        const e = this.context.paragraphStyle._classList,
                            t = this.util.getFormatElement(this.getSelectionNode());
                        for (let n = 0, i = e.length; n < i; n++) this.util.hasClass(t, e[n].getAttribute("data-value")) ? this.util.addClass(e[n], "active") : this.util.removeClass(e[n], "active")
                    },
                    pickUp: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = null;
                        for (; !/^UL$/i.test(t.tagName) && (n = t.getAttribute("data-value"), !n);) t = t.parentNode;
                        if (!n) return;
                        let i = this.getSelectedElements();
                        if (0 === i.length) return;
                        const l = this.util.hasClass(t, "active") ? this.util.removeClass.bind(this.util) : this.util.addClass.bind(this.util);
                        i = this.getSelectedElements();
                        for (let e = 0, t = i.length; e < t; e++) l(i[e], n);
                        this.submenuOff(), this.history.push(!1)
                    }
                },
                textStyle: {
                    name: "textStyle",
                    display: "submenu",
                    add: function(e, t) {
                        const n = e.context;
                        n.textStyle = {
                            _styleList: null
                        };
                        let i = this.setSubmenu.call(e),
                            l = i.querySelector("ul");
                        l.addEventListener("click", this.pickup.bind(e)), n.textStyle._styleList = i.querySelectorAll("li button"), e.initMenuTarget(this.name, t, i), i = null, l = null
                    },
                    setSubmenu: function() {
                        const e = this.context.option,
                            t = this.util.createElement("DIV");
                        t.className = "se-submenu se-list-layer";
                        const n = {
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
                            i = e.textStyles ? e.textStyles : ["translucent", "shadow"];
                        let l = '<div class="se-list-inner"><ul class="se-list-basic se-list-format">';
                        for (let e, t, s, o, a, r, c, d = 0, u = i.length; d < u; d++) {
                            if (e = i[d], o = "", r = "", a = [], "string" == typeof e) {
                                const t = n[e.toLowerCase()];
                                if (!t) continue;
                                e = t
                            }
                            s = e.name, t = e.tag || "span", c = e._class, e.style && (o += ' style="' + e.style + '"', r += e.style.replace(/:[^;]+(;|$)\s*/g, ","), a.push("style")), e.class && (o += ' class="' + e.class + '"', r += "." + e.class.trim().replace(/\s+/g, ",."), a.push("class")), r = r.replace(/,$/, ""), l += '<li><button type="button" class="se-btn-list' + (c ? " " + c : "") + '" data-command="' + t + '" data-value="' + r + '" title="' + s + '"><' + t + o + ">" + s + "</" + t + "></button></li>"
                        }
                        return l += "</ul></div>", t.innerHTML = l, t
                    },
                    on: function() {
                        const e = this.util,
                            t = this.context.textStyle._styleList,
                            n = this.getSelectionNode();
                        for (let i, l, s, o = 0, a = t.length; o < a; o++) {
                            i = t[o], l = i.getAttribute("data-value").split(",");
                            for (let t, o, a = 0; a < l.length; a++) {
                                for (t = n, s = !1; !e.isFormatElement(t);) {
                                    if (t.nodeName.toLowerCase() === i.getAttribute("data-command").toLowerCase() && (o = l[a], /^\./.test(o) ? e.hasClass(t, o.replace(/^\./, "")) : t.style[o])) {
                                        s = !0;
                                        break
                                    }
                                    t = t.parentNode
                                }
                                if (!s) break
                            }
                            s ? e.addClass(i, "active") : e.removeClass(i, "active")
                        }
                    },
                    pickup: function(e) {
                        e.preventDefault(), e.stopPropagation();
                        let t = e.target,
                            n = null,
                            i = null;
                        for (; !n && !/UL/i.test(t.tagName);) {
                            if (n = t.getAttribute("data-command"), n) {
                                i = t.firstChild;
                                break
                            }
                            t = t.parentNode
                        }
                        if (!n) return;
                        const l = i.style.cssText.replace(/:.+(;|$)/g, ",").split(",");
                        l.pop();
                        const s = i.classList;
                        for (let e = 0, t = s.length; e < t; e++) l.push("." + s[e]);
                        const o = this.util.hasClass(t, "active") ? null : i.cloneNode(!1),
                            a = o ? null : [i.nodeName];
                        this.nodeChange(o, l, a, !0), this.submenuOff()
                    }
                },
                link: c,
                image: {
                    name: "image",
                    display: "dialog",
                    add: function(e) {
                        e.addModule([r.a, u.a]);
                        const t = e.context,
                            n = t.image = {
                                _imagesInfo: [],
                                _imageIndex: 0,
                                sizeUnit: t.option._imageSizeUnit,
                                _altText: "",
                                _linkElement: null,
                                _linkValue: "",
                                _align: "none",
                                _floatClassRegExp: "__se__float\\-[a-z]+",
                                _uploadFileLength: 0,
                                _xmlHttp: null,
                                inputX: null,
                                inputY: null,
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
                                _origin_h: "auto" === t.option.imageHeight ? "" : t.option.imageHeight,
                                _proportionChecked: !0,
                                _resizing: t.option.imageResizing,
                                _resizeDotHide: !t.option.imageHeightShow,
                                _rotation: t.option.imageRotation,
                                _onlyPercentage: t.option.imageSizeOnlyPercentage,
                                _ratio: !1,
                                _ratioX: 1,
                                _ratioY: 1,
                                _captionShow: !0,
                                _captionChecked: !1,
                                _caption: null,
                                captionCheckEl: null
                            };
                        let i = this.setDialog.call(e);
                        n.modal = i, n.imgInputFile = i.querySelector("._se_image_file"), n.imgUrlFile = i.querySelector(".se-input-url"), n.focusElement = n.imgInputFile || n.imgUrlFile, n.altText = i.querySelector("._se_image_alt"), n.imgLink = i.querySelector("._se_image_link"), n.imgLinkNewWindowCheck = i.querySelector("._se_image_link_check"), n.captionCheckEl = i.querySelector("._se_image_check_caption"), i.querySelector(".se-dialog-tabs").addEventListener("click", this.openTab.bind(e)), i.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), i.querySelector(".se-dialog-files-remove").addEventListener("click", this._removeSelectedFiles.bind(e, n.imgInputFile, n.imgUrlFile)), n.imgInputFile && n.imgUrlFile && n.imgInputFile.addEventListener("change", this._fileInputChange.bind(n)), n.proportion = {}, n.inputX = {}, n.inputY = {}, t.option.imageResizing && (n.proportion = i.querySelector("._se_image_check_proportion"), n.inputX = i.querySelector("._se_image_size_x"), n.inputY = i.querySelector("._se_image_size_y"), n.inputX.value = t.option.imageWidth, n.inputY.value = t.option.imageHeight, n.inputX.addEventListener("keyup", this.setInputSize.bind(e, "x")), n.inputY.addEventListener("keyup", this.setInputSize.bind(e, "y")), n.inputX.addEventListener("change", this.setRatio.bind(e)), n.inputY.addEventListener("change", this.setRatio.bind(e)), n.proportion.addEventListener("change", this.setRatio.bind(e)), i.querySelector(".se-dialog-btn-revert").addEventListener("click", this.sizeRevert.bind(e))), t.dialog.modal.appendChild(i), i = null
                    },
                    setDialog: function() {
                        const e = this.context.option,
                            t = this.lang,
                            n = this.util.createElement("DIV");
                        n.className = "se-dialog-content", n.style.display = "none";
                        let i = '<div class="se-dialog-header"><button type="button" data-command="close" class="se-btn se-dialog-close" class="close" aria-label="Close" title="' + t.dialogBox.close + '">' + this.icons.cancel + '</button><span class="se-modal-title">' + t.dialogBox.imageBox.title + '</span></div><div class="se-dialog-tabs"><button type="button" class="_se_tab_link active" data-tab-link="image">' + t.toolbar.image + '</button><button type="button" class="_se_tab_link" data-tab-link="url">' + t.toolbar.link + '</button></div><form class="editor_image" method="post" enctype="multipart/form-data"><div class="_se_tab_content _se_tab_content_image"><div class="se-dialog-body"><div style="border-bottom: 1px dashed #ccc;">';
                        if (e.imageFileInput && (i += '<div class="se-dialog-form"><label>' + t.dialogBox.imageBox.file + '</label><div class="se-dialog-form-files"><input class="se-input-form _se_image_file" type="file" accept="image/*" multiple="multiple" /><button type="button" data-command="filesRemove" class="se-btn se-dialog-files-remove" title="' + t.controller.remove + '">' + this.icons.cancel + "</button></div></div>"), e.imageUrlInput && (i += '<div class="se-dialog-form"><label>' + t.dialogBox.imageBox.url + '</label><input class="se-input-form se-input-url" type="text" /></div>'), i += '</div><div class="se-dialog-form"><label>' + t.dialogBox.imageBox.altText + '</label><input class="se-input-form _se_image_alt" type="text" /></div>', e.imageResizing) {
                            const n = e.imageSizeOnlyPercentage,
                                l = n ? ' style="display: none !important;"' : "",
                                s = e.imageHeightShow ? "" : ' style="display: none !important;"';
                            i += '<div class="se-dialog-form">', n || !e.imageHeightShow ? i += '<div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.size + "</label></div>" : i += '<div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.width + '</label><label class="se-dialog-size-x">&nbsp;</label><label class="size-h">' + t.dialogBox.height + "</label></div>", i += '<input class="se-input-control _se_image_size_x" placeholder="auto"' + (n ? ' type="number" min="1"' : 'type="text"') + (n ? ' max="100"' : "") + ' /><label class="se-dialog-size-x"' + s + ">" + (n ? "%" : "x") + '</label><input type="text" class="se-input-control _se_image_size_y" placeholder="auto"' + l + (n ? ' max="100"' : "") + s + "/><label" + l + s + '><input type="checkbox" class="se-dialog-btn-check _se_image_check_proportion" checked/>&nbsp;' + t.dialogBox.proportion + '</label><button type="button" title="' + t.dialogBox.revertButton + '" class="se-btn se-dialog-btn-revert" style="float: right;">' + this.icons.revert + "</button></div>"
                        }
                        return i += '<div class="se-dialog-form se-dialog-form-footer"><label><input type="checkbox" class="se-dialog-btn-check _se_image_check_caption" />&nbsp;' + t.dialogBox.caption + '</label></div></div></div><div class="_se_tab_content _se_tab_content_url" style="display: none"><div class="se-dialog-body"><div class="se-dialog-form"><label>' + t.dialogBox.linkBox.url + '</label><input class="se-input-form _se_image_link" type="text" /></div><label><input type="checkbox" class="_se_image_link_check"/>&nbsp;' + t.dialogBox.linkBox.newWindowCheck + '</label></div></div><div class="se-dialog-footer"><div><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="none" checked>' + t.dialogBox.basic + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="left">' + t.dialogBox.left + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="center">' + t.dialogBox.center + '</label><label><input type="radio" name="suneditor_image_radio" class="se-dialog-btn-radio" value="right">' + t.dialogBox.right + '</label></div><button type="submit" class="se-btn-primary" title="' + t.dialogBox.submitButton + '"><span>' + t.dialogBox.submitButton + "</span></button></div></form>", n.innerHTML = i, n
                    },
                    _fileInputChange: function() {
                        this.imgInputFile.value ? this.imgUrlFile.setAttribute("disabled", !0) : this.imgUrlFile.removeAttribute("disabled")
                    },
                    _removeSelectedFiles: function(e, t) {
                        e.value = "", t && t.removeAttribute("disabled")
                    },
                    open: function() {
                        this.plugins.dialog.open.call(this, "image", "image" === this.currentControllerName)
                    },
                    openTab: function(e) {
                        const t = this.context.image.modal,
                            n = "init" === e ? t.querySelector("._se_tab_link") : e.target;
                        if (!/^BUTTON$/i.test(n.tagName)) return !1;
                        const i = n.getAttribute("data-tab-link");
                        let l, s, o;
                        for (s = t.getElementsByClassName("_se_tab_content"), l = 0; l < s.length; l++) s[l].style.display = "none";
                        for (o = t.getElementsByClassName("_se_tab_link"), l = 0; l < o.length; l++) this.util.removeClass(o[l], "active");
                        return t.querySelector("._se_tab_content_" + i).style.display = "block", this.util.addClass(n, "active"), "image" === i && this.context.image.focusElement ? this.context.image.focusElement.focus() : "url" === i && this.context.image.imgLink && this.context.image.imgLink.focus(), !1
                    },
                    submitAction: function(e) {
                        if (e.length > 0) {
                            let t = 0;
                            const n = [];
                            for (let i = 0, l = e.length; i < l; i++) /image/i.test(e[i].type) && (n.push(e[i]), t += e[i].size);
                            const i = this.context.option.imageUploadSizeLimit;
                            if (i > 0) {
                                let e = 0;
                                const n = this.context.image._imagesInfo;
                                for (let t = 0, i = n.length; t < i; t++) e += 1 * n[t].size;
                                if (t + e > i) {
                                    const n = "[SUNEDITOR.imageUpload.fail] Size of uploadable total images: " + i / 1e3 + "KB";
                                    return this._imageUploadError(n, {
                                        limitSize: i,
                                        currentSize: e,
                                        uploadSize: t
                                    }) && this.functions.noticeOpen(n), void this.closeLoading()
                                }
                            }
                            const l = this.context.image;
                            l._uploadFileLength = n.length;
                            const s = this.context.option.imageUploadUrl,
                                o = this.context.option.imageUploadHeader,
                                a = this.context.dialog.updateModal ? 1 : n.length,
                                r = {
                                    linkValue: l._linkValue,
                                    linkNewWindow: l.imgLinkNewWindowCheck.checked,
                                    inputWidth: l.inputX.value,
                                    inputHeight: l.inputY.value,
                                    align: l._align,
                                    isUpdate: this.context.dialog.updateModal,
                                    currentImage: l._element
                                };
                            if (!this._imageUploadBefore(n, r)) return;
                            if ("string" == typeof s && s.length > 0) {
                                const e = new FormData;
                                for (let t = 0; t < a; t++) e.append("file-" + t, n[t]);
                                if (l._xmlHttp = this.util.getXMLHttpRequest(), l._xmlHttp.onreadystatechange = this.plugins.image.callBack_imgUpload.bind(this, r), l._xmlHttp.open("post", s, !0), null !== o && "object" == typeof o && this._w.Object.keys(o).length > 0)
                                    for (let e in o) l._xmlHttp.setRequestHeader(e, o[e]);
                                l._xmlHttp.send(e)
                            } else
                                for (let e = 0; e < a; e++) this.plugins.image.setup_reader.call(this, n[e], r.linkValue, r.linkNewWindow, r.inputWidth, r.inputHeight, r.align, e, a - 1)
                        }
                    },
                    onRender_imgInput: function() {
                        try {
                            this.plugins.image.submitAction.call(this, this.context.image.imgInputFile.files)
                        } catch (e) {
                            throw Error('[SUNEDITOR.imageUpload.fail] cause : "' + e.message + '"')
                        } finally {
                            this.closeLoading()
                        }
                    },
                    setup_reader: function(e, t, n, i, l, s, o, a) {
                        const r = new FileReader;
                        this.context.dialog.updateModal && (this.context.image._element.setAttribute("data-file-name", e.name), this.context.image._element.setAttribute("data-file-size", e.size)), r.onload = function(e, c, d) {
                            try {
                                this.context.image.inputX.value = i, this.context.image.inputY.value = l, e ? this.plugins.image.update_src.call(this, r.result, c, d) : this.plugins.image.create_image.call(this, r.result, t, n, i, l, s, d), o === a && this.closeLoading()
                            } catch (e) {
                                throw this.closeLoading(), Error('[SUNEDITOR.imageFileRendering.fail] cause : "' + e.message + '"')
                            }
                        }.bind(this, this.context.dialog.updateModal, this.context.image._element, e), r.readAsDataURL(e)
                    },
                    callBack_imgUpload: function(e) {
                        if (4 === this.context.image._xmlHttp.readyState) {
                            if (200 !== this.context.image._xmlHttp.status) throw this.closeLoading(), Error("[SUNEDITOR.imageUpload.fail] status: " + this.context.image._xmlHttp.status + ", responseText: " + this.context.image._xmlHttp.responseText);
                            if (!this._imageUploadHandler(this.context.image._xmlHttp, e)) {
                                const t = JSON.parse(this.context.image._xmlHttp.responseText);
                                if (t.errorMessage) this._imageUploadError(t.errorMessage, t.result) && this.functions.noticeOpen(t.errorMessage);
                                else {
                                    const n = t.result;
                                    for (let t, i = 0, l = n.length; i < l; i++) t = {
                                        name: n[i].name,
                                        size: n[i].size
                                    }, e.isUpdate ? this.plugins.image.update_src.call(this, n[i].url, e.currentImage, t) : this.plugins.image.create_image.call(this, n[i].url, e.linkValue, e.linkNewWindow, e.inputWidth, e.inputHeight, e.align, t)
                                }
                            }
                            this.closeLoading()
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
                    onRender_link: function(e, t, n) {
                        if (t.trim().length > 0) {
                            const i = this.util.createElement("A");
                            return i.href = /^https?:\/\//.test(t) ? t : "http://" + t, i.target = n ? "_blank" : "", i.setAttribute("data-image-link", "image"), e.setAttribute("data-image-link", t), i.appendChild(e), i
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
                            n = this.plugins.image;
                        this.showLoading(), e.preventDefault(), e.stopPropagation(), t._linkValue = t.imgLink.value, t._altText = t.altText.value, t._align = t.modal.querySelector('input[name="suneditor_image_radio"]:checked').value, t._captionChecked = t.captionCheckEl.checked, t._resizing && (t._proportionChecked = t.proportion.checked);
                        try {
                            this.context.dialog.updateModal && n.update_image.call(this, !1, !1, !1), t.imgInputFile && t.imgInputFile.files.length > 0 ? n.onRender_imgInput.call(this) : t.imgUrlFile && t.imgUrlFile.value.trim().length > 0 ? n.onRender_imgUrl.call(this) : this.closeLoading()
                        } catch (e) {
                            throw this.closeLoading(), Error('[SUNEDITOR.image.submit.fail] cause : "' + e.message + '"')
                        } finally {
                            this.plugins.dialog.close.call(this)
                        }
                        return !1
                    },
                    setImagesInfo: function(e, t) {
                        const n = this.context.resizing._resize_plugin;
                        this.context.resizing._resize_plugin = "image";
                        const i = this.context.image._imagesInfo;
                        let l = e.getAttribute("data-index"),
                            s = null,
                            o = "";
                        if (!l || this._componentsInfoInit) o = "create", l = this.context.image._imageIndex++, e.setAttribute("data-index", l), e.setAttribute("data-file-name", t.name), e.setAttribute("data-file-size", t.size), s = {
                            src: e.src,
                            index: 1 * l,
                            name: t.name,
                            size: t.size
                        }, i.push(s);
                        else {
                            o = "update", l *= 1;
                            for (let e = 0, t = i.length; e < t; e++)
                                if (l === i[e].index) {
                                    s = i[e];
                                    break
                                } s || (l = this.context.image._imageIndex++, s = {
                                index: l
                            }, i.push(s)), s.src = e.src, s.name = e.getAttribute("data-file-name"), s.size = 1 * e.getAttribute("data-file-size")
                        }
                        if (s.element = e, s.delete = this.plugins.image.destroy.bind(this, e), s.select = function() {
                                e.scrollIntoView(!0), this._w.setTimeout(function() {
                                    this.plugins.image.onModifyMode.call(this, e, this.plugins.resizing.call_controller_resize.call(this, e, "image"))
                                }.bind(this))
                            }.bind(this), e.getAttribute("origin-size") || e.setAttribute("origin-size", e.naturalWidth + "," + e.naturalHeight), !e.getAttribute("data-origin")) {
                            const t = this.util.getParentElement(e, this.util.isMediaComponent),
                                n = this.util.getParentElement(e, "FIGURE"),
                                i = this.plugins.resizing._module_getSizeX.call(this, this.context.image, e, n, t),
                                l = this.plugins.resizing._module_getSizeY.call(this, this.context.image, e, n, t);
                            e.setAttribute("data-origin", i + "," + l), e.setAttribute("data-size", i + "," + l)
                        }
                        if (!e.style.width) {
                            const t = (e.getAttribute("data-size") || e.getAttribute("data-origin") || "").split(",");
                            this.plugins.image.onModifyMode.call(this, e, null), this.plugins.image.applySize.call(this, t[0] || this.context.option.imageWidth, t[1] || this.context.option.imageHeight)
                        }
                        this.context.resizing._resize_plugin = n, this._imageUpload(e, l, o, s, --this.context.image._uploadFileLength < 0 ? 0 : this.context.image._uploadFileLength)
                    },
                    checkComponentInfo: function() {
                        const e = [].slice.call(this.context.element.wysiwyg.getElementsByTagName("IMG")),
                            t = this.plugins.image,
                            n = this.context.image._imagesInfo;
                        if (e.length === n.length) {
                            if (this._componentsInfoReset) {
                                for (let n, i = 0, l = e.length; i < l; i++) n = e[i], t.setImagesInfo.call(this, n, {
                                    name: n.getAttribute("data-file-name") || n.src.split("/").pop(),
                                    size: n.getAttribute("data-file-size") || 0
                                });
                                return
                            } {
                                let t = !1;
                                for (let i, l = 0, s = n.length; l < s; l++)
                                    if (i = n[l], 0 === e.filter((function(e) {
                                            return i.src === e.src && i.index.toString() === e.getAttribute("data-index")
                                        })).length) {
                                        t = !0;
                                        break
                                    } if (!t) return
                            }
                        }
                        const i = this.context.resizing._resize_plugin;
                        this.context.resizing._resize_plugin = "image";
                        const l = [],
                            s = [];
                        for (let e = 0, t = n.length; e < t; e++) s[e] = n[e].index;
                        for (let n, i = 0, o = e.length; i < o; i++) n = e[i], this.util.getParentElement(n, this.util.isMediaComponent) ? !n.getAttribute("data-index") || s.indexOf(1 * n.getAttribute("data-index")) < 0 ? (l.push(this.context.image._imageIndex), n.removeAttribute("data-index"), t.setImagesInfo.call(this, n, {
                            name: n.getAttribute("data-file-name") || n.src.split("/").pop(),
                            size: n.getAttribute("data-file-size") || 0
                        })) : l.push(1 * n.getAttribute("data-index")) : (l.push(this.context.image._imageIndex), t.onModifyMode.call(this, n, null), t.openModify.call(this, !0), t.update_image.call(this, !0, !1, !0));
                        for (let e, t = 0; t < n.length; t++) e = n[t].index, l.indexOf(e) > -1 || (n.splice(t, 1), this._imageUpload(null, e, "delete", null, 0), t--);
                        this.context.resizing._resize_plugin = i
                    },
                    resetComponentInfo: function() {
                        this.context.image._imagesInfo = [], this.context.image._imageIndex = 0
                    },
                    create_image: function(e, t, n, i, l, s, o) {
                        const a = this.context.image;
                        this.context.resizing._resize_plugin = "image";
                        let r = this.util.createElement("IMG");
                        r.src = e, r.alt = a._altText, r = this.plugins.image.onRender_link.call(this, r, t, n), r.setAttribute("data-rotate", "0"), a._resizing && r.setAttribute("data-proportion", a._proportionChecked);
                        const c = this.plugins.resizing.set_cover.call(this, r),
                            d = this.plugins.resizing.set_container.call(this, c, "se-image-container");
                        a._captionChecked && (a._caption = this.plugins.resizing.create_caption.call(this), a._caption.setAttribute("contenteditable", !1), c.appendChild(a._caption)), a._element = r, a._cover = c, a._container = d, this.plugins.image.applySize.call(this, i, l), this.plugins.image.setAlign.call(this, s, r, c, d), this.insertComponent(d, !0), this.plugins.image.setImagesInfo.call(this, r, o || {
                            name: r.getAttribute("data-file-name") || r.src.split("/").pop(),
                            size: r.getAttribute("data-file-size") || 0
                        }), this.context.resizing._resize_plugin = ""
                    },
                    update_image: function(e, t, n) {
                        const i = this.context.image,
                            l = i._linkValue;
                        let s, o = i._element,
                            a = i._cover,
                            r = i._container,
                            c = !1;
                        null === a && (c = !0, o = i._element.cloneNode(!0), a = this.plugins.resizing.set_cover.call(this, o)), null === r ? (a = a.cloneNode(!0), o = a.querySelector("img"), c = !0, r = this.plugins.resizing.set_container.call(this, a, "se-image-container")) : c && (r.innerHTML = "", r.appendChild(a));
                        const d = this.util.isNumber(i.inputX.value) ? i.inputX.value + i.sizeUnit : i.inputX.value,
                            u = this.util.isNumber(i.inputY.value) ? i.inputY.value + i.sizeUnit : i.inputY.value;
                        if (s = /%$/.test(o.style.width) ? d !== r.style.width || u !== r.style.height : d !== o.style.width || u !== o.style.height, o.alt = i._altText, i._captionChecked ? i._caption || (i._caption = this.plugins.resizing.create_caption.call(this), a.appendChild(i._caption)) : i._caption && (this.util.removeItem(i._caption), i._caption = null), l.trim().length > 0)
                            if (null !== i._linkElement && a.contains(i._linkElement)) i._linkElement.href = l, i._linkElement.target = i.imgLinkNewWindowCheck.checked ? "_blank" : "", o.setAttribute("data-image-link", l);
                            else {
                                let e = this.plugins.image.onRender_link.call(this, o, l, this.context.image.imgLinkNewWindowCheck.checked);
                                a.insertBefore(e, i._caption)
                            }
                        else if (null !== i._linkElement) {
                            const e = o;
                            e.setAttribute("data-image-link", "");
                            let t = e.cloneNode(!0);
                            a.removeChild(i._linkElement), a.insertBefore(t, i._caption), o = t
                        }
                        if (c) {
                            const e = this.util.isRangeFormatElement(i._element.parentNode) || this.util.isWysiwygDiv(i._element.parentNode) ? i._element : /^A$/i.test(i._element.parentNode.nodeName) ? i._element.parentNode : this.util.getFormatElement(i._element) || i._element;
                            e.parentNode.replaceChild(r, e), o = r.querySelector("img"), i._element = o, i._cover = a, i._container = r
                        }!i._onlyPercentage && s && !e && (/\d+/.test(o.style.height) || this.context.resizing._rotateVertical && i._captionChecked) && (/%$/.test(i.inputX.value) || /%$/.test(i.inputY.value) ? this.plugins.resizing.resetTransform.call(this, o) : this.plugins.resizing.setTransformSize.call(this, o, this.util.getNumber(i.inputX.value, 0), this.util.getNumber(i.inputY.value, 0)));
                        if (i._resizing && (o.setAttribute("data-proportion", i._proportionChecked), s && this.plugins.image.applySize.call(this)), this.plugins.image.setAlign.call(this, null, o, null, null), e && this.plugins.image.setImagesInfo.call(this, o, {
                                name: o.getAttribute("data-file-name") || o.src.split("/").pop(),
                                size: o.getAttribute("data-file-size") || 0
                            }), t) {
                            this.plugins.image.init.call(this);
                            const e = this.plugins.resizing.call_controller_resize.call(this, o, "image");
                            this.plugins.image.onModifyMode.call(this, o, e)
                        }
                        n || this.history.push(!1)
                    },
                    update_src: function(e, t, n) {
                        t.src = e, this._w.setTimeout(this.plugins.image.setImagesInfo.bind(this, t, n))
                    },
                    onModifyMode: function(e, t) {
                        if (!e) return;
                        const n = this.context.image;
                        n._linkElement = /^A$/i.test(e.parentNode.nodeName) ? e.parentNode : null, n._element = e, n._cover = this.util.getParentElement(e, "FIGURE"), n._container = this.util.getParentElement(e, this.util.isMediaComponent), n._caption = this.util.getChildElement(n._cover, "FIGCAPTION"), n._align = e.getAttribute("data-align") || "none", t && (n._element_w = t.w, n._element_h = t.h, n._element_t = t.t, n._element_l = t.l);
                        let i = n._element.getAttribute("data-size") || n._element.getAttribute("data-origin");
                        i ? (i = i.split(","), n._origin_w = i[0], n._origin_h = i[1]) : t && (n._origin_w = t.w, n._origin_h = t.h)
                    },
                    openModify: function(e) {
                        const t = this.context.image;
                        t.imgUrlFile.value = t._element.src, t._altText = t.altText.value = t._element.alt, t._linkValue = t.imgLink.value = null === t._linkElement ? "" : t._linkElement.href, t.imgLinkNewWindowCheck.checked = t._linkElement && "_blank" === t._linkElement.target, t.modal.querySelector('input[name="suneditor_image_radio"][value="' + t._align + '"]').checked = !0, t._align = t.modal.querySelector('input[name="suneditor_image_radio"]:checked').value, t._captionChecked = t.captionCheckEl.checked = !!t._caption, t._resizing && this.plugins.resizing._module_setModifyInputSize.call(this, t, this.plugins.image), e || this.plugins.dialog.open.call(this, "image", !0)
                    },
                    on: function(e) {
                        const t = this.context.image;
                        e ? t.imgInputFile && t.imgInputFile.removeAttribute("multiple") : (t.inputX.value = t._origin_w = this.context.option.imageWidth === t._defaultSizeX ? "" : this.context.option.imageWidth, t.inputY.value = t._origin_h = this.context.option.imageHeight === t._defaultSizeY ? "" : this.context.option.imageHeight, t.imgInputFile && t.imgInputFile.setAttribute("multiple", "multiple"))
                    },
                    sizeRevert: function() {
                        this.plugins.resizing._module_sizeRevert.call(this, this.context.image)
                    },
                    applySize: function(e, t) {
                        const n = this.context.image;
                        return e || (e = n.inputX.value), t || (t = n.inputY.value), n._onlyPercentage && e || /%$/.test(e) ? (this.plugins.image.setPercentSize.call(this, e, t), !0) : (e && "auto" !== e || t && "auto" !== t ? this.plugins.image.setSize.call(this, e, t, !1) : this.plugins.image.setAutoSize.call(this), !1)
                    },
                    setSize: function(e, t, n, i) {
                        const l = this.context.image,
                            s = /^(rw|lw)$/.test(i),
                            o = /^(th|bh)$/.test(i);
                        this.plugins.image.cancelPercentAttr.call(this), o || (l._element.style.width = this.util.isNumber(e) ? e + l.sizeUnit : e), s || (l._element.style.height = this.util.isNumber(t) ? t + l.sizeUnit : /%$/.test(t) ? "" : t), "center" === l._align && this.plugins.image.setAlign.call(this, null, null, null, null), n || l._element.removeAttribute("data-percentage"), this.plugins.resizing._module_saveCurrentSize.call(this, l)
                    },
                    setAutoSize: function() {
                        const e = this.context.image;
                        this.plugins.resizing.resetTransform.call(this, e._element), this.plugins.image.cancelPercentAttr.call(this), e._element.style.maxWidth = "", e._element.style.width = "", e._element.style.height = "", e._cover.style.width = "", e._cover.style.height = "", this.plugins.image.setAlign.call(this, null, null, null, null), e._element.setAttribute("data-percentage", "auto,auto"), this.plugins.resizing._module_saveCurrentSize.call(this, e)
                    },
                    setOriginSize: function() {
                        const e = this.context.image;
                        e._element.removeAttribute("data-percentage"), this.plugins.resizing.resetTransform.call(this, e._element), this.plugins.image.cancelPercentAttr.call(this);
                        const t = (e._element.getAttribute("data-origin") || "").split(","),
                            n = t[0],
                            i = t[1];
                        t && (e._onlyPercentage || /%$/.test(n) && (/%$/.test(i) || !/\d/.test(i)) ? this.plugins.image.setPercentSize.call(this, n, i) : this.plugins.image.setSize.call(this, n, i), this.plugins.resizing._module_saveCurrentSize.call(this, e))
                    },
                    setPercentSize: function(e, t) {
                        const n = this.context.image;
                        t = !t || /%$/.test(t) || this.util.getNumber(t, 0) ? this.util.isNumber(t) ? t + n.sizeUnit : t || "" : this.util.isNumber(t) ? t + "%" : t;
                        const i = /%$/.test(t);
                        n._container.style.width = this.util.isNumber(e) ? e + "%" : e, n._container.style.height = "", n._cover.style.width = "100%", n._cover.style.height = i ? t : "", n._element.style.width = "100%", n._element.style.height = i ? "" : t, n._element.style.maxWidth = "", "center" === n._align && this.plugins.image.setAlign.call(this, null, null, null, null), n._element.setAttribute("data-percentage", e + "," + t), this.plugins.resizing.setCaptionPosition.call(this, n._element), this.plugins.resizing._module_saveCurrentSize.call(this, n)
                    },
                    cancelPercentAttr: function() {
                        const e = this.context.image;
                        e._cover.style.width = "", e._cover.style.height = "", e._container.style.width = "", e._container.style.height = "", this.util.removeClass(e._container, this.context.image._floatClassRegExp), this.util.addClass(e._container, "__se__float-" + e._align), "center" === e._align && this.plugins.image.setAlign.call(this, null, null, null, null)
                    },
                    setAlign: function(e, t, n, i) {
                        const l = this.context.image;
                        e || (e = l._align), t || (t = l._element), n || (n = l._cover), i || (i = l._container), n.style.margin = e && "none" !== e ? "auto" : "0", /%$/.test(t.style.width) && "center" === e ? (i.style.minWidth = "100%", n.style.width = i.style.width) : (i.style.minWidth = "", n.style.width = this.context.resizing._rotateVertical ? t.style.height || t.offsetHeight : t.style.width && "auto" !== t.style.width ? t.style.width || "100%" : ""), this.util.hasClass(i, "__se__float-" + e) || (this.util.removeClass(i, l._floatClassRegExp), this.util.addClass(i, "__se__float-" + e)), t.setAttribute("data-align", e)
                    },
                    resetAlign: function() {
                        const e = this.context.image;
                        e._element.setAttribute("data-align", ""), e._align = "none", e._cover.style.margin = "0", this.util.removeClass(e._container, e._floatClassRegExp)
                    },
                    destroy: function(e) {
                        const t = e || this.context.image._element,
                            n = this.util.getParentElement(t, this.util.isMediaComponent) || t,
                            i = 1 * t.getAttribute("data-index");
                        let l = n.previousElementSibling || n.nextElementSibling;
                        const s = n.parentNode;
                        if (this.util.removeItem(n), this.plugins.image.init.call(this), this.controllersOff(), s !== this.context.element.wysiwyg && this.util.removeItemAllParents(s, (function(e) {
                                return 0 === e.childNodes.length
                            }), null), this.focusEdge(l), i >= 0) {
                            const e = this.context.image._imagesInfo;
                            for (let t = 0, n = e.length; t < n; t++)
                                if (i === e[t].index) return e.splice(t, 1), void this._imageUpload(null, i, "delete", null, 0)
                        }
                        this.history.push(!1)
                    },
                    init: function() {
                        const e = this.context.image;
                        e.imgInputFile && (e.imgInputFile.value = ""), e.imgUrlFile && (e.imgUrlFile.value = ""), e.imgInputFile && e.imgUrlFile && e.imgUrlFile.removeAttribute("disabled"), e.altText.value = "", e.imgLink.value = "", e.imgLinkNewWindowCheck.checked = !1, e.modal.querySelector('input[name="suneditor_image_radio"][value="none"]').checked = !0, e.captionCheckEl.checked = !1, e._element = null, this.plugins.image.openTab.call(this, "init"), e._resizing && (e.inputX.value = this.context.option.imageWidth === e._defaultSizeX ? "" : this.context.option.imageWidth, e.inputY.value = this.context.option.imageHeight === e._defaultSizeY ? "" : this.context.option.imageHeight, e.proportion.checked = !0, e._ratio = !1, e._ratioX = 1, e._ratioY = 1)
                    }
                },
                video: {
                    name: "video",
                    display: "dialog",
                    add: function(e) {
                        e.addModule([r.a, u.a]);
                        const t = e.context,
                            n = t.video = {
                                _videosInfo: [],
                                _videoIndex: 0,
                                sizeUnit: t.option._videoSizeUnit,
                                _align: "none",
                                _floatClassRegExp: "__se__float\\-[a-z]+",
                                _youtubeQuery: t.option.youtubeQuery,
                                _videoRatio: 100 * t.option.videoRatio + "%",
                                _defaultRatio: 100 * t.option.videoRatio + "%",
                                inputX: null,
                                inputY: null,
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
                                _origin_h: "56.25%" === t.option.videoHeight ? "" : t.option.videoHeight,
                                _proportionChecked: !0,
                                _resizing: t.option.videoResizing,
                                _resizeDotHide: !t.option.videoHeightShow,
                                _rotation: t.option.videoRotation,
                                _onlyPercentage: t.option.videoSizeOnlyPercentage,
                                _ratio: !1,
                                _ratioX: 1,
                                _ratioY: 1,
                                _captionShow: !1
                            };
                        let i = this.setDialog.call(e);
                        n.modal = i, n.focusElement = i.querySelector("._se_video_url"), i.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e)), n.proportion = {}, n.videoRatioOption = {}, n.inputX = {}, n.inputY = {}, t.option.videoResizing && (n.proportion = i.querySelector("._se_video_check_proportion"), n.videoRatioOption = i.querySelector(".se-video-ratio"), n.inputX = i.querySelector("._se_video_size_x"), n.inputY = i.querySelector("._se_video_size_y"), n.inputX.value = t.option.videoWidth, n.inputY.value = t.option.videoHeight, n.inputX.addEventListener("keyup", this.setInputSize.bind(e, "x")), n.inputY.addEventListener("keyup", this.setInputSize.bind(e, "y")), n.inputX.addEventListener("change", this.setRatio.bind(e)), n.inputY.addEventListener("change", this.setRatio.bind(e)), n.proportion.addEventListener("change", this.setRatio.bind(e)), n.videoRatioOption.addEventListener("change", this.setVideoRatio.bind(e)), i.querySelector(".se-dialog-btn-revert").addEventListener("click", this.sizeRevert.bind(e))), t.dialog.modal.appendChild(i), i = null
                    },
                    setDialog: function() {
                        const e = this.context.option,
                            t = this.lang,
                            n = this.util.createElement("DIV");
                        n.className = "se-dialog-content", n.style.display = "none";
                        let i = '<form class="editor_video"><div class="se-dialog-header"><button type="button" data-command="close" class="se-btn se-dialog-close" aria-label="Close" title="' + t.dialogBox.close + '">' + this.icons.cancel + '</button><span class="se-modal-title">' + t.dialogBox.videoBox.title + '</span></div><div class="se-dialog-body"><div class="se-dialog-form"><label>' + t.dialogBox.videoBox.url + '</label><input class="se-input-form _se_video_url" type="text" /></div>';
                        if (e.videoResizing) {
                            const n = e.videoRatioList || [{
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
                                s = e.videoSizeOnlyPercentage,
                                o = s ? ' style="display: none !important;"' : "",
                                a = e.videoHeightShow ? "" : ' style="display: none !important;"',
                                r = e.videoRatioShow ? "" : ' style="display: none !important;"',
                                c = s || e.videoHeightShow || e.videoRatioShow ? "" : ' style="display: none !important;"';
                            i += '<div class="se-dialog-form"><div class="se-dialog-size-text"><label class="size-w">' + t.dialogBox.width + '</label><label class="se-dialog-size-x">&nbsp;</label><label class="size-h"' + a + ">" + t.dialogBox.height + '</label><label class="size-h"' + r + ">(" + t.dialogBox.ratio + ')</label></div><input class="se-input-control _se_video_size_x" placeholder="100%"' + (s ? ' type="number" min="1"' : 'type="text"') + (s ? ' max="100"' : "") + '/><label class="se-dialog-size-x"' + c + ">" + (s ? "%" : "x") + '</label><input class="se-input-control _se_video_size_y" placeholder="' + 100 * e.videoRatio + '%"' + (s ? ' type="number" min="1"' : 'type="text"') + (s ? ' max="100"' : "") + a + '/><select class="se-input-select se-video-ratio" title="' + t.dialogBox.ratio + '"' + r + ">", a || (i += '<option value=""> - </option>');
                            for (let e = 0, t = n.length; e < t; e++) i += '<option value="' + n[e].value + '"' + (l.toString() === n[e].value.toString() ? " selected" : "") + ">" + n[e].name + "</option>";
                            i += '</select><button type="button" title="' + t.dialogBox.revertButton + '" class="se-btn se-dialog-btn-revert" style="float: right;">' + this.icons.revert + '</button></div><div class="se-dialog-form se-dialog-form-footer"' + o + c + '><label><input type="checkbox" class="se-dialog-btn-check _se_video_check_proportion" checked/>&nbsp;' + t.dialogBox.proportion + "</label></div>"
                        }
                        return i += '</div><div class="se-dialog-footer"><div><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="none" checked>' + t.dialogBox.basic + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="left">' + t.dialogBox.left + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="center">' + t.dialogBox.center + '</label><label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="right">' + t.dialogBox.right + '</label></div><button type="submit" class="se-btn-primary" title="' + t.dialogBox.submitButton + '"><span>' + t.dialogBox.submitButton + "</span></button></div></form>", n.innerHTML = i, n
                    },
                    open: function() {
                        this.plugins.dialog.open.call(this, "video", "video" === this.currentControllerName)
                    },
                    setVideoRatio: function(e) {
                        const t = this.context.video,
                            n = e.target.options[e.target.selectedIndex].value;
                        t._defaultSizeY = t._videoRatio = n ? 100 * n + "%" : t._defaultSizeY, t.inputY.placeholder = n ? 100 * n + "%" : "", t.inputY.value = ""
                    },
                    setInputSize: function(e, t) {
                        if (t && 32 === t.keyCode) return void t.preventDefault();
                        const n = this.context.video;
                        this.plugins.resizing._module_setInputSize.call(this, n, e), "y" === e && this.plugins.video.setVideoRatioSelect.call(this, t.target.value || n._defaultRatio)
                    },
                    setRatio: function() {
                        this.plugins.resizing._module_setRatio.call(this, this.context.video)
                    },
                    submitAction: function() {
                        if (0 === this.context.video.focusElement.value.trim().length) return !1;
                        this.context.resizing._resize_plugin = "video";
                        const e = this.context.video;
                        let t = null,
                            n = null,
                            i = null,
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
                        let s = !1;
                        this.context.dialog.updateModal ? (e._element.src !== t.src && (e._element.src = t.src, s = !0), i = e._container, n = this.util.getParentElement(e._element, "FIGURE"), t = e._element) : (s = !0, t.frameBorder = "0", t.allowFullscreen = !0, e._element = t, n = this.plugins.resizing.set_cover.call(this, t), i = this.plugins.resizing.set_container.call(this, n, "se-video-container")), e._cover = n, e._container = i;
                        const o = this.plugins.resizing._module_getSizeX.call(this, e) !== (e.inputX.value || e._defaultSizeX) || this.plugins.resizing._module_getSizeY.call(this, e) !== (e.inputY.value || e._videoRatio),
                            a = !this.context.dialog.updateModal || o;
                        e._resizing && (this.context.video._proportionChecked = e.proportion.checked, t.setAttribute("data-proportion", e._proportionChecked));
                        let r = !1;
                        a && (r = this.plugins.video.applySize.call(this)), r && "center" === e._align || this.plugins.video.setAlign.call(this, null, t, n, i), this.context.dialog.updateModal ? e._resizing && this.context.resizing._rotateVertical && a && this.plugins.resizing.setTransformSize.call(this, t, null, null) : this.insertComponent(i, !1), s && this.plugins.video.setVideosInfo.call(this, t), this.context.resizing._resize_plugin = "", this.context.dialog.updateModal && this.history.push(!1)
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
                        if (!e) return;
                        const t = this.context.video;
                        e.frameBorder = "0", e.allowFullscreen = !0;
                        const n = this.util.getParentElement(e, this.util.isMediaComponent) || this.util.getParentElement(e, function(e) {
                            return this.isWysiwygDiv(e.parentNode)
                        }.bind(this.util));
                        t._element = e = e.cloneNode(!1);
                        const i = t._cover = this.plugins.resizing.set_cover.call(this, e),
                            l = t._container = this.plugins.resizing.set_container.call(this, i, "se-video-container"),
                            s = n.querySelector("figcaption");
                        let o = null;
                        s && (o = this.util.createElement("DIV"), o.innerHTML = s.innerHTML, this.util.removeItem(s));
                        const a = (e.getAttribute("data-size") || e.getAttribute("data-origin") || "").split(",");
                        this.plugins.video.applySize.call(this, a[0] || this.context.option.videoWidth, a[1] || this.context.option.videoHeight), n.parentNode.replaceChild(l, n), o && n.parentNode.insertBefore(o, l.nextElementSibling), this.plugins.video.setVideosInfo.call(this, e)
                    },
                    onModifyMode: function(e, t) {
                        const n = this.context.video;
                        n._element = e, n._cover = this.util.getParentElement(e, "FIGURE"), n._container = this.util.getParentElement(e, this.util.isMediaComponent), n._align = e.getAttribute("data-align") || "none", t && (n._element_w = t.w, n._element_h = t.h, n._element_t = t.t, n._element_l = t.l);
                        let i = n._element.getAttribute("data-size") || n._element.getAttribute("data-origin");
                        i ? (i = i.split(","), n._origin_w = i[0], n._origin_h = i[1]) : t && (n._origin_w = t.w, n._origin_h = t.h)
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
                        const t = this.context.video;
                        e || (t.inputX.value = t._origin_w = this.context.option.videoWidth === t._defaultSizeX ? "" : this.context.option.videoWidth, t.inputY.value = t._origin_h = this.context.option.videoHeight === t._defaultSizeY ? "" : this.context.option.videoHeight, t.proportion.disabled = !0), t._resizing && this.plugins.video.setVideoRatioSelect.call(this, t._origin_h || t._defaultRatio)
                    },
                    setVideoRatioSelect: function(e) {
                        let t = !1;
                        const n = this.context.video,
                            i = n.videoRatioOption.options;
                        /%$/.test(e) || n._onlyPercentage ? e = this.util.getNumber(e, 2) / 100 + "" : (!this.util.isNumber(e) || 1 * e >= 1) && (e = ""), n.inputY.placeholder = "";
                        for (let l = 0, s = i.length; l < s; l++) i[l].value === e ? (t = i[l].selected = !0, n.inputY.placeholder = e ? 100 * e + "%" : "") : i[l].selected = !1;
                        return t
                    },
                    setVideosInfo: function(e) {
                        const t = this.context.resizing._resize_plugin;
                        this.context.resizing._resize_plugin = "video";
                        const n = this.context.video._videosInfo;
                        let i = e.getAttribute("data-index"),
                            l = null,
                            s = "";
                        if (!i || this._componentsInfoInit) s = "create", i = this.context.video._videoIndex++, e.setAttribute("data-index", i), l = {
                            src: e.src,
                            index: 1 * i
                        }, n.push(l);
                        else {
                            s = "update", i *= 1;
                            for (let e = 0, t = n.length; e < t; e++)
                                if (i === n[e].index) {
                                    l = n[e];
                                    break
                                } l || (i = this.context.video._videoIndex++, l = {
                                index: i
                            }, n.push(l)), l.src = e.src
                        }
                        if (l.element = e, l.delete = this.plugins.video.destroy.bind(this, e), l.select = function() {
                                e.scrollIntoView(!0), this._w.setTimeout(function() {
                                    this.plugins.video.onModifyMode.call(this, e, this.plugins.resizing.call_controller_resize.call(this, e, "video"))
                                }.bind(this))
                            }.bind(this), !e.getAttribute("data-origin")) {
                            const t = this.util.getParentElement(e, this.util.isMediaComponent),
                                n = this.util.getParentElement(e, "FIGURE"),
                                i = this.plugins.resizing._module_getSizeX.call(this, this.context.video, e, n, t),
                                l = this.plugins.resizing._module_getSizeY.call(this, this.context.video, e, n, t);
                            e.setAttribute("data-origin", i + "," + l), e.setAttribute("data-size", i + "," + l)
                        }
                        if (!e.style.width) {
                            const t = (e.getAttribute("data-size") || e.getAttribute("data-origin") || "").split(",");
                            this.plugins.video.onModifyMode.call(this, e, null), this.plugins.video.applySize.call(this, t[0] || this.context.option.videoWidth, t[1] || this.context.option.videoHeight)
                        }
                        this.context.resizing._resize_plugin = t, this._videoUpload(e, i, s, l, 0)
                    },
                    checkComponentInfo: function() {
                        const e = [].slice.call(this.context.element.wysiwyg.getElementsByTagName("IFRAME")),
                            t = this.plugins.video,
                            n = this.context.video._videosInfo;
                        if (e.length === n.length) {
                            if (this._componentsInfoReset) {
                                for (let n, i = 0, l = e.length; i < l; i++) n = e[i], t.setVideosInfo.call(this, n);
                                return
                            } {
                                let t = !1;
                                for (let i, l = 0, s = n.length; l < s; l++)
                                    if (i = n[l], 0 === e.filter((function(e) {
                                            return i.src === e.src && i.index.toString() === e.getAttribute("data-index")
                                        })).length) {
                                        t = !0;
                                        break
                                    } if (!t) return
                            }
                        }
                        const i = this.context.resizing._resize_plugin;
                        this.context.resizing._resize_plugin = "video";
                        const l = [],
                            s = [];
                        for (let e = 0, t = n.length; e < t; e++) s[e] = n[e].index;
                        for (let n, i, o = 0, a = e.length; o < a; o++) n = e[o], i = this.util.getParentElement(n, this.util.isMediaComponent), !i || i.getElementsByTagName("figcaption").length > 0 ? (l.push(this.context.video._videoIndex), t._update_videoCover.call(this, n)) : !n.getAttribute("data-index") || s.indexOf(1 * n.getAttribute("data-index")) < 0 ? (l.push(this.context.video._videoIndex), n.removeAttribute("data-index"), t.setVideosInfo.call(this, n)) : l.push(1 * n.getAttribute("data-index"));
                        for (let e, t = 0; t < n.length; t++) e = n[t].index, l.indexOf(e) > -1 || (n.splice(t, 1), this._videoUpload(null, e, "delete", null, 0), t--);
                        this.context.resizing._resize_plugin = i
                    },
                    resetComponentInfo: function() {
                        this.context.video._videosInfo = [], this.context.video._videoIndex = 0
                    },
                    sizeRevert: function() {
                        this.plugins.resizing._module_sizeRevert.call(this, this.context.video)
                    },
                    applySize: function(e, t) {
                        const n = this.context.video;
                        return e || (e = n.inputX.value), t || (t = n.inputY.value), n._onlyPercentage || /%$/.test(e) || !e ? (this.plugins.video.setPercentSize.call(this, e || "100%", t || (/%$/.test(n._videoRatio) ? n._videoRatio : n._defaultRatio)), !0) : (e && "auto" !== e || t && "auto" !== t ? this.plugins.video.setSize.call(this, e, t || n._videoRatio || n._defaultRatio, !1) : this.plugins.video.setAutoSize.call(this), !1)
                    },
                    setSize: function(e, t, n, i) {
                        const l = this.context.video,
                            s = /^(rw|lw)$/.test(i),
                            o = /^(th|bh)$/.test(i);
                        o || (e = this.util.getNumber(e, 0)), s || (t = this.util.isNumber(t) ? t + l.sizeUnit : t || ""), o || (l._element.style.width = e ? e + l.sizeUnit : ""), s || (l._cover.style.paddingBottom = l._cover.style.height = t), o || /%$/.test(e) || (l._cover.style.width = "", l._container.style.width = ""), s || /%$/.test(t) ? l._element.style.height = "" : l._element.style.height = t, n || l._element.removeAttribute("data-percentage"), this.plugins.resizing._module_saveCurrentSize.call(this, l)
                    },
                    setAutoSize: function() {
                        this.plugins.video.setPercentSize.call(this, 100, this.context.video._defaultRatio)
                    },
                    setOriginSize: function(e) {
                        const t = this.context.video;
                        t._element.removeAttribute("data-percentage"), this.plugins.resizing.resetTransform.call(this, t._element), this.plugins.video.cancelPercentAttr.call(this);
                        const n = ((e ? t._element.getAttribute("data-size") : "") || t._element.getAttribute("data-origin") || "").split(",");
                        if (n) {
                            const e = n[0],
                                i = n[1];
                            t._onlyPercentage || /%$/.test(e) && (/%$/.test(i) || !/\d/.test(i)) ? this.plugins.video.setPercentSize.call(this, e, i) : this.plugins.video.setSize.call(this, e, i), this.plugins.resizing._module_saveCurrentSize.call(this, t)
                        }
                    },
                    setPercentSize: function(e, t) {
                        const n = this.context.video;
                        t = !t || /%$/.test(t) || this.util.getNumber(t, 0) ? this.util.isNumber(t) ? t + n.sizeUnit : t || n._defaultRatio : this.util.isNumber(t) ? t + "%" : t, n._container.style.width = this.util.isNumber(e) ? e + "%" : e, n._container.style.height = "", n._cover.style.width = "100%", n._cover.style.height = t, n._cover.style.paddingBottom = t, n._element.style.width = "100%", n._element.style.height = "100%", n._element.style.maxWidth = "", "center" === n._align && this.plugins.video.setAlign.call(this, null, null, null, null), n._element.setAttribute("data-percentage", e + "," + t), this.plugins.resizing._module_saveCurrentSize.call(this, n)
                    },
                    cancelPercentAttr: function() {
                        const e = this.context.video;
                        e._cover.style.width = "", e._cover.style.height = "", e._cover.style.paddingBottom = "", e._container.style.width = "", e._container.style.height = "", this.util.removeClass(e._container, this.context.video._floatClassRegExp), this.util.addClass(e._container, "__se__float-" + e._align), "center" === e._align && this.plugins.video.setAlign.call(this, null, null, null, null)
                    },
                    setAlign: function(e, t, n, i) {
                        const l = this.context.video;
                        e || (e = l._align), t || (t = l._element), n || (n = l._cover), i || (i = l._container), n.style.margin = e && "none" !== e ? "auto" : "0", /%$/.test(t.style.width) && "center" === e ? (i.style.minWidth = "100%", n.style.width = i.style.width, n.style.height = n.style.height, n.style.paddingBottom = /%$/.test(n.style.height) ? this.util.getNumber(this.util.getNumber(n.style.height, 2) / 100 * this.util.getNumber(n.style.width, 2), 2) + "%" : n.style.height) : (i.style.minWidth = "", n.style.width = this.context.resizing._rotateVertical ? t.style.height || t.offsetHeight : t.style.width || "100%", n.style.paddingBottom = n.style.height), this.util.hasClass(i, "__se__float-" + e) || (this.util.removeClass(i, l._floatClassRegExp), this.util.addClass(i, "__se__float-" + e)), t.setAttribute("data-align", e)
                    },
                    resetAlign: function() {
                        const e = this.context.video;
                        e._element.setAttribute("data-align", ""), e._align = "none", e._cover.style.margin = "0", this.util.removeClass(e._container, e._floatClassRegExp)
                    },
                    destroy: function(e) {
                        const t = e || this.context.video._element,
                            n = this.context.video._container,
                            i = 1 * t.getAttribute("data-index");
                        let l = n.previousElementSibling || n.nextElementSibling;
                        const s = n.parentNode;
                        if (this.util.removeItem(n), this.plugins.video.init.call(this), this.controllersOff(), s !== this.context.element.wysiwyg && this.util.removeItemAllParents(s, (function(e) {
                                return 0 === e.childNodes.length
                            }), null), this.focusEdge(l), i >= 0) {
                            const e = this.context.video._videosInfo;
                            for (let t = 0, n = e.length; t < n; t++)
                                if (i === e[t].index) {
                                    e.splice(t, 1), this._videoUpload(null, i, "delete", null, 0);
                                    break
                                }
                        }
                        this.history.push(!1)
                    },
                    init: function() {
                        const e = this.context.video;
                        e.focusElement.value = "", e._origin_w = this.context.option.videoWidth, e._origin_h = this.context.option.videoHeight, e.modal.querySelector('input[name="suneditor_video_radio"][value="none"]').checked = !0, e._resizing && (e.inputX.value = this.context.option.videoWidth === e._defaultSizeX ? "" : this.context.option.videoWidth, e.inputY.value = this.context.option.videoHeight === e._defaultSizeY ? "" : this.context.option.videoHeight, e.proportion.checked = !0, e.proportion.disabled = !0, this.plugins.video.setVideoRatioSelect.call(this, e._defaultRatio))
                    }
                },
                math: {
                    name: "math",
                    display: "dialog",
                    add: function(e) {
                        e.addModule([r.a]);
                        const t = e.context;
                        t.math = {
                            focusElement: null,
                            previewElement: null,
                            fontSizeElement: null,
                            _mathExp: null,
                            _renderer: null
                        };
                        let n = this.setDialog.call(e);
                        t.math.modal = n, t.math.focusElement = n.querySelector(".se-math-exp"), t.math.previewElement = n.querySelector(".se-math-preview"), t.math.fontSizeElement = n.querySelector(".se-math-size"), t.math._renderer = function(e) {
                            return this.src.renderToString(e, this.options)
                        }.bind(e.context.option.katex), t.math.focusElement.addEventListener("keyup", this._renderMathExp.bind(t.math), !1), t.math.focusElement.addEventListener("change", this._renderMathExp.bind(t.math), !1), t.math.fontSizeElement.addEventListener("change", function(e) {
                            this.fontSize = e.target.value
                        }.bind(t.math.previewElement.style), !1);
                        let i = this.setController_MathButton.call(e);
                        t.math.mathController = i, t.math._mathExp = null, i.addEventListener("mousedown", (function(e) {
                            e.stopPropagation()
                        }), !1), n.querySelector(".se-btn-primary").addEventListener("click", this.submit.bind(e), !1), i.addEventListener("click", this.onClick_mathController.bind(e)), t.dialog.modal.appendChild(n), t.element.relative.appendChild(i), n = null, i = null
                    },
                    setDialog: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-dialog-content", t.style.display = "none", t.innerHTML = '<form class="editor_math"><div class="se-dialog-header"><button type="button" data-command="close" class="se-btn se-dialog-close" aria-label="Close" title="' + e.dialogBox.close + '">' + this.icons.cancel + '</button><span class="se-modal-title">' + e.dialogBox.mathBox.title + '</span></div><div class="se-dialog-body"><div class="se-dialog-form"><label>' + e.dialogBox.mathBox.inputLabel + ' (<a href="https://katex.org/docs/supported.html" target="_blank">KaTeX</a>)</label><textarea class="se-input-form se-math-exp" type="text"></textarea></div><div class="se-dialog-form"><label>' + e.dialogBox.mathBox.fontSizeLabel + '</label><select class="se-input-select se-math-size"><option value="1em">1</option><option value="1.5em">1.5</option><option value="2em">2</option><option value="2.5em">2.5</option></select></div><div class="se-dialog-form"><label>' + e.dialogBox.mathBox.previewLabel + '</label><p class="se-math-preview"></p></div></div><div class="se-dialog-footer"><button type="submit" class="se-btn-primary" title="' + e.dialogBox.submitButton + '"><span>' + e.dialogBox.submitButton + "</span></button></div></form>", t
                    },
                    setController_MathButton: function() {
                        const e = this.lang,
                            t = this.util.createElement("DIV");
                        return t.className = "se-controller se-controller-link", t.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="link-content"><div class="se-btn-group"><button type="button" data-command="update" tabindex="-1" class="se-btn se-tooltip">' + this.icons.edit + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.edit + '</span></span></button><button type="button" data-command="delete" tabindex="-1" class="se-btn se-tooltip">' + this.icons.delete + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div></div>", t
                    },
                    open: function() {
                        this.plugins.dialog.open.call(this, "math", "math" === this.currentControllerName)
                    },
                    _renderMathExp: function(e) {
                        this.previewElement.innerHTML = this._renderer(e.target.value)
                    },
                    submit: function(e) {
                        this.showLoading(), e.preventDefault(), e.stopPropagation();
                        const t = function() {
                            if (0 === this.context.math.focusElement.value.trim().length) return !1;
                            const e = this.context.math,
                                t = e.focusElement.value,
                                n = e.previewElement.querySelector(".katex");
                            if (!n) return !1;
                            if (n.setAttribute("contenteditable", !1), n.setAttribute("data-exp", t), n.setAttribute("data-font-size", e.fontSizeElement.value), n.style.fontSize = e.fontSizeElement.value, this.context.dialog.updateModal) {
                                const t = function(e, n) {
                                        if (e.classList.contains(n)) return e;
                                        const i = e.parentNode;
                                        return i !== document.body ? i.classList.contains(n) ? i : void t(i, n) : void 0
                                    },
                                    i = t(e._mathExp, "katex");
                                i.parentNode.replaceChild(n, i), this.setRange(n, 0, n, 1)
                            } else {
                                const e = this.getSelectedElements();
                                if (e.length > 1) {
                                    const t = this.util.createElement(e[0].nodeName);
                                    t.appendChild(n), this.insertNode(t)
                                } else this.insertNode(n);
                                const t = this.util.createTextNode(this.util.zeroWidthSpace);
                                n.parentNode.insertBefore(t, n.nextSibling), this.setRange(n, 0, n, 1)
                            }
                            return e.focusElement.value = "", e.fontSizeElement.value = "1em", e.previewElement.style.fontSize = "1em", e.previewElement.innerHTML = "", !0
                        }.bind(this);
                        try {
                            t() && (this.plugins.dialog.close.call(this), this.history.push(!1))
                        } catch (e) {
                            this.plugins.dialog.close.call(this)
                        } finally {
                            this.closeLoading()
                        }
                        return !1
                    },
                    active: function(e) {
                        if (e) {
                            if (e.getAttribute("data-exp")) return this.controllerArray.indexOf(this.context.math.mathController) < 0 && (this.setRange(e, 0, e, 1), this.plugins.math.call_controller.call(this, e)), !0
                        } else this.controllerArray.indexOf(this.context.math.mathController) > -1 && this.controllersOff();
                        return !1
                    },
                    on: function(e) {
                        if (e) {
                            const e = this.context.math;
                            if (e._mathExp) {
                                const t = e._mathExp.getAttribute("data-exp"),
                                    n = e._mathExp.getAttribute("data-font-size") || "1em";
                                this.context.dialog.updateModal = !0, e.focusElement.value = t, e.fontSizeElement.value = n, e.previewElement.innerHTML = e._renderer(t), e.previewElement.style.fontSize = n
                            }
                        } else this.plugins.math.init.call(this)
                    },
                    call_controller: function(e) {
                        this.context.math._mathExp = e;
                        const t = this.context.math.mathController,
                            n = this.util.getOffset(e, this.context.element.wysiwygFrame);
                        t.style.top = n.top + e.offsetHeight + 10 + "px", t.style.left = n.left - this.context.element.wysiwygFrame.scrollLeft + "px", t.style.display = "block";
                        const i = this.context.element.wysiwygFrame.offsetWidth - (t.offsetLeft + t.offsetWidth);
                        i < 0 ? (t.style.left = t.offsetLeft + i + "px", t.firstElementChild.style.left = 20 - i + "px") : t.firstElementChild.style.left = "20px", this.controllersOn(t, e, "math")
                    },
                    onClick_mathController: function(e) {
                        e.stopPropagation();
                        const t = e.target.getAttribute("data-command") || e.target.parentNode.getAttribute("data-command");
                        t && (e.preventDefault(), /update/.test(t) ? (this.context.math.focusElement.value = this.context.math._mathExp.getAttribute("data-exp"), this.plugins.dialog.open.call(this, "math", !0)) : (this.util.removeItem(this.context.math._mathExp), this.context.math._mathExp = null, this.focus(), this.history.push(!1)), this.controllersOff())
                    },
                    init: function() {
                        const e = this.context.math;
                        e.mathController.style.display = "none", e._mathExp = null, e.focusElement.value = "", e.previewElement.innerHTML = ""
                    }
                }
            },
            g = {
                redo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.59 14.18"><g><path d="M11.58,18.48a6.84,6.84,0,1,1,6.85-6.85s0,.26,0,.67a8,8,0,0,1-.22,1.44l.91-.55a.51.51,0,0,1,.36,0,.45.45,0,0,1,.29.22.47.47,0,0,1,.06.36.45.45,0,0,1-.22.29L17.42,15.3l-.12,0h-.25l-.12-.06-.09-.09-.06-.07,0-.06-.87-2.12a.43.43,0,0,1,0-.37.49.49,0,0,1,.27-.26.41.41,0,0,1,.36,0,.53.53,0,0,1,.27.26l.44,1.09a6.51,6.51,0,0,0,.24-1.36,4.58,4.58,0,0,0,0-.64,5.83,5.83,0,0,0-1.73-4.17,5.88,5.88,0,0,0-8.34,0,5.9,5.9,0,0,0,4.17,10.06.51.51,0,0,1,.33.15.48.48,0,0,1,0,.68.53.53,0,0,1-.33.12Z" transform="translate(-4.48 -4.54)"/></g></svg>',
                undo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.59 14.18"><g><path d="M5,14a.43.43,0,0,1-.22-.29.46.46,0,0,1,.06-.36.43.43,0,0,1,.29-.22.56.56,0,0,1,.36,0l.91.55a8.27,8.27,0,0,1-.22-1.45,5.07,5.07,0,0,1,0-.67A6.85,6.85,0,1,1,13,18.47a.44.44,0,0,1-.33-.13.48.48,0,0,1,0-.68.51.51,0,0,1,.33-.15A5.89,5.89,0,0,0,17.15,7.45a5.88,5.88,0,0,0-8.33,0,5.84,5.84,0,0,0-1.73,4.17s0,.25,0,.65a6.49,6.49,0,0,0,.24,1.37l.44-1.09a.57.57,0,0,1,.27-.26.41.41,0,0,1,.36,0,.53.53,0,0,1,.27.26.43.43,0,0,1,0,.37L7.82,15l0,.09-.09.09-.1.07-.06,0H7.28l-.13,0-1.09-.63c-.65-.36-1-.57-1.1-.63Z" transform="translate(-4.49 -4.53)"/></g></svg>',
                bold: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.76 15.75"><g><path d="M6.4,3.76V19.5h6.76a5.55,5.55,0,0,0,2-.32,4.93,4.93,0,0,0,1.52-1,4.27,4.27,0,0,0,1.48-3.34,3.87,3.87,0,0,0-.69-2.37,5.74,5.74,0,0,0-.71-.83,3.44,3.44,0,0,0-1.1-.65,3.6,3.6,0,0,0,1.58-1.36,3.66,3.66,0,0,0,.53-1.93,3.7,3.7,0,0,0-1.21-2.87,4.65,4.65,0,0,0-3.25-1.1H6.4Zm2.46,6.65V5.57h3.52a4.91,4.91,0,0,1,1.36.15,2.3,2.3,0,0,1,.85.45,2.06,2.06,0,0,1,.74,1.71,2.3,2.3,0,0,1-.78,1.92,2.54,2.54,0,0,1-.86.46,4.7,4.7,0,0,1-1.32.15H8.86Zm0,7.27V12.15H12.7a4.56,4.56,0,0,1,1.38.17,3.43,3.43,0,0,1,.95.49,2.29,2.29,0,0,1,.92,2,2.73,2.73,0,0,1-.83,2.1,2.66,2.66,0,0,1-.83.58,3.25,3.25,0,0,1-1.26.2H8.86Z" transform="translate(-6.4 -3.75)"/></g></svg>',
                underline: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9.78 15.74"><g><path d="M14.64,3.76h2.52v7.72a4.51,4.51,0,0,1-.59,2.31,3.76,3.76,0,0,1-1.71,1.53,6.12,6.12,0,0,1-2.64.53,5,5,0,0,1-3.57-1.18,4.17,4.17,0,0,1-1.27-3.24V3.76H9.9v7.3a3,3,0,0,0,.55,2,2.3,2.3,0,0,0,1.83.65,2.26,2.26,0,0,0,1.8-.65,3.09,3.09,0,0,0,.55-2V3.76Zm2.52,13.31V19.5H7.39V17.08h9.77Z" transform="translate(-7.38 -3.76)"/></g></svg>',
                italic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.49 15.76"><g><path d="M17.16,3.79l.37,0-.06.38-.14.52A10,10,0,0,1,16.21,5a9.37,9.37,0,0,0-1,.32,6.68,6.68,0,0,0-.25.89c-.06.31-.11.59-.14.85-.3,1.36-.52,2.41-.68,3.14l-.61,3.18L13.1,15l-.43,2.4-.12.46a.62.62,0,0,0,0,.28c.44.1.85.17,1.23.22l.68.11a4.51,4.51,0,0,1-.08.6l-.09.42a.92.92,0,0,0-.23,0l-.43,0a1.37,1.37,0,0,1-.29,0c-.13,0-.63-.08-1.49-.16l-2,0c-.28,0-.87,0-1.78.12L7,19.5l.17-.88.8-.2A6.61,6.61,0,0,0,9.19,18,2.62,2.62,0,0,0,9.61,17l.28-1.41.58-2.75.12-.66c.05-.3.11-.58.17-.86s.12-.51.17-.69l.12-.48.12-.43.31-1.6.15-.65.31-1.91V5.14a3.86,3.86,0,0,0-1.48-.29l-.38,0,.2-1.06,3.24.14.75,0c.45,0,1.18,0,2.18-.09.23,0,.46,0,.71,0Z" transform="translate(-7.04 -3.76)"/></g></svg>',
                strike: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 14.9"><g><path d="M12.94,13a4.27,4.27,0,0,1,1.32.58,1.46,1.46,0,0,1,.55,1.2,1.87,1.87,0,0,1-.88,1.64,4.17,4.17,0,0,1-2.35.59,4.44,4.44,0,0,1-2.74-.71,2.72,2.72,0,0,1-1-2.17H5.57a4.56,4.56,0,0,0,1.55,3.7,7,7,0,0,0,4.47,1.23,6,6,0,0,0,4.07-1.3,4.24,4.24,0,0,0,1.52-3.37,4,4,0,0,0-.26-1.4h-4ZM6.37,10.24A3.27,3.27,0,0,1,6,8.68a4,4,0,0,1,1.48-3.3,5.92,5.92,0,0,1,3.88-1.21,5.58,5.58,0,0,1,3.91,1.24,4.36,4.36,0,0,1,1.45,3.17H14.44a2.12,2.12,0,0,0-.91-1.81,4.45,4.45,0,0,0-2.44-.55,3.69,3.69,0,0,0-2,.51A1.64,1.64,0,0,0,8.3,8.22a1.3,1.3,0,0,0,.48,1.11,7,7,0,0,0,2.1.78l.28.06.28.08H6.37Zm13.09.68a.73.73,0,0,1,.49.21.66.66,0,0,1,.2.48.64.64,0,0,1-.2.48.71.71,0,0,1-.49.19H5.1a.67.67,0,0,1-.49-.19.66.66,0,0,1-.2-.48.64.64,0,0,1,.2-.48.73.73,0,0,1,.49-.21H19.46Z" transform="translate(-4.41 -4.17)"/></g></svg>',
                subscript: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 14.61"><g><path d="M15.38,4.33H12.74L11.19,7c-.28.46-.51.87-.69,1.21L10.07,9h0l-.44-.8c-.22-.4-.45-.81-.71-1.23L7.34,4.33H4.68L8.26,10,4.4,16.08H7.1l1.69-2.83c.38-.63.72-1.22,1-1.78l.25-.46h0l.49.92c.24.45.48.89.74,1.32L13,16.08h2.61L11.84,10l1.77-2.84,1.77-2.85Zm4.77,13.75H17v-.15c0-.4.05-.64.16-.72a4.42,4.42,0,0,1,1.16-.31,3.3,3.3,0,0,0,1.54-.56A1.84,1.84,0,0,0,20.15,15a1.78,1.78,0,0,0-.44-1.41A2.8,2.8,0,0,0,18,13.25a2.71,2.71,0,0,0-1.69.37,1.83,1.83,0,0,0-.44,1.43v.23H17v-.23q0-.63.18-.78a1.62,1.62,0,0,1,.88-.15,1.59,1.59,0,0,1,.88.15q.18.15.18.75t-.18.75a3.58,3.58,0,0,1-1.18.33,3.33,3.33,0,0,0-1.52.51,1.57,1.57,0,0,0-.32,1.18v1.15h4.27v-.86Z" transform="translate(-4.4 -4.33)"/></g></svg>',
                superscript: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 15.42"><g><path d="M12,13.14l3.61-5.81H12.94L11.33,10c-.28.46-.51.88-.69,1.25l-.45.83h0l-.45-.85c-.22-.41-.45-.82-.71-1.24L7.4,7.33H4.68l3.66,5.81L4.4,19.33H7.14l1.74-2.87q.58-1,1-1.83l.25-.48h0l.51.94.75,1.37,1.72,2.87h2.67l-1.92-3.09c-1.12-1.8-1.76-2.83-1.92-3.1Zm4.84-4.41h0l0,.15h3.27v.86H15.77V8.58a1.66,1.66,0,0,1,.33-1.22,3.51,3.51,0,0,1,1.56-.51,3.68,3.68,0,0,0,1.21-.34c.13-.1.19-.36.19-.77S19,5.07,18.87,5A1.63,1.63,0,0,0,18,4.8a1.58,1.58,0,0,0-.91.17c-.13.11-.19.38-.19.8V6H15.78V5.76a1.87,1.87,0,0,1,.45-1.47A2.84,2.84,0,0,1,18,3.91a2.8,2.8,0,0,1,1.72.38,1.84,1.84,0,0,1,.45,1.44,1.91,1.91,0,0,1-.34,1.35,3.24,3.24,0,0,1-1.58.57A3.69,3.69,0,0,0,17,8c-.12.1-.17.35-.17.76Z" transform="translate(-4.4 -3.91)"/></g></svg>',
                erase: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.76"><g><path d="M13.69,17.2h6.46v1.31H8.56L4.41,14.37,14,4.75l6.06,6.06L16.89,14l-3.2,3.19Zm-4.61,0h2.77L14.09,15,9.88,10.75,6.25,14.38l1.41,1.41c.84.82,1.31,1.29,1.42,1.41Z" transform="translate(-4.41 -4.75)"/></g></svg>',
                indent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 12.36"><g><path d="M19.87,15.57a.27.27,0,0,1,.19.08.25.25,0,0,1,.08.19v1.69a.27.27,0,0,1-.08.19.25.25,0,0,1-.19.08H4.68a.27.27,0,0,1-.19-.08.25.25,0,0,1-.08-.19V15.84a.27.27,0,0,1,.27-.27H19.87ZM7.5,14.45a.25.25,0,0,1-.2-.09L4.76,11.84a.29.29,0,0,1,0-.4L7.3,8.9a.29.29,0,0,1,.4,0,.31.31,0,0,1,.07.2v5.06a.32.32,0,0,1-.08.21.26.26,0,0,1-.19.08ZM19.87,8.82a.27.27,0,0,1,.19.08.25.25,0,0,1,.08.19v1.69a.27.27,0,0,1-.08.19.25.25,0,0,1-.19.08H10.31a.27.27,0,0,1-.27-.27V9.1a.27.27,0,0,1,.27-.27h9.56Zm0,3.37a.27.27,0,0,1,.19.08.28.28,0,0,1,.08.21v1.68a.32.32,0,0,1-.08.21.25.25,0,0,1-.19.08H10.31a.27.27,0,0,1-.19-.08.3.3,0,0,1-.08-.21V12.48a.32.32,0,0,1,.08-.21.24.24,0,0,1,.19-.08h9.56Zm.2-6.66a.28.28,0,0,1,.08.2V7.41a.32.32,0,0,1-.08.21.25.25,0,0,1-.19.08H4.68a.27.27,0,0,1-.19-.08.3.3,0,0,1-.08-.21V5.73a.32.32,0,0,1,.08-.21.25.25,0,0,1,.19-.08H19.87a.28.28,0,0,1,.2.09Z" transform="translate(-4.41 -5.44)"/></g></svg>',
                outdent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 12.36"><g><path d="M4.68,14.45a.27.27,0,0,1-.19-.08.3.3,0,0,1-.08-.21V9.1a.27.27,0,0,1,.08-.19.28.28,0,0,1,.2-.08.25.25,0,0,1,.19.07l2.54,2.54a.29.29,0,0,1,0,.4L4.88,14.36a.24.24,0,0,1-.2.09Zm15.19,1.12a.27.27,0,0,1,.19.08.25.25,0,0,1,.08.19v1.69a.27.27,0,0,1-.08.19.25.25,0,0,1-.19.08H4.68a.27.27,0,0,1-.19-.08.25.25,0,0,1-.08-.19V15.84a.27.27,0,0,1,.27-.27H19.87Zm0-3.38a.27.27,0,0,1,.19.08.28.28,0,0,1,.08.21v1.68a.32.32,0,0,1-.08.21.25.25,0,0,1-.19.08H10.31a.27.27,0,0,1-.19-.08.3.3,0,0,1-.08-.21V12.48a.32.32,0,0,1,.08-.21.24.24,0,0,1,.19-.08h9.56Zm0-3.37a.27.27,0,0,1,.19.08.25.25,0,0,1,.08.19v1.69a.27.27,0,0,1-.08.19.25.25,0,0,1-.19.08H10.31a.27.27,0,0,1-.27-.27V9.1a.27.27,0,0,1,.27-.27h9.56Zm.2-3.29a.28.28,0,0,1,.08.2V7.41a.32.32,0,0,1-.08.21.25.25,0,0,1-.19.08H4.68a.27.27,0,0,1-.19-.08.3.3,0,0,1-.08-.21V5.73a.32.32,0,0,1,.08-.21.25.25,0,0,1,.19-.08H19.87a.28.28,0,0,1,.2.09Z" transform="translate(-4.41 -5.44)"/></g></svg>',
                expansion: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M11.8,13.06l-5.1,5.1H9.51V19.5H4.41V14.4H5.75v2.81L8.3,14.66q2.25-2.23,2.55-2.55Zm8.35-9.3v5.1H18.81V6.05l-5.1,5.1-1-1,5.1-5.1H15.05V3.76Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                reduction: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M14.91,10h2.87v1.38H12.55V6.12h1.38V9l5.24-5.24.48.49.49.48ZM6.77,11.92H12v5.23H10.62V14.26L5.37,19.5l-1-1L9.63,13.3H6.77Z" transform="translate(-4.4 -3.76)"/></g></svg>',
                code_view: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.73 11.8"><g><path d="M8.09,7.94a.76.76,0,0,1,.53.22.72.72,0,0,1,.21.52.76.76,0,0,1-.22.54L6.18,11.63l2.43,2.44a.69.69,0,0,1,.2.51.66.66,0,0,1-.21.51.75.75,0,0,1-.51.22.63.63,0,0,1-.51-.21h0L4.63,12.15a.7.7,0,0,1-.22-.53.67.67,0,0,1,.25-.55L7.57,8.16a.82.82,0,0,1,.52-.22Zm12.05,3.69a.7.7,0,0,1-.23.52L17,15.1h0a.66.66,0,0,1-.51.21.73.73,0,0,1-.51-.22.75.75,0,0,1-.22-.51.63.63,0,0,1,.21-.51l2.43-2.44L15.92,9.22a.73.73,0,0,1-.22-.53A.74.74,0,0,1,17,8.18h0l2.91,2.91a.67.67,0,0,1,.27.54Zm-5.9-5.9a.73.73,0,0,1,.61.32.71.71,0,0,1,.07.68L11,17a1,1,0,0,1-.22.32.6.6,0,0,1-.35.16.75.75,0,0,1-.69-.26.69.69,0,0,1-.12-.72L13.56,6.23a.75.75,0,0,1,.26-.35.74.74,0,0,1,.42-.15Z" transform="translate(-4.41 -5.73)"/></g></svg>',
                preview: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.65 15.66"><g><path d="M16.19,14.43l2.49,2.49a.73.73,0,0,1,.21.52.67.67,0,0,1-.22.51.7.7,0,0,1-.52.22.69.69,0,0,1-.51-.21l-2.49-2.48a5.17,5.17,0,0,1-1.34.69,4.64,4.64,0,0,1-1.48.24,4.78,4.78,0,1,1,0-9.56,4.79,4.79,0,0,1,1.84.36,4.9,4.9,0,0,1,1.56,1,4.77,4.77,0,0,1,.46,6.18ZM10,14a3.3,3.3,0,0,0,2.34.93A3.37,3.37,0,0,0,14.7,14a3.3,3.3,0,0,0-1.08-5.41,3.47,3.47,0,0,0-2.56,0A3,3,0,0,0,10,9.28,3.31,3.31,0,0,0,10,14ZM16,4a3.86,3.86,0,0,1,2.77,1.14A3.9,3.9,0,0,1,20,7.85v4a.77.77,0,0,1-.22.53.7.7,0,0,1-.52.21.72.72,0,0,1-.74-.74v-4a2.46,2.46,0,0,0-.72-1.73A2.37,2.37,0,0,0,16,5.45H8.53A2.42,2.42,0,0,0,6.08,7.89v7.52a2.41,2.41,0,0,0,.71,1.73,2.46,2.46,0,0,0,1.74.72h4.08a.73.73,0,0,1,0,1.46H8.53a3.85,3.85,0,0,1-2.78-1.14A3.93,3.93,0,0,1,4.6,15.4V7.87A3.94,3.94,0,0,1,5.76,5.09,3.88,3.88,0,0,1,8.54,4H16Z" transform="translate(-4.45 -3.8)"/></g></svg>',
                print: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.05 16.04"><g><path d="M19.76,15.84a1.29,1.29,0,0,0,.39-.92V8.35A2.05,2.05,0,0,0,19.57,7a1.93,1.93,0,0,0-1.38-.57H6.37a1.95,1.95,0,0,0-2,2v6.56a1.23,1.23,0,0,0,.38.92,1.35,1.35,0,0,0,.93.38h2V14.9l-2,0V8.35a.67.67,0,0,1,.18-.47.62.62,0,0,1,.48-.19H18.18a.6.6,0,0,1,.46.19.66.66,0,0,1,.18.47V14.9h-2v1.32h2A1.35,1.35,0,0,0,19.76,15.84ZM17.52,7.69V5.06a1.31,1.31,0,0,0-.38-.92,1.34,1.34,0,0,0-.94-.38H8.34A1.3,1.3,0,0,0,7,5.06V7.69H8.34V5.06h7.87V7.69h1.31ZM8.34,12.93h7.87l0,5.26H8.34V12.93Zm7.87,5.26v0Zm.65,1.31a.6.6,0,0,0,.46-.19.72.72,0,0,0,.2-.47V12.29a.74.74,0,0,0-.2-.47.6.6,0,0,0-.46-.19H7.68a.6.6,0,0,0-.46.19.72.72,0,0,0-.2.47v6.55a.74.74,0,0,0,.2.47.6.6,0,0,0,.46.19h9.18ZM16.67,9.28a.7.7,0,0,0-.94,0,.63.63,0,0,0-.18.46.67.67,0,0,0,.18.47.68.68,0,0,0,.94,0,.66.66,0,0,0,.18-.47A.58.58,0,0,0,16.67,9.28Z" transform="translate(-4.25 -3.61)"/></g></svg>',
                template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.27 15.64"><g><path d="M18.18,19.16a1,1,0,0,0,1-1V5.73a1,1,0,0,0-1-1h-2v1h2V18.19H6.37V5.73h2v-1h-2A.94.94,0,0,0,5.68,5a1,1,0,0,0-.29.7V18.18a.94.94,0,0,0,.29.69,1,1,0,0,0,.69.29H18.18ZM9.82,10.31h4.92a.49.49,0,0,0,.35-.15.47.47,0,0,0,.15-.35.49.49,0,0,0-.15-.35.47.47,0,0,0-.35-.15H9.82a.49.49,0,0,0-.35.15.47.47,0,0,0-.15.35.49.49,0,0,0,.15.35.47.47,0,0,0,.35.15Zm5.9,4.92H8.83a.49.49,0,0,0-.35.15.47.47,0,0,0-.15.35.49.49,0,0,0,.15.35.47.47,0,0,0,.35.15h6.89a.49.49,0,0,0,.35-.15.47.47,0,0,0,.15-.35.51.51,0,0,0-.5-.5ZM7.36,12.77a.49.49,0,0,0,.15.35.47.47,0,0,0,.35.15h8.85a.49.49,0,0,0,.35-.15.47.47,0,0,0,.15-.35.49.49,0,0,0-.15-.35.47.47,0,0,0-.35-.15H7.85a.49.49,0,0,0-.35.15.52.52,0,0,0-.14.35Z" transform="translate(-5.14 -3.77)"/><path d="M14.24,6.71a1,1,0,0,0,1-1,1,1,0,0,0-1-1,1,1,0,0,0-1-1h-2a.94.94,0,0,0-.69.28,1,1,0,0,0-.29.7A.94.94,0,0,0,9.62,5a.91.91,0,0,0-.29.69,1,1,0,0,0,.29.7,1,1,0,0,0,.69.29h3.93Z" transform="translate(-5.14 -3.77)"/></g></svg>',
                line_height: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.76 13.56"><g><path d="M4.4,4.88V8.26a2,2,0,0,0,.5.39s.1,0,.18-.12a.62.62,0,0,0,.17-.28c.06-.19.13-.44.21-.74s.14-.52.19-.66a.58.58,0,0,1,.21-.3,2.41,2.41,0,0,1,.63-.21,3.83,3.83,0,0,1,.88-.12,9.15,9.15,0,0,1,1.31.06.16.16,0,0,1,.11,0,.26.26,0,0,1,.06.14,4,4,0,0,1,0,.49v2l.05,3.77c0,1.41,0,2.68-.05,3.81a1.79,1.79,0,0,1-.11.49,10.68,10.68,0,0,1-1.4.45,1.12,1.12,0,0,0-.69.43v.31l0,.22.61,0c.85-.08,1.54-.12,2.06-.12a19.76,19.76,0,0,1,2.09.08,15.08,15.08,0,0,0,1.64.08,1.4,1.4,0,0,0,.29,0,1.58,1.58,0,0,0,0-.26l-.05-.43a2.26,2.26,0,0,0-.43-.17l-.77-.22-.15,0a2.55,2.55,0,0,1-.78-.28,2.56,2.56,0,0,1-.11-.75l0-1.29,0-3.15V7.53a10.51,10.51,0,0,1,.06-1.2,3.83,3.83,0,0,1,.6,0l1.88,0a2.18,2.18,0,0,1,.38,0,.45.45,0,0,1,.23.17.9.9,0,0,1,.05.25c0,.16.06.35.1.58a3.33,3.33,0,0,0,.14.55A6.39,6.39,0,0,0,15,9a2.91,2.91,0,0,0,.6-.15,2.77,2.77,0,0,0,0-.46l0-.51,0-2.95-.25,0-.38,0L15,4.94a.71.71,0,0,1-.18.15.45.45,0,0,1-.25.07l-.29,0H8.75l-.15,0H7.45a17,17,0,0,1-1.86,0L5.36,5l-.25-.13ZM19.75,16.14h-.69v-9h.69A.4.4,0,0,0,20.13,7c.06-.11,0-.24-.1-.39L18.92,5.15a.52.52,0,0,0-.86,0L17,6.58c-.12.15-.16.28-.1.39s.18.16.38.16h.69v9h-.69a.4.4,0,0,0-.38.16c-.06.11,0,.24.1.39l1.11,1.43a.52.52,0,0,0,.86,0L20,16.69c.12-.15.16-.28.1-.39a.4.4,0,0,0-.38-.16Z" transform="translate(-4.4 -4.86)"/></g></svg>',
                paragraph_style: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.81 15.74"><g><path d="M18.18,3.76v2h-2V19.5h-2V5.73h-2V19.5h-2V11.63a3.94,3.94,0,0,1,0-7.87h7.87Z" transform="translate(-6.37 -3.76)"/></g></svg>',
                text_style: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.76 15.74"><g><path d="M17.68,6.71a2.22,2.22,0,0,0,1.06-.22.74.74,0,0,0,.42-.7.73.73,0,0,0-.08-.33.67.67,0,0,0-.17-.22,1,1,0,0,0-.31-.15L18.26,5l-.45-.09A15.27,15.27,0,0,0,13.26,5V4.74c0-.66-.63-1-1.92-1-.24,0-.43.15-.59.46a4,4,0,0,0-.36,1.14h0v0a26.45,26.45,0,0,1-3.5.35A2,2,0,0,0,5.77,6a.84.84,0,0,0-.37.79,2.14,2.14,0,0,0,.41,1.29,1.23,1.23,0,0,0,1.05.63,16.62,16.62,0,0,0,3.29-.45l-.34,3.35c-.16,1.61-.29,2.9-.37,3.86s-.12,1.66-.12,2.09l0,.65a5.15,5.15,0,0,0,.05.6,1.28,1.28,0,0,0,.16.54.34.34,0,0,0,.28.18,1.16,1.16,0,0,0,.79-.46,3.66,3.66,0,0,0,.68-1,22.08,22.08,0,0,0,1-4.33q.49-3.1.78-6.15a24.69,24.69,0,0,1,4.62-.84Z" transform="translate(-5.4 -3.76)"/></g></svg>',
                save: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M18.53,19.5l.2-.05A1.78,1.78,0,0,0,20.13,18l0-.09V7.14a2,2,0,0,0-.28-.64A3.18,3.18,0,0,0,19.43,6c-.5-.52-1-1-1.55-1.54A2.59,2.59,0,0,0,17.37,4a1.83,1.83,0,0,0-.61-.25H6l-.21,0a1.78,1.78,0,0,0-1.4,1.49l0,.1V17.87a2.49,2.49,0,0,0,.09.37,1.79,1.79,0,0,0,1.44,1.23l.09,0Zm-6.25-.6H6.92a.61.61,0,0,1-.68-.48.78.78,0,0,1,0-.22V12.3a.62.62,0,0,1,.69-.68H17.64a.62.62,0,0,1,.69.69V18.2a.64.64,0,0,1-.71.69H12.28ZM12,9.81H8.15a.63.63,0,0,1-.72-.71v-4a.64.64,0,0,1,.72-.72h7.66a.64.64,0,0,1,.72.72v4a.65.65,0,0,1-.74.72ZM13.5,5V9.18h1.78V5Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                blockquote: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 475.082 475.081"><g><path d="M164.45,219.27h-63.954c-7.614,0-14.087-2.664-19.417-7.994c-5.327-5.33-7.994-11.801-7.994-19.417v-9.132c0-20.177,7.139-37.401,21.416-51.678c14.276-14.272,31.503-21.411,51.678-21.411h18.271c4.948,0,9.229-1.809,12.847-5.424c3.616-3.617,5.424-7.898,5.424-12.847V54.819c0-4.948-1.809-9.233-5.424-12.85c-3.617-3.612-7.898-5.424-12.847-5.424h-18.271c-19.797,0-38.684,3.858-56.673,11.563c-17.987,7.71-33.545,18.132-46.68,31.267c-13.134,13.129-23.553,28.688-31.262,46.677C3.855,144.039,0,162.931,0,182.726v200.991c0,15.235,5.327,28.171,15.986,38.834c10.66,10.657,23.606,15.985,38.832,15.985h109.639c15.225,0,28.167-5.328,38.828-15.985c10.657-10.663,15.987-23.599,15.987-38.834V274.088c0-15.232-5.33-28.168-15.994-38.832C192.622,224.6,179.675,219.27,164.45,219.27z"/><path d="M459.103,235.256c-10.656-10.656-23.599-15.986-38.828-15.986h-63.953c-7.61,0-14.089-2.664-19.41-7.994c-5.332-5.33-7.994-11.801-7.994-19.417v-9.132c0-20.177,7.139-37.401,21.409-51.678c14.271-14.272,31.497-21.411,51.682-21.411h18.267c4.949,0,9.233-1.809,12.848-5.424c3.613-3.617,5.428-7.898,5.428-12.847V54.819c0-4.948-1.814-9.233-5.428-12.85c-3.614-3.612-7.898-5.424-12.848-5.424h-18.267c-19.808,0-38.691,3.858-56.685,11.563c-17.984,7.71-33.537,18.132-46.672,31.267c-13.135,13.129-23.559,28.688-31.265,46.677c-7.707,17.987-11.567,36.879-11.567,56.674v200.991c0,15.235,5.332,28.171,15.988,38.834c10.657,10.657,23.6,15.985,38.828,15.985h109.633c15.229,0,28.171-5.328,38.827-15.985c10.664-10.663,15.985-23.599,15.985-38.834V274.088C475.082,258.855,469.76,245.92,459.103,235.256z"/></g></svg>',
                arrow_down: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.73 8.67"><g><path d="M18.79,7.52a.8.8,0,0,1,.56-.23.82.82,0,0,1,.79.79.8.8,0,0,1-.23.56l-7.07,7.07a.79.79,0,0,1-.57.25.77.77,0,0,1-.57-.25h0L4.64,8.65a.8.8,0,0,1-.23-.57.82.82,0,0,1,.79-.79.8.8,0,0,1,.56.23L12.28,14l3.26-3.26,3.25-3.26Z" transform="translate(-4.41 -7.29)"/></g></svg>',
                align_justify: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.77"><g><path d="M4.41,4.74v2H20.15v-2H4.41Zm0,5.9H20.15v-2H4.41v2Zm0,3.94H20.15v-2H4.41v2Zm0,3.93h7.87v-2H4.41v2Z" transform="translate(-4.41 -4.74)"/></g></svg>',
                align_left: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.77"><g><path d="M4.41,4.74v2H20.15v-2H4.41Zm11.8,3.94H4.41v2H16.22v-2Zm-11.8,5.9H18.18v-2H4.41v2Zm0,3.93h9.84v-2H4.41v2Z" transform="translate(-4.41 -4.74)"/></g></svg>',
                align_right: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.77"><g><path d="M4.41,4.74v2H20.15v-2H4.41Zm3.93,5.9H20.15v-2H8.34v2Zm-2,3.94H20.14v-2H6.37v2Zm3.94,3.93h9.84v-2H10.31v2Z" transform="translate(-4.41 -4.74)"/></g></svg>',
                align_center: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.77"><g><path d="M4.41,4.74v2H20.15v-2H4.41Zm2,3.94v2H18.18v-2H6.37Zm-1,5.9H19.16v-2H5.39v2Zm2,3.93H17.2v-2H7.36v2Z" transform="translate(-4.41 -4.74)"/></g></svg>',
                font_color: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 14.61"><g><path d="M18.5,15.57,14.28,4.32h-3.4L6.65,15.57h3l.8-2.26h4.23l.8,2.26h3ZM14,11.07H11.14L12.54,7,13.25,9c.41,1.18.64,1.86.7,2ZM4.41,16.69v2.24H20.15V16.69H4.41Z" transform="translate(-4.41 -4.32)"/></g></svg>',
                highlight_color: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.66 15.74"><g><path d="M12.32,9.31,13.38,13H11.21l.52-1.83q.46-1.61.54-1.83ZM4.44,3.76H20.1V19.5H4.44V3.76ZM14.71,17.32h2.63L13.7,6H10.89L7.26,17.32H9.89l.63-2.24h3.55l.32,1.12c.18.65.29,1,.32,1.12Z" transform="translate(-4.44 -3.76)"/></g></svg>',
                list_bullets: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 12.37"><g><path d="M7.77,16.12a1.59,1.59,0,0,0-.49-1.18,1.62,1.62,0,0,0-1.19-.49,1.68,1.68,0,1,0,0,3.36,1.67,1.67,0,0,0,1.68-1.69Zm0-4.48A1.67,1.67,0,0,0,6.09,10,1.68,1.68,0,0,0,4.9,12.82a1.62,1.62,0,0,0,1.19.49,1.67,1.67,0,0,0,1.68-1.67Zm12.38,3.64a.27.27,0,0,0-.08-.19.28.28,0,0,0-.2-.09H9.19a.28.28,0,0,0-.2.08.29.29,0,0,0-.08.19V17a.27.27,0,0,0,.28.28H19.87a.27.27,0,0,0,.19-.08.24.24,0,0,0,.08-.2V15.28ZM7.77,7.13a1.63,1.63,0,0,0-.49-1.2,1.61,1.61,0,0,0-1.19-.49,1.61,1.61,0,0,0-1.19.49,1.71,1.71,0,0,0,0,2.4,1.62,1.62,0,0,0,1.19.49,1.61,1.61,0,0,0,1.19-.49,1.63,1.63,0,0,0,.49-1.2Zm12.38,3.66a.28.28,0,0,0-.08-.2.29.29,0,0,0-.19-.08H9.19a.27.27,0,0,0-.28.28v1.69a.27.27,0,0,0,.08.19.24.24,0,0,0,.2.08H19.87a.27.27,0,0,0,.19-.08.25.25,0,0,0,.08-.19V10.79Zm0-4.5a.27.27,0,0,0-.08-.19A.25.25,0,0,0,19.88,6H9.19A.28.28,0,0,0,9,6.1a.26.26,0,0,0-.08.19V8A.27.27,0,0,0,9,8.17a.24.24,0,0,0,.2.08H19.87a.27.27,0,0,0,.19-.08A.25.25,0,0,0,20.14,8V6.29Z" transform="translate(-4.41 -5.44)"/></g></svg>',
                list_number: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.69 15.74"><g><path d="M7.66,18a1.24,1.24,0,0,0-.26-.78,1.17,1.17,0,0,0-.72-.42l.85-1V15H4.58v1.34h.94v-.46l.85,0h0c-.11.11-.22.23-.32.35s-.23.27-.37.47L5.39,17l.23.51c.61-.05.92.11.92.49a.42.42,0,0,1-.18.37.79.79,0,0,1-.45.12A1.41,1.41,0,0,1,5,18.15l-.51.77A2.06,2.06,0,0,0,6,19.5a1.8,1.8,0,0,0,1.2-.41A1.38,1.38,0,0,0,7.66,18Zm0-5.54H6.75V13H5.63A.72.72,0,0,1,6,12.51a5.45,5.45,0,0,1,.66-.45,2.71,2.71,0,0,0,.67-.57,1.19,1.19,0,0,0,.31-.81,1.29,1.29,0,0,0-.45-1,1.86,1.86,0,0,0-2-.11,1.51,1.51,0,0,0-.62.7l.74.52A.87.87,0,0,1,6,10.28a.51.51,0,0,1,.35.12.42.42,0,0,1,.13.33.55.55,0,0,1-.21.4,3,3,0,0,1-.5.38c-.19.13-.39.27-.58.42a2,2,0,0,0-.5.6,1.63,1.63,0,0,0-.21.81,3.89,3.89,0,0,0,.05.48h3.2V12.44Zm12.45,2.82a.27.27,0,0,0-.08-.19.28.28,0,0,0-.21-.08H9.1a.32.32,0,0,0-.21.08.24.24,0,0,0-.08.2V17a.27.27,0,0,0,.08.19.3.3,0,0,0,.21.08H19.83a.32.32,0,0,0,.21-.08.25.25,0,0,0,.08-.19V15.26ZM7.69,7.32h-1V3.76H5.8L4.6,4.88l.63.68a1.85,1.85,0,0,0,.43-.48h0l0,2.24H4.74V8.2h3V7.32Zm12.43,3.42a.27.27,0,0,0-.08-.19.28.28,0,0,0-.21-.08H9.1a.32.32,0,0,0-.21.08.24.24,0,0,0-.08.2v1.71a.27.27,0,0,0,.08.19.3.3,0,0,0,.21.08H19.83a.32.32,0,0,0,.21-.08.25.25,0,0,0,.08-.19V10.74Zm0-4.52A.27.27,0,0,0,20,6,.28.28,0,0,0,19.83,6H9.1A.32.32,0,0,0,8.89,6a.24.24,0,0,0-.08.19V7.93a.27.27,0,0,0,.08.19.32.32,0,0,0,.21.08H19.83A.32.32,0,0,0,20,8.12a.26.26,0,0,0,.08-.2V6.22Z" transform="translate(-4.43 -3.76)"/></g></svg>',
                table: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M4.41,8.05V3.76H8.7V8.05H4.41Zm5.71,0V3.76h4.3V8.05h-4.3Zm5.74-4.29h4.29V8.05H15.86V3.76Zm-11.45,10V9.48H8.7v4.3H4.41Zm5.71,0V9.48h4.3v4.3h-4.3Zm5.74,0V9.48h4.29v4.3H15.86ZM4.41,19.5V15.21H8.7V19.5H4.41Zm5.71,0V15.21h4.3V19.5h-4.3Zm5.74,0V15.21h4.29V19.5H15.86Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                horizontal_rule: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 2.24"><g><path d="M20.15,12.75V10.51H4.41v2.24H20.15Z" transform="translate(-4.41 -10.51)"/></g></svg>',
                show_blocks: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.66 15.67"><g><path d="M19.72,5.58a1.64,1.64,0,0,0-1.64-1.64H6.23a1.62,1.62,0,0,0-1.16.48,1.63,1.63,0,0,0-.48,1.16V9.63a1.6,1.6,0,0,0,.48,1.16,1.62,1.62,0,0,0,1.16.47H18.09a1.67,1.67,0,0,0,1.16-.47,1.62,1.62,0,0,0,.48-1.16V5.58Zm-.94,4.05a.68.68,0,0,1-.7.7H6.23a.66.66,0,0,1-.48-.2.74.74,0,0,1-.21-.5V5.58a.66.66,0,0,1,.2-.48.71.71,0,0,1,.48-.21H18.08a.74.74,0,0,1,.5.21.66.66,0,0,1,.2.48ZM6.48,7.72a.21.21,0,0,0,.17-.07.22.22,0,0,0,.07-.17V7.06a1.27,1.27,0,0,1,.11-.52.37.37,0,0,1,.36-.23H8.77A.25.25,0,0,0,9,6.17a.19.19,0,0,0,0-.23.27.27,0,0,0-.2-.12H7.19a.88.88,0,0,0-.72.39,1.51,1.51,0,0,0-.23.85v.42a.24.24,0,0,0,.24.24Zm-.19.81a.21.21,0,0,0,.17-.07.26.26,0,0,0,.07-.17.24.24,0,0,0-.24-.24.2.2,0,0,0-.16.09.2.2,0,0,0-.07.16.22.22,0,0,0,.07.17.23.23,0,0,0,.16.06Zm8.46,5.1a1.63,1.63,0,0,0-.47-1.16A1.61,1.61,0,0,0,13.12,12H6.23a1.6,1.6,0,0,0-1.16.46,1.62,1.62,0,0,0-.48,1.16v4.05a1.64,1.64,0,0,0,1.64,1.64h6.89a1.6,1.6,0,0,0,1.16-.48,1.62,1.62,0,0,0,.47-1.16Zm-.94,4a.7.7,0,0,1-.2.49.65.65,0,0,1-.5.2H6.23a.66.66,0,0,1-.48-.2.75.75,0,0,1-.21-.49v-4a.74.74,0,0,1,.21-.5.66.66,0,0,1,.48-.2h6.89a.68.68,0,0,1,.7.7v4Zm6.15,0v-4a1.6,1.6,0,0,0-.48-1.16A1.67,1.67,0,0,0,18.32,12H17.1a1.63,1.63,0,0,0-1.16.47,1.61,1.61,0,0,0-.47,1.16v4a1.67,1.67,0,0,0,.47,1.16,1.62,1.62,0,0,0,1.16.48h1.22A1.64,1.64,0,0,0,20,17.68Zm-.94-4v4a.75.75,0,0,1-.21.49.62.62,0,0,1-.48.2H17.11a.69.69,0,0,1-.5-.2.7.7,0,0,1-.2-.49v-4a.68.68,0,0,1,.7-.7h1.22a.66.66,0,0,1,.48.2.72.72,0,0,1,.21.5Z" transform="translate(-4.44 -3.79)"/></g></svg>',
                cancel: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M14.15,11.63l5.61,5.61a1.29,1.29,0,0,1,.38.93,1.27,1.27,0,0,1-.4.93,1.25,1.25,0,0,1-.92.4,1.31,1.31,0,0,1-.94-.4l-5.61-5.61L6.67,19.1a1.31,1.31,0,0,1-.94.4,1.24,1.24,0,0,1-.92-.4,1.27,1.27,0,0,1-.4-.93,1.33,1.33,0,0,1,.38-.93l5.61-5.63L4.79,6a1.26,1.26,0,0,1-.38-.93,1.22,1.22,0,0,1,.4-.92,1.28,1.28,0,0,1,.92-.39,1.38,1.38,0,0,1,.94.38l5.61,5.61,5.61-5.61a1.33,1.33,0,0,1,.94-.38,1.26,1.26,0,0,1,.92.39,1.24,1.24,0,0,1,.4.92,1.29,1.29,0,0,1-.39.93L17,8.81l-2.8,2.82Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 15.77"><g><path d="M8.77,8.72a.88.88,0,0,1-.61-.27.82.82,0,0,1-.25-.61.89.89,0,0,1,.25-.62A.82.82,0,0,1,8.77,7a.81.81,0,0,1,.61.25.83.83,0,0,1,.27.62.81.81,0,0,1-.25.61.91.91,0,0,1-.63.27Zm9.62-5a1.74,1.74,0,0,1,1.76,1.76V17.76a1.74,1.74,0,0,1-1.76,1.76H6.16A1.74,1.74,0,0,1,4.4,17.76V5.51A1.74,1.74,0,0,1,6.16,3.75H18.39Zm0,1.75H6.16v8L8.53,11.8a.94.94,0,0,1,.54-.17.86.86,0,0,1,.54.2L11.09,13l3.64-4.55a.78.78,0,0,1,.34-.25.85.85,0,0,1,.42-.07.89.89,0,0,1,.39.12.78.78,0,0,1,.28.29l2.24,3.67V5.51Zm0,12.24V15.6L15.3,10.53,11.89,14.8a.89.89,0,0,1-.59.32.82.82,0,0,1-.64-.18L9,13.62,6.16,15.74v2Z" transform="translate(-4.4 -3.75)"/></g></svg>',
                video: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 14.55"><g><path d="M20.15,10.26V18.9l-3.94-1.57v1.2H4.41V10.66H16.22v1.23l2-.81,2-.82ZM14.64,17h0V12.54h0v-.31H6V17h8.67Zm3.94-.37v-4l-2.37,1v2l1.18.48,1.19.48ZM7.94,9.86A2.77,2.77,0,0,1,5.19,7.11a2.76,2.76,0,0,1,5.51,0A2.78,2.78,0,0,1,7.94,9.86Zm0-3.93a1.21,1.21,0,0,0-.83.35,1.15,1.15,0,0,0-.34.84A1.09,1.09,0,0,0,7.11,8,1.15,1.15,0,0,0,8,8.28,1.13,1.13,0,0,0,9.11,7.12,1.16,1.16,0,0,0,7.94,5.93Zm5.9,3.93a2.34,2.34,0,0,1-1.67-.68,2.3,2.3,0,0,1-.68-1.67,2.35,2.35,0,0,1,4-1.67,2.37,2.37,0,0,1,0,3.34,2.33,2.33,0,0,1-1.68.68Zm0-3.14a.75.75,0,1,0,.55.22.73.73,0,0,0-.55-.22Z" transform="translate(-4.41 -4.35)"/></g></svg>',
                link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.72"><g><path d="M13.05,13.63a.24.24,0,0,1,.15.22L13.42,16a.19.19,0,0,1-.08.18l-2.12,2.14a4.08,4.08,0,0,1-1.29.85A4,4,0,0,1,4.71,17a3.92,3.92,0,0,1-.3-1.52A4,4,0,0,1,4.71,14a3.91,3.91,0,0,1,.87-1.3L7.7,10.56a.25.25,0,0,1,.2-.06l2.17.22a.21.21,0,0,1,.19.15.24.24,0,0,1,0,.25L7.12,14.23a1.81,1.81,0,0,0,0,2.58,1.78,1.78,0,0,0,1.29.52,1.74,1.74,0,0,0,1.28-.52L12.8,13.7a.24.24,0,0,1,.25-.07ZM19,4.92a4,4,0,0,1,0,5.66L16.86,12.7a.25.25,0,0,1-.17.08l-2.2-.23a.21.21,0,0,1-.19-.15.22.22,0,0,1,0-.25L17.44,9a1.81,1.81,0,0,0,0-2.58,1.78,1.78,0,0,0-1.29-.52,1.74,1.74,0,0,0-1.28.52L11.76,9.57a.21.21,0,0,1-.25,0,.24.24,0,0,1-.16-.21l-.22-2.17a.19.19,0,0,1,.08-.18l2.12-2.14a4.08,4.08,0,0,1,1.29-.85,4.05,4.05,0,0,1,3.06,0,3.85,3.85,0,0,1,1.3.85ZM5.84,9.82a.25.25,0,0,1-.18-.08.19.19,0,0,1-.07-.19l.11-.77a.2.2,0,0,1,.11-.17.24.24,0,0,1,.2,0l2.5.72a.25.25,0,0,1,.15.27.22.22,0,0,1-.23.21l-2.59,0Zm4.12-2-.73-2.5a.27.27,0,0,1,0-.2A.21.21,0,0,1,9.41,5L10.19,5a.25.25,0,0,1,.19,0,.23.23,0,0,1,.08.18l-.05,2.61a.2.2,0,0,1-.19.23h0A.22.22,0,0,1,10,7.85Zm8.76,5.58a.25.25,0,0,1,.18.08.23.23,0,0,1,.06.2l-.11.77a.25.25,0,0,1-.11.17.21.21,0,0,1-.12,0l-.08,0L16,14a.25.25,0,0,1-.15-.27.22.22,0,0,1,.22-.21l1.29,0,1.33,0Zm-4.12,2,.74,2.51a.28.28,0,0,1,0,.2.23.23,0,0,1-.18.11l-.8.11a.23.23,0,0,1-.17-.07.25.25,0,0,1-.08-.18l0-2.61a.22.22,0,0,1,.22-.22.21.21,0,0,1,.26.15Z" transform="translate(-4.41 -3.77)"/></g></svg>',
                math: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.81 15.73"><g><path d="M17.19,5.73a1,1,0,0,0,.71-.29,1,1,0,0,0,.28-.7,1,1,0,0,0-1-1H7.35a1,1,0,0,0-1,1,.77.77,0,0,0,.13.47h0l4.58,6.43L6.68,17.81a1.25,1.25,0,0,0-.29.71.94.94,0,0,0,.28.7.92.92,0,0,0,.69.28H17.2a1,1,0,0,0,.71-.28,1,1,0,0,0,0-1.39.92.92,0,0,0-.71-.29H9.26l3.87-5.43a.86.86,0,0,0,0-.95L9.26,5.73h7.93Z" transform="translate(-6.38 -3.77)"/></g></svg>',
                unlink: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.72"><g><path d="M19,18.32a4,4,0,0,0,0-5.68L15.85,9.5l-1.17,1.55L17.57,14a2,2,0,0,1,.61,1.47,2.08,2.08,0,0,1-2.09,2.09,2,2,0,0,1-1.47-.61l-.38-.37-1.74,1,.8.78a4,4,0,0,0,5.68,0ZM8,9.77a2,2,0,0,1-1.27-1,1.89,1.89,0,0,1-.21-1.57A2.1,2.1,0,0,1,7.45,6,2,2,0,0,1,9,5.76L12.27,7.2l.49-2L9.48,3.9a4,4,0,0,0-3.06.41A3.82,3.82,0,0,0,4.56,6.73a3.8,3.8,0,0,0,.4,3A3.78,3.78,0,0,0,7.39,11.6l5.38,2,.49-2-2.64-.94L8,9.77Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                table_header: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 15.74"><g><path d="M17,19.5v-.78H15.5v.78H17Zm-3,0v-.78H12.5v.78H14Zm-3,0v-.78H9.53v.78H11Zm-3,0v-.78H6.53v.78H8Zm10.55,0a1.73,1.73,0,0,0,.85-.35,1.67,1.67,0,0,0,.56-.76l-.71-.31a1.21,1.21,0,0,1-.35.4,1.34,1.34,0,0,1-.53.23l.08.38c.06.24.09.38.1.41Zm-13.7-.63.55-.55A.77.77,0,0,1,5.25,18a1.31,1.31,0,0,1-.06-.38v-.38H4.41v.38a2,2,0,0,0,.12.68,1.6,1.6,0,0,0,.35.57Zm15.27-2.12V15.26h-.78v1.49h.78Zm-15-1V14.23H4.41v1.49h.78Zm15-2V12.26h-.78v1.49h.78Zm-15-1V11.22H4.41v1.51h.78Zm15-2V9.26h-.78v1.51h.78Zm-15-1V8.17H4.41V9.74h.78Zm15-2V6.28h-.78V7.77h.78Zm-15-1.11V5.33L4.48,5.1a.77.77,0,0,0-.07.27,2.72,2.72,0,0,0,0,.28v1h.79ZM19.21,5l.63-.4A1.62,1.62,0,0,0,19.16,4a1.94,1.94,0,0,0-.91-.22v.78a1.31,1.31,0,0,1,.56.12.88.88,0,0,1,.4.36ZM6,4.54H7.78V3.76H6a.82.82,0,0,0-.28.06l.12.35c.07.21.1.33.11.36Zm10.8,0V3.76H15.28v.78h1.49Zm-3,0V3.76H12.28v.78h1.49Zm-3,0V3.76H9.28v.78h1.51ZM6,10.84h12.6V6.91H6Z" transform="translate(-4.4 -3.76)"/></g></svg>',
                merge_cell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.76 15.74"><g><path d="M18.92,13.5h1.23v4.15A1.84,1.84,0,0,1,18.3,19.5H14V18.27H18.3a.6.6,0,0,0,.44-.18.59.59,0,0,0,.18-.44V13.5ZM18.3,3.76a1.84,1.84,0,0,1,1.85,1.85V9.82H18.92V5.6a.6.6,0,0,0-.18-.44A.59.59,0,0,0,18.3,5H14V3.76H18.3Zm1.85,8.51H15.6L17.26,14l-.86.86-3.14-3.17L16.4,8.51l.86.86L15.62,11h4.54v1.24Zm-13.9,6h4.27V19.5H6.25A1.84,1.84,0,0,1,4.4,17.65V13.5H5.63v4.15a.61.61,0,0,0,.62.62Zm0-14.51h4.27V5H6.25a.6.6,0,0,0-.44.18.57.57,0,0,0-.17.43V9.81H4.41V5.6A1.83,1.83,0,0,1,6.25,3.76Zm5,7.9L8.15,14.83,7.3,14,9,12.27H4.41V11H8.94L7.3,9.38,7.73,9l.43-.43Z" transform="translate(-4.4 -3.76)"/></g></svg>',
                split_cell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 15.74"><g><path d="M10.37,12.25H6.74L8.4,13.94l-.87.86L4.41,11.63,7.53,8.5l.87.86L6.74,11h3.62v1.23Zm9.78-.61L17,14.81,16.13,14l1.66-1.69H14.16V11h3.63L16.13,9.37l.43-.43A5.24,5.24,0,0,1,17,8.51ZM18.9,8.22V5.61a.57.57,0,0,0-.18-.43A.65.65,0,0,0,18.29,5H12.88V18.28h5.41a.7.7,0,0,0,.44-.18.57.57,0,0,0,.18-.43V15h1.23v2.64a1.84,1.84,0,0,1-1.85,1.83h-12A1.84,1.84,0,0,1,4.94,19a1.81,1.81,0,0,1-.54-1.29V15H5.63v2.64a.57.57,0,0,0,.18.43.67.67,0,0,0,.44.18h5.41V5H6.25a.7.7,0,0,0-.44.18.56.56,0,0,0-.17.43V8.22H4.41V5.61A1.8,1.8,0,0,1,5,4.31a1.91,1.91,0,0,1,1.31-.55h12a1.89,1.89,0,0,1,1.31.55,1.8,1.8,0,0,1,.54,1.3V8.23H18.9Z" transform="translate(-4.4 -3.76)"/></g></svg>',
                caption: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 13.79"><g><path d="M4.41,18.52H20.15v-2H4.41ZM20,4.73H18.07V6h.65v.65H20V4.73ZM17,6V4.73H14.55V6H17ZM13.49,6V4.73H11V6h2.47ZM10,6V4.73H7.5V6H10ZM5.79,6h.65V4.73H4.5V6.67H5.8V6ZM4.5,11.34H5.79V8.48H4.5ZM6.44,13.8H5.79v-.65H4.5v1.94H6.44ZM17,15.09V13.8H14.55v1.29H17Zm-3.52,0V13.8H11v1.29h2.47Zm-3.53,0V13.8H7.5v1.29H10ZM20,13.16H18.72v.65h-.65V15.1H20Zm-1.29-1.82H20V8.48h-1.3v2.86Z" transform="translate(-4.41 -4.73)"/></g></svg>',
                edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.73"><g><path d="M7.51,5.68h6l1.52-1.57H6.94a2.4,2.4,0,0,0-1.79.82A2.8,2.8,0,0,0,4.41,6.8V17a2.55,2.55,0,0,0,.75,1.8A2.48,2.48,0,0,0,7,19.5H17.22a2.57,2.57,0,0,0,1.83-.74,2.52,2.52,0,0,0,.77-1.8V8.83l-1.58,1.54v6a1.54,1.54,0,0,1-1.53,1.53H7.51A1.54,1.54,0,0,1,6,16.41V7.21A1.52,1.52,0,0,1,7.51,5.68Zm5.63,7.47h0L10.7,10.74l-1,3.38,1.71-.48,1.7-.49Zm.34-.34h0l5.36-5.32L16.4,5.08,11,10.4l1.23,1.21,1.21,1.2ZM19.93,6.4a.82.82,0,0,0,.22-.48A.54.54,0,0,0,20,5.47L18.45,4A.67.67,0,0,0,18,3.77a.7.7,0,0,0-.48.21l-.74.72,2.44,2.43.37-.37.35-.36Z" transform="translate(-4.41 -3.77)"/></g></svg>',
                delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.73 15.74"><g><path d="M19.16,6.71a.94.94,0,0,0,.69-.28.91.91,0,0,0,.29-.68A1,1,0,0,0,19.85,5a.93.93,0,0,0-.69-.3H14.24A.94.94,0,0,0,14,4.06a.92.92,0,0,0-.7-.3h-2a1,1,0,0,0-.7.3.93.93,0,0,0-.28.68H5.39A.92.92,0,0,0,4.7,5a1,1,0,0,0-.29.71.91.91,0,0,0,.29.68,1,1,0,0,0,.69.28H19.16Zm-12.79,1a1,1,0,0,0-.7.3.94.94,0,0,0-.28.69v8.85A1.88,1.88,0,0,0,6,18.93a1.9,1.9,0,0,0,1.39.57H17.2a1.87,1.87,0,0,0,1.39-.58,1.91,1.91,0,0,0,.58-1.39V8.68A1,1,0,0,0,18.88,8a.89.89,0,0,0-.7-.29,1,1,0,0,0-.69.29.92.92,0,0,0-.29.68v7.87a1,1,0,0,1-1,1H8.34a.94.94,0,0,1-.69-.28,1,1,0,0,1-.29-.71V8.68a1,1,0,0,0-1-1Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                modify: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.7 15.74"><g><path d="M19.79,15.23a.66.66,0,0,1,.3.38.59.59,0,0,1-.07.48l-.8,1.38a.66.66,0,0,1-.38.3.59.59,0,0,1-.48-.07l-.68-.38a4.55,4.55,0,0,1-1.34.77v.78a.64.64,0,0,1-.18.45.61.61,0,0,1-.45.18h-1.6a.6.6,0,0,1-.44-.18.66.66,0,0,1-.19-.45v-.78a4.36,4.36,0,0,1-1.32-.77l-.69.38a.58.58,0,0,1-.48.07.66.66,0,0,1-.38-.3l-.38-.66h.83a1.77,1.77,0,0,0,1.23-.52,1.72,1.72,0,0,0,.51-1.23v-.18a3,3,0,0,0,.49-.28l.15.09a1.83,1.83,0,0,0,.88.23A1.75,1.75,0,0,0,15.84,14l.88-1.52a1.7,1.7,0,0,0,.17-1.32,1.66,1.66,0,0,0-.3-.61,1.84,1.84,0,0,0-.51-.45l-.15-.09,0-.29,0-.28.15-.09a1,1,0,0,0,.26-.18l0,.06v.78a4.34,4.34,0,0,1,1.34.77l.68-.38a.68.68,0,0,1,.48-.06.64.64,0,0,1,.38.29l.8,1.38a.58.58,0,0,1,.07.48.63.63,0,0,1-.3.38l-.68.4a3.84,3.84,0,0,1,.08.76,4.13,4.13,0,0,1-.08.78l.34.18.32.2ZM10.17,7.86a1.9,1.9,0,0,1,1.35,3.23,1.85,1.85,0,0,1-1.35.55A1.9,1.9,0,0,1,8.83,8.41a1.92,1.92,0,0,1,1.34-.55Zm1.58,7.2a.73.73,0,0,1-.21.49.66.66,0,0,1-.48.2H9.29a.68.68,0,0,1-.69-.69V14.2a4.75,4.75,0,0,1-1.48-.86l-.75.45a.73.73,0,0,1-.7,0,.63.63,0,0,1-.25-.26L4.54,12a.67.67,0,0,1-.08-.53.71.71,0,0,1,.32-.42l.75-.43a4.8,4.8,0,0,1-.08-.85,4.71,4.71,0,0,1,.08-.85l-.74-.44a.71.71,0,0,1-.32-.42.65.65,0,0,1,.07-.54L5.42,6a.66.66,0,0,1,.42-.32l.18,0a.73.73,0,0,1,.35.09l.75.43A4.68,4.68,0,0,1,8.6,5.33V4.45a.68.68,0,0,1,.69-.69h1.77a.64.64,0,0,1,.48.2.73.73,0,0,1,.21.49v.88a4.75,4.75,0,0,1,1.48.85L14,5.75a.67.67,0,0,1,.34-.09l.18,0a.71.71,0,0,1,.42.32l.89,1.54a.67.67,0,0,1,.06.52.73.73,0,0,1-.32.43l-.75.42a4.8,4.8,0,0,1,.08.85,4.71,4.71,0,0,1-.08.85l.75.43a.66.66,0,0,1,.32.42.73.73,0,0,1-.06.54l-.89,1.52a.69.69,0,0,1-.25.26.7.7,0,0,1-.35.09.64.64,0,0,1-.34-.09l-.75-.45a4.87,4.87,0,0,1-1.48.86v.87ZM7.23,9.75a3,3,0,0,0,.86,2.08,2.94,2.94,0,1,0,4.16-4.16,3,3,0,0,0-2.08-.85A2.94,2.94,0,0,0,7.23,9.75Z" transform="translate(-4.44 -3.76)"/></g></svg>',
                revert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.76 14.69"><g><path d="M18.26,15V12.3l1.89-2V15a2.58,2.58,0,0,1-.24,1c-.2.58-.75.92-1.65,1H7.56v2L4.41,15.63,7.56,13v2h10.7ZM6.3,8.28V11L4.41,13V8.28a2.58,2.58,0,0,1,.24-1c.2-.58.75-.92,1.65-1H17v-2l3.15,3.34L17,10.3v-2H6.3Z" transform="translate(-4.4 -4.28)"/></g></svg>',
                auto_size: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 15.74"><g><path d="M6.71,17.19,6.89,16l1.21-.15A6,6,0,0,1,6.81,13.9a5.78,5.78,0,0,1-.45-2.27A6,6,0,0,1,8.1,7.45a5.83,5.83,0,0,1,4.17-1.73l1-1-1-1A7.89,7.89,0,0,0,5,14.64a7.73,7.73,0,0,0,1.71,2.55Zm5.57,2.31h0A7.86,7.86,0,0,0,17.85,6.07L17.67,7.3l-1.21.15a5.9,5.9,0,0,1,1.29,1.92,5.81,5.81,0,0,1,.45,2.26,5.91,5.91,0,0,1-5.9,5.9l-1,1,.49.49.47.5Z" transform="translate(-4.41 -3.76)"/></g></svg>',
                insert_row_below: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M15.7,1.3c-0.1-0.1-0.1-0.2-0.2-0.2L15.3,1H0.4L0.3,1.1c0,0-0.1,0.1-0.1,0.1c0,0-0.1,0.1-0.1,0.1L0,1.4v7.7l0.1,0.1c0,0.1,0.1,0.1,0.2,0.2l0.1,0.1h2.3V9.3l0.1-0.5L3,8.5l0.1-0.2c-0.1,0-0.2,0-0.3,0H1.2v-6h13.3v6h-1.6c-0.1,0-0.2,0-0.3,0l0.1,0.2l0.2,0.4C12.9,9,13,9.2,13,9.3v0.1h2.3l0.2-0.1c0.1,0,0.1-0.1,0.2-0.2l0.1-0.1V1.4L15.7,1.3z"/><path d="M10.5,7.5C9.9,7.1,9.3,6.8,8.6,6.7c-0.2,0-0.5-0.1-0.7,0c-0.2,0-0.5,0-0.7,0C6.6,6.7,6.1,6.9,5.6,7.3C5.2,7.6,4.7,8,4.4,8.4C4.3,8.6,4.2,8.8,4.2,8.9C4.1,9.1,4,9.3,3.9,9.4C3.9,9.6,3.8,9.7,3.8,9.9c0,0.2-0.1,0.3-0.1,0.5v-0.1c-0.1,0.8,0.1,1.6,0.5,2.4c0.4,0.7,1,1.3,1.7,1.7c0.3,0.2,0.6,0.3,0.9,0.3c0.3,0.1,0.7,0.1,1,0.1c0.3,0,0.7,0,1-0.1c0.3-0.1,0.6-0.2,0.9-0.3c0.5-0.3,0.9-0.6,1.3-1c0.3-0.4,0.6-0.8,0.8-1.3c0.1-0.4,0.2-0.9,0.2-1.4c0-0.5-0.1-1-0.3-1.4C11.5,8.6,11.1,8,10.5,7.5z M10.1,11.3H8.5v1.6H8H7.9H7.3v0v-0.1v-1.4H5.7v-0.4v-0.2v-0.6h0h1.5V8.5h1.2v1.6h1.6V11.3z"/></g></svg>',
                insert_row_above: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M0.1,14.5c0.1,0.1,0.1,0.2,0.2,0.2l0.1,0.1h14.9l0.1-0.1c0,0,0.1-0.1,0.1-0.1c0,0,0.1-0.1,0.1-0.1l0.1-0.1V6.7l-0.1-0.1c0-0.1-0.1-0.1-0.2-0.2l-0.1-0.1h-2.3v0.1l-0.1,0.5l-0.2,0.4l-0.1,0.2c0.1,0,0.2,0,0.3,0h1.6v6H1.3v-6h1.6c0.1,0,0.2,0,0.3,0L3.1,7.3L2.9,6.9C2.8,6.8,2.8,6.6,2.7,6.5V6.3H0.4L0.3,6.4c-0.1,0-0.1,0.1-0.2,0.2L0,6.7v7.7L0.1,14.5z"/><path d="M5.3,8.3c0.6,0.5,1.2,0.8,1.9,0.9c0.2,0,0.5,0.1,0.7,0c0.2,0,0.5,0,0.7,0c0.6-0.1,1.1-0.3,1.6-0.6c0.5-0.3,0.9-0.7,1.2-1.2c0.1-0.2,0.2-0.3,0.3-0.5c0.1-0.2,0.2-0.4,0.2-0.5c0.1-0.1,0.1-0.3,0.1-0.4C12,5.8,12,5.6,12,5.4v0.1c0.1-0.8-0.1-1.6-0.5-2.4c-0.4-0.7-1-1.3-1.7-1.7C9.5,1.3,9.2,1.2,8.9,1.1C8.5,1,8.2,1,7.9,1c-0.3,0-0.7,0-1,0.1C6.6,1.2,6.3,1.3,6,1.4C5.5,1.7,5.1,2,4.7,2.4C4.4,2.8,4.1,3.3,3.9,3.8C3.8,4.2,3.7,4.7,3.7,5.2c0,0.5,0.1,1,0.3,1.4C4.3,7.2,4.7,7.8,5.3,8.3z M5.7,4.5h1.6V2.9h0.5h0.1h0.6v0v0.1v1.4H10v0.4v0.2v0.6h0H8.5v1.6H7.3V5.7H5.7V4.5z"/></g></svg>',
                insert_column_left: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M14.5,15.7c0.1-0.1,0.2-0.1,0.2-0.2l0.1-0.1V0.4l-0.1-0.1c0,0-0.1-0.1-0.1-0.1c0,0-0.1-0.1-0.1-0.1L14.4,0H6.7L6.6,0.1c-0.1,0-0.1,0.1-0.2,0.2L6.3,0.4v2.3h0.1l0.5,0.1L7.3,3l0.2,0.1c0-0.1,0-0.2,0-0.3V1.2h6v13.3h-6v-1.6c0-0.1,0-0.2,0-0.3l-0.2,0.1l-0.4,0.2C6.7,12.9,6.6,13,6.4,13H6.3v2.3l0.1,0.2c0,0.1,0.1,0.1,0.2,0.2l0.1,0.1h7.7L14.5,15.7z"/><path d="M8.3,10.5C8.7,10,9,9.3,9.1,8.6c0-0.2,0.1-0.5,0-0.7c0-0.2,0-0.5,0-0.7C9,6.7,8.8,6.1,8.5,5.7C8.2,5.2,7.8,4.8,7.3,4.5C7.2,4.4,7,4.3,6.9,4.2C6.7,4.1,6.5,4,6.4,4C6.2,3.9,6.1,3.9,5.9,3.8c-0.2,0-0.3-0.1-0.5-0.1h0.1C4.7,3.7,3.8,3.9,3.1,4.3C2.4,4.7,1.8,5.3,1.4,6C1.3,6.3,1.2,6.6,1.1,6.9C1,7.2,1,7.6,1,7.9c0,0.3,0,0.7,0.1,1c0.1,0.3,0.2,0.6,0.3,0.9c0.3,0.5,0.6,0.9,1,1.3c0.4,0.3,0.8,0.6,1.3,0.8C4.2,12,4.7,12.1,5.1,12c0.5,0,1-0.1,1.4-0.3C7.2,11.5,7.8,11.1,8.3,10.5zM4.5,10.1V8.5H2.9V8V7.9V7.3h0H3h1.4V5.7h0.4h0.2h0.6v0v1.5h1.6v1.2H5.7v1.6H4.5z"/></g></svg>',
                insert_column_right: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M1.3,0.1C1.2,0.2,1.1,0.2,1.1,0.3L1,0.4v14.9l0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1l0.1,0.1h7.7l0.1-0.1c0.1,0,0.1-0.1,0.2-0.2l0.1-0.1v-2.3H9.3l-0.5-0.1l-0.4-0.2l-0.2-0.1c0,0.1,0,0.2,0,0.3v1.6h-6V1.3h6v1.6c0,0.1,0,0.2,0,0.3l0.2-0.1l0.4-0.2C9,2.9,9.2,2.8,9.3,2.8h0.1V0.5L9.4,0.3c0-0.1-0.1-0.1-0.2-0.2L9.1,0H1.4L1.3,0.1z"/><path d="M7.5,5.3C7,5.8,6.7,6.5,6.6,7.2c0,0.2-0.1,0.5,0,0.7c0,0.2,0,0.5,0,0.7c0.1,0.6,0.3,1.1,0.6,1.6c0.3,0.5,0.7,0.9,1.2,1.2c0.2,0.1,0.3,0.2,0.5,0.3c0.2,0.1,0.4,0.2,0.5,0.2c0.1,0.1,0.3,0.1,0.4,0.1c0.2,0,0.3,0.1,0.5,0.1h-0.1c0.8,0.1,1.6-0.1,2.4-0.5c0.7-0.4,1.3-1,1.7-1.7c0.2-0.3,0.3-0.6,0.3-0.9c0.1-0.3,0.1-0.7,0.1-1c0-0.3,0-0.7-0.1-1c-0.1-0.3-0.2-0.6-0.3-0.9c-0.3-0.5-0.6-0.9-1-1.3C13,4.4,12.5,4.2,12,4c-0.4-0.1-0.9-0.2-1.4-0.2c-0.5,0-1,0.1-1.4,0.2C8.5,4.3,7.9,4.7,7.5,5.3z M11.3,5.7v1.6h1.6v0.5v0.1v0.6h0h-0.1h-1.4v1.6h-0.4h-0.2h-0.6v0V8.5H8.5V7.3h1.6V5.7H11.3z"/></g></svg>',
                delete_row: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 13.83"><g><path d="M4.7,18.46l.12.08H19.73l.12-.08a.58.58,0,0,0,.22-.22l.08-.12,0-7.69-.08-.11a.77.77,0,0,0-.18-.18l-.11-.08-2.31,0-.08.28-.1.29a1.58,1.58,0,0,1-.12.29l-.14.34s0,0,.18,0H18.9v6H5.64v-6H7.35c.14,0,.2,0,.18,0l-.14-.34a2.85,2.85,0,0,1-.12-.29l-.1-.29-.07-.27-2.31,0-.11.08a.77.77,0,0,0-.18.18l-.08.11,0,7.69.08.12a.47.47,0,0,0,.09.12l.13.09ZM12.11,13a4,4,0,0,0,1.46-.21,4.51,4.51,0,0,0,1.31-.71A4,4,0,0,0,16.26,10a4.32,4.32,0,0,0-.08-2.54,4.34,4.34,0,0,0-1-1.52,4.15,4.15,0,0,0-1.54-1,4.34,4.34,0,0,0-1.35-.22A4.07,4.07,0,0,0,11,4.93,3.94,3.94,0,0,0,9.24,6.07,3.92,3.92,0,0,0,8.15,8.88a3.91,3.91,0,0,0,.12.95A4.16,4.16,0,0,0,12.11,13Zm2.35-4.14v.58H10.09V8.27h4.37v.58Z" transform="translate(-4.4 -4.71)"/></g></svg>',
                delete_column: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.81 15.74"><g><path d="M5.66,19.42l.12.08,7.69,0,.11-.08a.77.77,0,0,0,.18-.18l.08-.11,0-2.32-.15,0-.45-.15-.42-.18-.17-.07a1,1,0,0,0,0,.27v1.63h-6V5h6V6.62a.9.9,0,0,0,0,.26l.17-.07.42-.17a3.91,3.91,0,0,1,.45-.15l.15,0,0-2.32L13.75,4a.77.77,0,0,0-.18-.18l-.11-.08H5.79l-.13.07a.63.63,0,0,0-.21.22l-.08.12V19.08l.08.12a.47.47,0,0,0,.09.12.35.35,0,0,0,.12.1Zm9-3.67a4.16,4.16,0,0,0,2.36-.51,4.08,4.08,0,0,0,1.67-1.72,4,4,0,0,0,.35-.91,3.79,3.79,0,0,0,.1-1,4.71,4.71,0,0,0-.11-1,5,5,0,0,0-.3-.87,4.25,4.25,0,0,0-1-1.25,4.49,4.49,0,0,0-1.34-.81A4.26,4.26,0,0,0,15,7.48a3.88,3.88,0,0,0-1.41.25A4.32,4.32,0,0,0,11.86,9,4,4,0,0,0,11,10.94a4.4,4.4,0,0,0-.05.68,4.5,4.5,0,0,0,.05.68,3.93,3.93,0,0,0,.61,1.57,4.22,4.22,0,0,0,1.18,1.2,4.59,4.59,0,0,0,.48.27c.2.1.37.17.5.22a2.44,2.44,0,0,0,.45.12,4.61,4.61,0,0,0,.5.07Zm2.54-4.12v.58H12.87V11h4.37v.59Z" transform="translate(-5.37 -3.76)"/></g></svg>',
                fixed_column_width: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6,5H18A1,1 0 0,1 19,6A1,1 0 0,1 18,7H6A1,1 0 0,1 5,6A1,1 0 0,1 6,5M21,2V4H3V2H21M15,8H17V22H15V8M7,8H9V22H7V8M11,8H13V22H11V8Z" /></svg>',
                rotate_left: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M0.5,10.2c0,0.1,0,0.2,0,0.3v0.2l0,0c0.1,0.3,0.3,0.6,0.4,0.9l0,0C1,11.8,1.3,12,1.5,11.9h0.1h0.2h0.1c0.1-0.1,0.3-0.3,0.4-0.5v-0.2c0-0.1,0-0.2-0.1-0.3l0,0c-0.2-0.2-0.3-0.4-0.3-0.7l0,0C1.8,10,1.7,9.9,1.5,9.8c-0.1,0-0.2,0-0.3,0H0.9C0.7,9.9,0.6,10,0.5,10.2L0.5,10.2z"/><path d="M2.2,11.5L2.2,11.5L2.2,11.5z"/><path d="M5.9,3.6L5.9,3.6L5.9,3.6z"/><path d="M0.1,7.9c0,0.3,0,0.6,0,0.9l0,0l0,0l0,0l0,0c0,0.2,0.1,0.3,0.2,0.4l0,0c0.2,0.1,0.3,0.2,0.5,0.2l0,0l0,0c0.2,0,0.4-0.1,0.5-0.3l0,0c0-0.1,0.1-0.3,0.1-0.4V8.6l0,0c0-0.2,0-0.5,0-0.7l0,0c0-0.2-0.1-0.4-0.2-0.5C1.1,7.3,0.9,7.2,0.7,7.2S0.3,7.3,0.2,7.4C0.1,7.5,0,7.7,0.1,7.9z"/><path d="M1.9,12.7L1.9,12.7c0,0.2,0,0.4,0.2,0.5l0,0l0.2,0.3l0,0c0.2,0.1,0.3,0.2,0.5,0.4l0,0l0,0l0,0l0,0C2.9,14,3,14.1,3.2,14.1s0.4-0.1,0.5-0.2c0.1-0.2,0.2-0.3,0.2-0.5v-0.1c0-0.2-0.1-0.4-0.2-0.5l0,0l-0.4-0.4l-0.2-0.2l0,0C3,12.1,2.8,12,2.6,12l0,0c-0.2,0-0.4,0.1-0.5,0.2l0,0C2,12.3,1.9,12.5,1.9,12.7z"/><path d="M6.6,15c0,0.2,0.1,0.4,0.2,0.5c0.1,0.1,0.2,0.2,0.4,0.3l0,0c0.3,0,0.5,0,0.7,0h0.3l0,0c0.2,0,0.4-0.1,0.5-0.2c0.1-0.2,0.2-0.3,0.2-0.5l0,0l0,0c0-0.2-0.1-0.4-0.2-0.5l0,0c-0.1-0.1-0.3-0.2-0.5-0.2l0,0H7.9c-0.1,0-0.3,0-0.5,0l0,0H7.3c-0.2-0.1-0.3,0-0.5,0.1l0,0C6.7,14.6,6.6,14.8,6.6,15L6.6,15L6.6,15L6.6,15z"/><path d="M4.2,7.4C4,7.5,4,7.7,4,7.9c0,0.2,0,0.4,0.2,0.5l0,0l3.2,3.2l0,0c0.1,0.1,0.3,0.2,0.5,0.2s0.3-0.1,0.5-0.2l0,0l3.2-3.2l0,0c0.1-0.1,0.2-0.3,0.2-0.5c0-0.2-0.1-0.4-0.2-0.5l0,0C11.5,7.3,11,6.7,10,5.8l0,0L8.4,4.2l0,0C8.3,4.1,8.1,4,7.9,4S7.5,4.1,7.4,4.2L4.2,7.4L4.2,7.4z M6.8,9L5.7,7.9l2.2-2.2l2.3,2.2l-2.3,2.2C7.7,9.9,7.3,9.5,6.8,9L6.8,9z"/><path d="M4.1,14.1C4,14.2,4,14.3,4,14.4v0.2l0,0c0.1,0.1,0.2,0.3,0.4,0.4l0,0c0.3,0.1,0.6,0.2,0.9,0.4h0.1h0.1l0,0c0.2,0,0.3-0.1,0.5-0.1l0,0c0.2-0.1,0.3-0.3,0.3-0.4l0,0l0,0l0,0l0,0v-0.2c0-0.1-0.1-0.2-0.1-0.3l0,0C6.1,14.2,6,14.1,5.8,14l0,0c-0.3-0.1-0.5-0.2-0.8-0.2l0,0c-0.1-0.1-0.2-0.1-0.3-0.1H4.5C4.3,13.7,4.2,13.9,4.1,14.1z"/><path d="M9.3,14.4c0,0.1-0.1,0.3,0,0.4V15l0,0c0,0.1,0.1,0.3,0.5,0.4c0.1,0.1,0.3,0.1,0.4,0.1l0,0h0.1l0,0c0.3-0.1,0.6-0.2,0.9-0.3l0,0c0.1-0.1,0.2-0.2,0.3-0.4l0.1-0.3c0-0.1-0.1-0.2-0.1-0.3l0,0c-0.1-0.2-0.2-0.3-0.4-0.4l0,0h-0.3c-0.1,0-0.2,0-0.3,0l0,0c-0.2,0.1-0.5,0.2-0.8,0.3l0,0C9.5,14.1,9.4,14.2,9.3,14.4L9.3,14.4z"/><path d="M11.4,14.7L11.4,14.7L11.4,14.7z"/><path d="M9.5,15.3L9.5,15.3L9.5,15.3z"/><path d="M15.9,7.9c0-1-0.2-2-0.6-3l0,0c-0.4-1-1-1.9-1.7-2.6C12.8,1.6,12,1,11,0.6l0,0C10.1,0.2,9,0,8,0C7.3,0,6.5,0.1,5.8,0.3l0,0C5.2,0.5,4.6,0.8,4,1.1L3.1,0.2l0,0C2.9,0.1,2.8,0,2.6,0H2.4l0,0C2.2,0,2,0.2,1.9,0.4l0,0L0.1,4.9l0,0C0,5,0,5.1,0,5.2c0,0.2,0.1,0.4,0.2,0.5l0,0c0.2,0.1,0.3,0.2,0.5,0.2h0.1H1l0,0l4.7-1.8l0,0C5.9,4,6.1,3.8,6.1,3.6V3.4C6.1,3.2,6,3,5.9,2.9l0,0L5.1,2.1c0.4-0.2,0.8-0.4,1.3-0.5c0.5-0.1,1.1-0.2,1.7-0.2c0.9,0,1.7,0.2,2.5,0.5l0,0c0.8,0.3,1.5,0.8,2.1,1.4c0.6,0.6,1.1,1.3,1.4,2.1l0,0c0.3,0.8,0.5,1.6,0.5,2.5s-0.2,1.7-0.5,2.5l0,0c-0.3,0.8-0.8,1.5-1.4,2.1c-0.2,0.2-0.4,0.3-0.6,0.5l0,0c-0.2,0.1-0.3,0.3-0.3,0.5v0.1c0,0.1,0,0.3,0.1,0.4l0,0c0.1,0.2,0.3,0.3,0.5,0.3l0,0c0.1,0,0.3-0.1,0.4-0.2l0,0l0,0l0,0l0,0c0.2-0.2,0.5-0.4,0.7-0.6l0,0l0,0l0,0l0,0c0.7-0.8,1.3-1.6,1.7-2.6C15.6,10,15.8,9,15.9,7.9z M1.9,4C2,3.8,2.1,3.5,2.3,3.1l0,0L2.7,2l1.2,1.2L1.9,4z"/><path d="M6.8,15.5L6.8,15.5L6.8,15.5z"/></g></svg>',
                rotate_right: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.8 15.8"><g><path d="M9.9,15.3L9.9,15.3L9.9,15.3z"/><path d="M6.9,15.1L6.9,15.1c0,0.1,0.1,0.3,0.2,0.4l0,0c0.1,0.2,0.3,0.3,0.5,0.3l0,0h0.3c0.2,0,0.4,0,0.7,0l0,0c0.2-0.1,0.3-0.2,0.4-0.3c0.1-0.1,0.2-0.2,0.2-0.4V15c0-0.2-0.1-0.4-0.2-0.4c-0.2-0.1-0.3-0.2-0.5-0.2H8.4l0,0c-0.1,0-0.3,0-0.5,0H7.6l0,0c-0.2,0-0.4,0.1-0.5,0.2C7,14.7,6.9,14.9,6.9,15.1z"/><path d="M6.5,14.4L6.5,14.4L6.5,14.4z"/><path d="M5.8,5.8L5.8,5.8c-1,0.9-1.5,1.5-1.7,1.6l0,0C4,7.5,4,7.7,4,7.9c0,0.2,0,0.4,0.2,0.5l0,0l3.2,3.2l0,0c0.2,0.1,0.3,0.2,0.5,0.2s0.4-0.1,0.5-0.2l0,0l3.2-3.2l0,0c0.1-0.1,0.2-0.3,0.2-0.5c0-0.2-0.1-0.4-0.2-0.5l0,0L8.4,4.2C8.3,4.1,8.1,4,7.9,4C7.7,4,7.5,4.1,7.4,4.2l0,0L5.8,5.8z M5.6,7.9l2.3-2.2l2.2,2.2L9,9l0,0l0,0l0,0l0,0c-0.5,0.6-0.9,0.9-1.1,1.1L5.6,7.9z"/><path d="M9,15.5L9,15.5L9,15.5z"/><path d="M9.6,14.7v0.2l0,0l0,0l0,0l0,0c0.1,0.2,0.1,0.3,0.3,0.3c0.1,0.1,0.3,0.1,0.4,0.1l0,0h0.1h0.1c0.3-0.1,0.6-0.3,0.9-0.4l0,0c0.1-0.1,0.2-0.2,0.3-0.4l0,0v-0.2c0-0.1,0-0.2-0.1-0.3c-0.1-0.2-0.2-0.3-0.4-0.4H11c-0.1,0-0.2,0.1-0.3,0.1l0,0c-0.2,0.1-0.4,0.2-0.7,0.3l0,0l0,0c-0.1,0.1-0.3,0.2-0.4,0.4C9.6,14.5,9.6,14.6,9.6,14.7z"/><path d="M9,14.5L9,14.5L9,14.5z"/><path d="M9.6,14.4L9.6,14.4L9.6,14.4z"/><path d="M11.7,14L11.7,14L11.7,14z"/><path d="M15.6,7.4L15.6,7.4L15.6,7.4z"/><path d="M15,9.4c0.2,0,0.4,0,0.6-0.2l0,0c0.1-0.1,0.2-0.2,0.2-0.4l0,0l0,0l0,0l0,0c0-0.3,0-0.6,0-0.9c0-0.2-0.1-0.4-0.2-0.5c-0.1-0.1-0.3-0.2-0.5-0.2s-0.4,0.1-0.5,0.2c-0.1,0.1-0.2,0.3-0.2,0.5l0,0c0,0.2,0,0.4,0,0.7l0,0v0.1c0,0.1,0,0.3,0.1,0.4l0,0C14.6,9.3,14.8,9.4,15,9.4L15,9.4L15,9.4z"/><path d="M14,12h0.1h0.2h0.1c0.2,0,0.5-0.2,0.6-0.4l0,0c0.2-0.3,0.3-0.6,0.4-0.9l0,0v-0.2c0-0.1-0.1-0.2-0.1-0.3c-0.1-0.2-0.2-0.3-0.4-0.4h-0.3c-0.1,0-0.2,0-0.3,0C14.2,9.9,14,10,14,10.3l0,0c-0.1,0.2-0.2,0.5-0.3,0.7l0,0c-0.1,0.1-0.1,0.2-0.1,0.3v0.2l0,0l0,0C13.6,11.6,13.8,11.8,14,12z"/><path d="M14.6,7.4L14.6,7.4L14.6,7.4z"/><path d="M4.4,14.2c-0.1,0.1-0.1,0.2-0.1,0.3l0.1,0.2c0,0.2,0.2,0.3,0.3,0.4l0,0c0.3,0.1,0.6,0.3,1.1,0.4l0,0h0.1l0,0c0.1,0,0.2-0.1,0.4-0.2c0.1,0,0.2-0.2,0.3-0.3l0,0v-0.2c0-0.1-0.1-0.3-0.2-0.4c-0.1-0.1-0.2-0.2-0.4-0.3l0,0c-0.2-0.1-0.5-0.2-0.7-0.3l0,0c-0.1,0-0.2,0-0.3,0H4.7l0,0C4.6,13.9,4.4,14,4.4,14.2L4.4,14.2z"/><path d="M11.9,13.3c0,0.2,0.1,0.4,0.2,0.6c0.1,0.1,0.3,0.2,0.5,0.2s0.4-0.1,0.5-0.2l0,0l0,0l0,0l0,0c0.1-0.1,0.3-0.3,0.4-0.4l0,0l0.2-0.3l0,0c0.1-0.2,0.2-0.3,0.2-0.5l0,0c0-0.2-0.1-0.4-0.2-0.5l0,0c-0.1-0.1-0.3-0.2-0.5-0.2l0,0c-0.2,0-0.4,0.1-0.5,0.2l0,0l-0.2,0.2l-0.4,0.4l0,0C12,13,11.9,13.1,11.9,13.3L11.9,13.3z"/><path d="M12.1,13.8L12.1,13.8L12.1,13.8z"/><path d="M11.9,13.3L11.9,13.3L11.9,13.3z"/><path d="M15.9,5.2c0-0.1-0.1-0.2-0.1-0.3l0,0L14,0.4l0,0C13.9,0.2,13.7,0,13.5,0l0,0l0,0h-0.2c-0.2,0-0.4,0.1-0.5,0.2l0,0l-0.9,0.9c-0.5-0.3-1.1-0.6-1.8-0.8l0,0C9.4,0.1,8.7,0,7.9,0c-1,0-2,0.2-3,0.6S3,1.6,2.3,2.3C1.6,3.1,1,3.9,0.6,4.9l0,0C0.2,5.8,0,6.8,0,7.9c0,1,0.2,2,0.6,3s0.9,1.8,1.7,2.6l0,0l0,0l0,0l0,0c0.2,0.2,0.5,0.4,0.7,0.6l0,0l0,0l0,0l0,0c0.2,0.1,0.3,0.2,0.5,0.2l0,0c0.2,0,0.4-0.1,0.6-0.3l0,0c0.1-0.1,0.1-0.3,0.1-0.4v-0.1l0,0C4.1,13.3,4,13.1,3.9,13l0,0c-0.2-0.1-0.4-0.3-0.6-0.5c-0.6-0.6-1.1-1.3-1.4-2.1l0,0C1.6,9.6,1.4,8.8,1.4,7.9s0.2-1.7,0.5-2.5l0,0c0.3-0.8,0.8-1.5,1.4-2.1c0.6-0.6,1.3-1.1,2.1-1.4l0,0C6.2,1.6,7,1.4,7.9,1.4c0.6,0,1.1,0.1,1.7,0.2c0.5,0.1,0.9,0.3,1.3,0.5l-0.8,0.8l0,0C10,3.1,9.9,3.2,9.9,3.4v0.2l0,0l0,0c0,0.2,0.2,0.4,0.4,0.5l0,0l4.5,1.8l0,0H15h0.1c0.2,0,0.4-0.1,0.5-0.2l0,0C15.7,5.6,15.8,5.4,15.9,5.2z M11.8,3.2L13,2l0.4,1.1l0,0c0.2,0.4,0.3,0.7,0.4,0.9L11.8,3.2z"/></g></svg>',
                mirror_horizontal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.75 15.74"><g><path d="M13.75,3.76l5.9,15.74h-5.9V3.76ZM4.9,19.5,10.8,3.76V19.5H4.9Z" transform="translate(-4.9 -3.76)"/></g></svg>',
                mirror_vertical: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.74 14.75"><g><path d="M20.15,13.1,4.41,19V13.1H20.15ZM4.41,4.25l15.74,5.9H4.41V4.25Z" transform="translate(-4.41 -4.25)"/></g></svg>',
                checked: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.75 12.1"><g><path d="M4.59,12.23l.12.18L9.43,17.5a.58.58,0,0,0,.84,0L20,7.45h0a.58.58,0,0,0,0-.84l-.85-.85a.58.58,0,0,0-.84,0H18.2l-8.12,8.41a.29.29,0,0,1-.42,0l-3.4-3.63a.58.58,0,0,0-.84,0l-.85.85a.6.6,0,0,0-.14.21.51.51,0,0,0,0,.44c.05.06.1.13.16.19Z" transform="translate(-4.38 -5.58)"/></g></svg>',
                line_break: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 21L14.9 3H17L9.1 21H7Z" /></svg>',
                attachment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.38 15.68"><g><path d="M15.23,6h1v9.78a3.88,3.88,0,0,1-1.31,2.45,4,4,0,0,1-6.57-2.45V7A3,3,0,0,1,9.2,4.89a3,3,0,0,1,5,2.09v8.31a1.92,1.92,0,0,1-.58,1.39,2,2,0,0,1-1.39.58,1.92,1.92,0,0,1-1.39-.58,2,2,0,0,1-.58-1.39V8h1v7.32a1,1,0,0,0,.29.69,1,1,0,0,0,.69.28A.9.9,0,0,0,13,16a1,1,0,0,0,.29-.69V7a1.92,1.92,0,0,0-.58-1.39A2,2,0,0,0,11.27,5a1.92,1.92,0,0,0-1.39.58A2,2,0,0,0,9.33,7v8.31a3,3,0,1,0,5.9,0V6Z" transform="translate(-8.08 -3.78)"/></g></svg>',
                map: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.7 15.62"><g><path d="M12.05,12.42a2.93,2.93,0,1,1,2.07-5A2.88,2.88,0,0,1,15,9.49a3,3,0,0,1-.86,2.07,2.89,2.89,0,0,1-2.07.86Zm0-5.36a2.43,2.43,0,0,0-1.72,4.16,2.48,2.48,0,0,0,1.72.72,2.44,2.44,0,0,0,0-4.88Zm0-3.3A5.84,5.84,0,0,1,17.9,9.62a9.94,9.94,0,0,1-1.73,5A33.59,33.59,0,0,1,12.84,19a1.52,1.52,0,0,1-.23.2,1,1,0,0,1-.55.2h0a1,1,0,0,1-.55-.2,1.52,1.52,0,0,1-.23-.2,33.59,33.59,0,0,1-3.33-4.32,9.93,9.93,0,0,1-1.72-5,5.84,5.84,0,0,1,5.85-5.86ZM12,18.34l.08.05.06-.06a35.58,35.58,0,0,0,3.06-3.93,9.35,9.35,0,0,0,1.74-4.77,4.88,4.88,0,0,0-4.88-4.88A4.79,4.79,0,0,0,8.6,6.17,4.84,4.84,0,0,0,7.17,9.62,9.29,9.29,0,0,0,8.91,14.4,36,36,0,0,0,12,18.34Z" transform="translate(-6.2 -3.76)"/></g></svg>',
                magic_stick: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.73 15.75"><g><path d="M19.86,19.21a1,1,0,0,0,.28-.68,1,1,0,0,0-.28-.7L13,10.93a1,1,0,0,0-.7-.28,1,1,0,0,0-.68,1.65l6.9,6.9a1,1,0,0,0,.69.29.93.93,0,0,0,.69-.28ZM9.19,8.55a3,3,0,0,0,1.68,0,14.12,14.12,0,0,0,1.41-.32A11.26,11.26,0,0,0,10.8,7.06c-.56-.36-.86-.56-.91-.58S10,5.91,10,5.11s0-1.26-.15-1.37a4.35,4.35,0,0,0-1.19.71c-.53.4-.81.62-.87.68a9,9,0,0,0-2-.6,6.84,6.84,0,0,0-.76-.09s0,.27.08.77a8.6,8.6,0,0,0,.61,2q-.09.09-.69.87a3.59,3.59,0,0,0-.68,1.17c.12.17.57.23,1.36.15S7,9.26,7.15,9.23s.21.36.57.91a10.49,10.49,0,0,0,1.14,1.48c0-.1.14-.57.31-1.4a3,3,0,0,0,0-1.67Z" transform="translate(-4.41 -3.74)"/></g></svg>',
                empty_file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12.78 15.75"><g><path d="M14.73,3.76,18.67,7.7v9.84a2,2,0,0,1-2,2H7.84a1.89,1.89,0,0,1-1.38-.58,2,2,0,0,1-.57-1.39V5.73a1.93,1.93,0,0,1,.57-1.38,2,2,0,0,1,1.38-.58h6.62l.26,0v0Zm2.95,4.92h-2a1.93,1.93,0,0,1-1.38-.57,2,2,0,0,1-.58-1.4V6.17c0-.36,0-.84,0-1.43H7.85a1,1,0,0,0-.7.29,1,1,0,0,0-.29.7V17.54a1,1,0,0,0,.29.69,1,1,0,0,0,.69.29h8.85a1,1,0,0,0,.71-.29.92.92,0,0,0,.28-.69Zm0-1L14.73,4.74v2A1,1,0,0,0,15,7.4a1,1,0,0,0,.69.29Z" transform="translate(-5.89 -3.76)"/></g></svg>',
                more_horizontal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.76 3.58"><g><path d="M4.64,10.73a1.84,1.84,0,0,1,.65-.65,1.76,1.76,0,0,1,1.79,0A1.79,1.79,0,0,1,8,11.63a1.84,1.84,0,0,1-.25.9,1.69,1.69,0,0,1-.65.65,1.8,1.8,0,0,1-2.69-1.55A2.08,2.08,0,0,1,4.64,10.73Zm6.09,0a1.84,1.84,0,0,1,.65-.65,1.78,1.78,0,0,1,2.67,1.55,1.73,1.73,0,0,1-.24.9,1.84,1.84,0,0,1-.65.65,1.76,1.76,0,0,1-1.79,0,1.79,1.79,0,0,1-.64-2.44Zm6.08,0a1.69,1.69,0,0,1,.65-.65,1.76,1.76,0,0,1,1.79,0,1.79,1.79,0,0,1,.9,1.54,1.73,1.73,0,0,1-.24.9,1.84,1.84,0,0,1-.65.65,1.8,1.8,0,0,1-2.69-1.55A2,2,0,0,1,16.81,10.73Z" transform="translate(-4.39 -9.84)"/></g></svg>',
                more_vertical: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3.94 15.75"><g><path d="M12.28,7.69a1.92,1.92,0,0,1-1.39-.58,2,2,0,0,1-.58-1.39,1.92,1.92,0,0,1,.58-1.39,2,2,0,0,1,1.39-.58,1.92,1.92,0,0,1,1.39.58,2,2,0,0,1,.58,1.39,1.92,1.92,0,0,1-.58,1.39,2,2,0,0,1-1.39.58Zm0,2a1.92,1.92,0,0,1,1.39.58,2,2,0,0,1,.58,1.39A1.92,1.92,0,0,1,13.67,13a2,2,0,0,1-1.39.58A1.92,1.92,0,0,1,10.89,13a2,2,0,0,1-.58-1.39,2,2,0,0,1,2-2Zm0,5.9a1.92,1.92,0,0,1,1.39.58,2,2,0,0,1,.58,1.39,1.92,1.92,0,0,1-.58,1.39,2,2,0,0,1-1.39.58,1.92,1.92,0,0,1-1.39-.58,2,2,0,0,1-.58-1.39,1.92,1.92,0,0,1,.58-1.39,1.94,1.94,0,0,1,1.39-.58Z" transform="translate(-10.31 -3.75)"/></g></svg>'
            },
            p = n("P6u4"),
            m = n.n(p);
        const f = {
            _d: document,
            _w: window,
            isIE: null !== window.navigator.userAgent.match(/(MSIE|Trident.*rv[ :])([0-9]+)/),
            isIE_Edge: null !== window.navigator.userAgent.match(/(MSIE|Trident.*rv[ :])([0-9]+)/) || window.navigator.appVersion.indexOf("Edge") > -1,
            _tagConvertor: function(e) {
                const t = {
                    b: "strong",
                    i: "em",
                    ins: "u",
                    strike: "del",
                    s: "del"
                };
                return e.replace(/(<\/?)(b|strong|i|em|ins|u|s|strike|del)\b\s*(?:[^>^<]+)?\s*(?=>)/gi, (function(e, n, i) {
                    return n + ("string" == typeof t[i] ? t[i] : i)
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
            // zeroWidthSpace: "​",
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
                let n = "";
                const i = [],
                    l = "js" === t ? "script" : "link",
                    s = "js" === t ? "src" : "href";
                let o = "(?:";
                for (let t = 0, n = e.length; t < n; t++) o += e[t] + (t < n - 1 ? "|" : ")");
                const a = new this._w.RegExp("(^|.*[\\/])" + o + "(\\.[^\\/]+)?." + t + "(?:\\?.*|;.*)?$", "i"),
                    r = new this._w.RegExp(".+\\." + t + "(?:\\?.*|;.*)?$", "i");
                for (let e = this._d.getElementsByTagName(l), t = 0; t < e.length; t++) r.test(e[t][s]) && i.push(e[t]);
                for (let e = 0; e < i.length; e++) {
                    let t = i[e][s].match(a);
                    if (t) {
                        n = t[0];
                        break
                    }
                }
                if ("" === n && (n = i.length > 0 ? i[0][s] : ""), -1 === n.indexOf(":/") && "//" !== n.slice(0, 2) && (n = 0 === n.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] + n : location.href.match(/^[^\?]*\/(?:)/)[0] + n), !n) throw "[SUNEDITOR.util.getIncludePath.fail] The SUNEDITOR installation path could not be automatically detected. (name: +" + name + ", extension: " + t + ")";
                return n
            },
            getPageStyle: function(e) {
                let t = "";
                const n = (e || this._d).styleSheets;
                for (let e, i = 0, l = n.length; i < l; i++) {
                    try {
                        e = n[i].cssRules
                    } catch (e) {
                        continue
                    }
                    for (let n = 0, i = e.length; n < i; n++) t += e[n].cssText
                }
                return t
            },
            getIframeDocument: function(e) {
                let t = e.contentWindow || e.contentDocument;
                return t.document && (t = t.document), t
            },
            getAttributesToString: function(e, t) {
                if (!e.attributes) return "";
                const n = e.attributes;
                let i = "";
                for (let e = 0, l = n.length; e < l; e++) t && t.indexOf(n[e].name) > -1 || (i += n[e].name + '="' + n[e].value + '" ');
                return i
            },
            getByteLength: function(e) {
                const t = this._w.encodeURIComponent;
                let n, i;
                return this.isIE_Edge ? (i = this._w.unescape(t(e.toString())).length, n = 0, null !== t(e.toString()).match(/(%0A|%0D)/gi) && (n = t(e.toString()).match(/(%0A|%0D)/gi).length), i + n) : (i = new this._w.TextEncoder("utf-8").encode(e.toString()).length, n = 0, null !== t(e.toString()).match(/(%0A|%0D)/gi) && (n = t(e.toString()).match(/(%0A|%0D)/gi).length), i + n)
            },
            isWysiwygDiv: function(e) {
                return !(!e || 1 !== e.nodeType || !this.hasClass(e, "se-wrapper-wysiwyg") && !/^BODY$/i.test(e.nodeName))
            },
            isTextStyleElement: function(e) {
                return e && 3 !== e.nodeType && /^(strong|span|font|b|var|i|em|u|ins|s|strike|del|sub|sup|mark|a|label)$/i.test(e.nodeName)
            },
            isFormatElement: function(e) {
                return e && 1 === e.nodeType && (/^(P|DIV|H[1-6]|PRE|LI|TD|TH)$/i.test(e.nodeName) || this.hasClass(e, "(\\s|^)__se__format__replace_.+(\\s|$)|(\\s|^)__se__format__free_.+(\\s|$)")) && !this.isComponent(e) && !this.isWysiwygDiv(e)
            },
            isRangeFormatElement: function(e) {
                return e && 1 === e.nodeType && (/^(BLOCKQUOTE|OL|UL|FIGCAPTION|TABLE|THEAD|TBODY|TR|TH|TD)$/i.test(e.nodeName) || this.hasClass(e, "(\\s|^)__se__format__range_.+(\\s|$)"))
            },
            isFreeFormatElement: function(e) {
                return e && 1 === e.nodeType && (/^PRE$/i.test(e.nodeName) || this.hasClass(e, "(\\s|^)__se__format__free_.+(\\s|$)")) && !this.isComponent(e) && !this.isWysiwygDiv(e)
            },
            isComponent: function(e) {
                return e && (/se-component/.test(e.className) || /^(TABLE|HR)$/.test(e.nodeName))
            },
            isMediaComponent: function(e) {
                return e && /se-component/.test(e.className)
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
            getFreeFormatElement: function(e, t) {
                if (!e) return null;
                for (t || (t = function() {
                        return !0
                    }); e;) {
                    if (this.isWysiwygDiv(e)) return null;
                    if (this.isFreeFormatElement(e) && t(e)) return e;
                    e = e.parentNode
                }
                return null
            },
            copyTagAttributes: function(e, t) {
                t.style.cssText && (e.style.cssText += t.style.cssText);
                const n = t.classList;
                for (let t = 0, i = n.length; t < i; t++) this.addClass(e, n[t]);
                e.style.cssText || e.removeAttribute("style"), e.className.trim() || e.removeAttribute("class")
            },
            copyFormatAttributes: function(e, t) {
                (t = t.cloneNode(!1)).className = t.className.replace(/(\s|^)__se__format__[^\s]+/g, ""), this.copyTagAttributes(e, t)
            },
            getArrayItem: function(e, t, n) {
                if (!e || 0 === e.length) return null;
                t = t || function() {
                    return !0
                };
                const i = [];
                for (let l, s = 0, o = e.length; s < o; s++)
                    if (l = e[s], t(l)) {
                        if (!n) return l;
                        i.push(l)
                    } return n ? i : null
            },
            getArrayIndex: function(e, t) {
                let n = -1;
                for (let i = 0, l = e.length; i < l; i++)
                    if (e[i] === t) {
                        n = i;
                        break
                    } return n
            },
            nextIdx: function(e, t) {
                let n = this.getArrayIndex(e, t);
                return -1 === n ? -1 : n + 1
            },
            prevIdx: function(e, t) {
                let n = this.getArrayIndex(e, t);
                return -1 === n ? -1 : n - 1
            },
            getPositionIndex: function(e) {
                let t = 0;
                for (; e = e.previousSibling;) t += 1;
                return t
            },
            getNodePath: function(e, t, n) {
                const i = [];
                let l = !0;
                return this.getParentElement(e, function(e) {
                    if (e === t && (l = !1), l && !this.isWysiwygDiv(e)) {
                        if (n && 3 === e.nodeType) {
                            let t = null,
                                i = null;
                            n.s = n.e = 0;
                            let l = e.previousSibling;
                            for (; l && 3 === l.nodeType;) i = l.textContent.replace(this.zeroWidthRegExp, ""), n.s += i.length, e.textContent = i + e.textContent, t = l, l = l.previousSibling, this.removeItem(t);
                            let s = e.nextSibling;
                            for (; s && 3 === s.nodeType;) i = s.textContent.replace(this.zeroWidthRegExp, ""), n.e += i.length, e.textContent += i, t = s, s = s.nextSibling, this.removeItem(t)
                        }
                        i.push(e)
                    }
                    return !1
                }.bind(this)), i.map(this.getPositionIndex).reverse()
            },
            getNodeFromPath: function(e, t) {
                let n, i = t;
                for (let t = 0, l = e.length; t < l && (n = i.childNodes, 0 !== n.length); t++) i = n.length <= e[t] ? n[n.length - 1] : n[e[t]];
                return i
            },
            isSameAttributes: function(e, t) {
                if (3 === e.nodeType && 3 === t.nodeType) return !0;
                if (3 === e.nodeType || 3 === t.nodeType) return !1;
                const n = e.style,
                    i = t.style;
                let l = 0;
                for (let e = 0, t = n.length; e < t; e++) n[n[e]] === i[n[e]] && l++;
                const s = e.classList,
                    o = t.classList,
                    a = this._w.RegExp;
                let r = 0;
                for (let e = 0, t = s.length; e < t; e++) a("(s|^)" + s[e] + "(s|$)").test(o.value) && r++;
                return l === i.length && l === n.length && r === o.length && r === s.length
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
            isMedia: function(e) {
                return e && /^(IMG|IFRAME|AUDIO|VIDEO|CANVAS)$/i.test("string" == typeof e ? e : e.nodeName)
            },
            isNumber: function(e) {
                return !!e && /^-?\d+(\.\d+)?$/.test(e + "")
            },
            getNumber: function(e, t) {
                if (!e) return null;
                let n = (e + "").match(/-?\d+(\.\d+)?/);
                return n && n[0] ? (n = n[0], t < 0 ? 1 * n : 0 === t ? this._w.Math.round(1 * n) : 1 * (1 * n).toFixed(t)) : null
            },
            getListChildren: function(e, t) {
                const n = [];
                return e && e.children && 0 !== e.children.length ? (t = t || function() {
                    return !0
                }, function i(l) {
                    e !== l && t(l) && n.push(l);
                    for (let e = 0, t = l.children.length; e < t; e++) i(l.children[e])
                }(e), n) : n
            },
            getListChildNodes: function(e, t) {
                const n = [];
                return e && 0 !== e.childNodes.length ? (t = t || function() {
                    return !0
                }, function i(l) {
                    e !== l && t(l) && n.push(l);
                    for (let e = 0, t = l.childNodes.length; e < t; e++) i(l.childNodes[e])
                }(e), n) : n
            },
            getElementDepth: function(e) {
                if (!e || this.isWysiwygDiv(e)) return -1;
                let t = 0;
                for (e = e.parentNode; e && !this.isWysiwygDiv(e);) t += 1, e = e.parentNode;
                return t
            },
            getParentElement: function(e, t) {
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
                for (; e && !n(e);) {
                    if (this.isWysiwygDiv(e)) return null;
                    e = e.parentNode
                }
                return e
            },
            getChildElement: function(e, t, n) {
                let i;
                if ("function" == typeof t) i = t;
                else {
                    let e;
                    /^\./.test(t) ? (e = "className", t = t.split(".")[1]) : /^#/.test(t) ? (e = "id", t = "^" + t.split("#")[1] + "$") : /^:/.test(t) ? (e = "name", t = "^" + t.split(":")[1] + "$") : (e = "nodeName", t = "^" + ("text" === t ? "#" + t : t) + "$");
                    const n = new this._w.RegExp(t, "i");
                    i = function(t) {
                        return n.test(t[e])
                    }
                }
                const l = this.getListChildNodes(e, (function(e) {
                    return i(e)
                }));
                return l[n ? l.length - 1 : 0]
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
                let n = 0,
                    i = 0,
                    l = 3 === e.nodeType ? e.parentElement : e;
                const s = this.getParentElement(e, this.isWysiwygDiv.bind(this));
                for (; l && !this.hasClass(l, "se-container") && l !== s;) n += l.offsetLeft, i += l.offsetTop, l = l.offsetParent;
                const o = t && /iframe/i.test(t.nodeName);
                return {
                    left: n + (o ? t.parentElement.offsetLeft : 0),
                    top: i - s.scrollTop + (o ? t.parentElement.offsetTop : 0)
                }
            },
            getOverlapRangeAtIndex: function(e, t, n, i) {
                if (e <= i ? t < n : t > n) return 0;
                const l = (e > n ? e : n) - (t < i ? t : i);
                return (l < 0 ? -1 * l : l) + 1
            },
            changeTxt: function(e, t) {
                e && t && (e.textContent = t)
            },
            changeElement: function(e, t) {
                if ("string" == typeof t)
                    if (e.outerHTML) e.outerHTML = t;
                    else {
                        const n = this.createElement("DIV");
                        n.innerHTML = t, t = n.firstChild, e.parentNode.replaceChild(t, e)
                    }
                else 1 === t.nodeType && e.parentNode.replaceChild(t, e)
            },
            setStyle: function(e, t, n) {
                e.style[t] = n, n || e.style.cssText || e.removeAttribute("style")
            },
            hasClass: function(e, t) {
                if (e) return new this._w.RegExp(t).test(e.className)
            },
            addClass: function(e, t) {
                if (!e) return;
                new this._w.RegExp("(\\s|^)" + t + "(\\s|$)").test(e.className) || (e.className += (e.className.length > 0 ? " " : "") + t)
            },
            removeClass: function(e, t) {
                if (!e) return;
                const n = new this._w.RegExp("(\\s|^)" + t + "(\\s|$)");
                e.className = e.className.replace(n, " ").trim(), e.className.trim() || e.removeAttribute("class")
            },
            toggleClass: function(e, t) {
                if (!e) return;
                const n = new this._w.RegExp("(\\s|^)" + t + "(\\s|$)");
                n.test(e.className) ? e.className = e.className.replace(n, " ").trim() : e.className += " " + t, e.className.trim() || e.removeAttribute("class")
            },
            toggleDisabledButtons: function(e, t) {
                for (let n = 0, i = t.length; n < i; n++) t[n].disabled = e
            },
            removeItem: function(e) {
                if (e) try {
                    e.remove()
                } catch (t) {
                    e.parentNode.removeChild(e)
                }
            },
            removeItemAllParents: function(e, t, n) {
                if (!e) return null;
                let i = null;
                return t || (t = function(e) {
                        if (e === n || this.isComponent(e)) return !1;
                        const t = e.textContent.trim();
                        return 0 === t.length || /^(\n|\u200B)+$/.test(t)
                    }.bind(this)),
                    function e(n) {
                        if (!f.isWysiwygDiv(n)) {
                            const l = n.parentNode;
                            l && t(n) && (i = {
                                sc: n.previousElementSibling,
                                ec: n.nextElementSibling
                            }, f.removeItem(n), e(l))
                        }
                    }(e), i
            },
            detachNestedList: function(e, t) {
                const n = this._deleteNestedList(e);
                let i, l, s;
                if (n) {
                    i = n.cloneNode(!1), l = n.childNodes;
                    const t = this.getPositionIndex(e);
                    for (; l[t];) i.appendChild(l[t])
                } else i = e;
                if (t) s = this.getListChildren(i, function(e) {
                    return this.isListCell(e) && !e.previousElementSibling
                }.bind(this));
                else {
                    const t = this.getElementDepth(e) + 2;
                    s = this.getListChildren(e, function(e) {
                        return this.isListCell(e) && !e.previousElementSibling && this.getElementDepth(e) === t
                    }.bind(this))
                }
                for (let e = 0, t = s.length; e < t; e++) this._deleteNestedList(s[e]);
                return n && (n.parentNode.insertBefore(i, n.nextSibling), l && 0 === l.length && this.removeItem(n)), i === e ? i.parentNode : i
            },
            _deleteNestedList: function(e) {
                const t = e.parentNode;
                let n, i, l, s, o, a = t,
                    r = a.parentNode;
                for (; this.isListCell(r);) {
                    for (s = this.getPositionIndex(e), n = r.nextElementSibling, i = r.parentNode, l = a; l;) {
                        if (a = a.nextSibling, this.isList(l)) {
                            for (o = l.childNodes; o[s];) i.insertBefore(o[s], n);
                            0 === o.length && this.removeItem(l)
                        } else i.appendChild(l);
                        l = a
                    }
                    a = i, r = i.parentNode
                }
                return 0 === t.children.length && this.removeItem(t), i
            },
            splitElement: function(e, t, n) {
                const i = e.parentNode;
                let l, s, o, a = 0,
                    r = !0;
                if ((!n || n < 0) && (n = 0), 3 === e.nodeType) {
                    if (a = this.getPositionIndex(e), t >= 0) {
                        e.splitText(t);
                        const n = this.getNodeFromPath([a + 1], i);
                        this.onlyZeroWidthSpace(n) && (n.data = this.zeroWidthSpace)
                    }
                } else 1 === e.nodeType && (e.previousSibling ? e = e.previousSibling : this.getElementDepth(e) === n && (r = !1));
                let c = e;
                for (; this.getElementDepth(c) > n;)
                    for (a = this.getPositionIndex(c) + 1, c = c.parentNode, o = l, l = c.cloneNode(!1), s = c.childNodes, o && (this.isListCell(l) && this.isList(o) && o.firstElementChild && (l.innerHTML = o.firstElementChild.innerHTML, f.removeItem(o.firstElementChild), o.children.length > 0 && l.appendChild(o)), l.appendChild(o)); s[a];) l.appendChild(s[a]);
                c.childNodes.length <= 1 && (!c.firstChild || 0 === c.firstChild.textContent.length) && (c.innerHTML = "<br>");
                const d = c.parentNode;
                return r && (c = c.nextSibling), l ? (this.mergeSameTags(l, null, !1), this.mergeNestedTags(l, function(e) {
                    return this.isList(e)
                }.bind(this)), l.childNodes.length > 0 ? d.insertBefore(l, c) : l = c, 0 === i.childNodes.length && this.removeItem(i), l) : c
            },
            mergeSameTags: function(e, t, n) {
                const i = this;
                let l = null;
                return t && t.length > 0 && (l = this._w.Array.apply(null, new this._w.Array(t.length)).map(this._w.Number.prototype.valueOf, 0)),
                    function e(s, o, a) {
                        const r = s.childNodes;
                        for (let c, d, u = 0, h = r.length; u < h && (c = r[u], d = r[u + 1], c); u++)
                            if (n && i._isIgnoreNodeChange(c) || !n && (i.isTable(c) || i.isListCell(c) || i.isFormatElement(c) && !i.isFreeFormatElement(c)))(i.isTable(c) || i.isListCell(c)) && e(c, o + 1, u);
                            else {
                                if (1 === h && s.nodeName === c.nodeName && s.parentNode) {
                                    if (t) {
                                        let e, n, l, a, r;
                                        for (let d in t)
                                            if (e = t[d], e && e[o] === u) {
                                                for (n = c, l = s, a = o, r = !0; a >= 0;) {
                                                    if (i.getArrayIndex(l.childNodes, n) !== e[a]) {
                                                        r = !1;
                                                        break
                                                    }
                                                    n = c.parentNode, l = n.parentNode, a--
                                                }
                                                r && (e.splice(o, 1), e[o] = u)
                                            }
                                    }
                                    i.copyTagAttributes(c, s), s.parentNode.insertBefore(c, s), i.removeItem(s)
                                }
                                if (!d) {
                                    1 === c.nodeType && e(c, o + 1, u);
                                    break
                                }
                                if (c.nodeName === d.nodeName && i.isSameAttributes(c, d) && c.href === d.href) {
                                    const e = c.childNodes;
                                    let n = 0;
                                    for (let t = 0, i = e.length; t < i; t++) e[t].textContent.length > 0 && n++;
                                    const s = c.lastChild,
                                        r = d.firstChild;
                                    let h = 0;
                                    if (s && r) {
                                        const e = 3 === s.nodeType && 3 === r.nodeType;
                                        h = s.textContent.length;
                                        let i = s.previousSibling;
                                        for (; i && 3 === i.nodeType;) h += i.textContent.length, i = i.previousSibling;
                                        if (n > 0 && 3 === s.nodeType && 3 === r.nodeType && (s.textContent.length > 0 || r.textContent.length > 0) && n--, t) {
                                            let i = null;
                                            for (let c in t)
                                                if (i = t[c], i && i[o] > u) {
                                                    if (o > 0 && i[o - 1] !== a) continue;
                                                    i[o] -= 1, i[o + 1] >= 0 && i[o] === u && (i[o + 1] += n, e && s && 3 === s.nodeType && r && 3 === r.nodeType && (l[c] += h))
                                                }
                                        }
                                    }
                                    if (3 === c.nodeType) {
                                        if (h = c.textContent.length, c.textContent += d.textContent, t) {
                                            let e = null;
                                            for (let i in t)
                                                if (e = t[i], e && e[o] > u) {
                                                    if (o > 0 && e[o - 1] !== a) continue;
                                                    e[o] -= 1, e[o + 1] >= 0 && e[o] === u && (e[o + 1] += n, l[i] += h)
                                                }
                                        }
                                    } else c.innerHTML += d.innerHTML;
                                    i.removeItem(d), u--
                                } else 1 === c.nodeType && e(c, o + 1, u)
                            }
                    }(e, 0, 0), l
            },
            mergeNestedTags: function(e, t) {
                "string" == typeof t ? t = function(e) {
                        return this.test(e.tagName)
                    }.bind(new this._w.RegExp("^(" + (t || ".+") + ")$", "i")) : "function" != typeof t && (t = function() {
                        return !0
                    }),
                    function e(n) {
                        let i = n.children;
                        if (1 === i.length && i[0].nodeName === n.nodeName && t(n)) {
                            const e = i[0];
                            for (i = e.children; i[0];) n.appendChild(i[0]);
                            n.removeChild(e)
                        }
                        for (let t = 0, i = n.children.length; t < i; t++) e(n.children[t])
                    }(e)
            },
            removeEmptyNode: function(e, t) {
                const n = this;
                t && (t = n.getParentElement(t, (function(t) {
                        return e === t.parentElement
                    }))),
                    function i(l) {
                        if (n._notTextNode(l) || l === t || "false" === l.getAttribute("contenteditable")) return 0;
                        if (l === e || !n.onlyZeroWidthSpace(l.textContent) || l.firstChild && n.isBreak(l.firstChild)) {
                            const e = l.children;
                            for (let t = 0, l = e.length, s = 0; t < l; t++) e[t + s] && !n.isComponent(e[t + s]) && (s += i(e[t + s]))
                        } else if (l.parentNode) return l.parentNode.removeChild(l), -1;
                        return 0
                    }(e), 0 === e.childNodes.length && (e.innerHTML = "<br>")
            },
            htmlRemoveWhiteSpace: function(e) {
                return e ? e.trim().replace(/<\/?(?!strong|span|font|b|var|i|em|u|ins|s|strike|del|sub|sup|mark|a|label)[^>^<]+>\s+(?=<)/gi, (function(e) {
                    return e.trim()
                })) : ""
            },
            sortByDepth: function(e, t) {
                const n = t ? 1 : -1,
                    i = -1 * n;
                e.sort(function(e, t) {
                    return this.isListCell(e) && this.isListCell(t) ? (e = this.getElementDepth(e)) > (t = this.getElementDepth(t)) ? n : e < t ? i : 0 : 0
                }.bind(this))
            },
            _isIgnoreNodeChange: function(e) {
                return 3 !== e.nodeType && ("false" === e.getAttribute("contenteditable") || !this.isTextStyleElement(e))
            },
            _isMaintainedNode: function(e) {
                return 3 !== e.nodeType && /^(a|label)$/i.test("string" == typeof e ? e : e.nodeName)
            },
            _notTextNode: function(e) {
                return 3 !== e.nodeType && (this.isComponent(e) || /^(br|input|select|canvas|img|iframe|audio|video)$/i.test("string" == typeof e ? e : e.nodeName))
            },
            _notAllowedTags: function(e) {
                return /^(meta|script|link|style|[a-z]+\:[a-z]+)$/i.test(e.nodeName)
            },
            createTagsWhitelist: function(e) {
                const t = e.split("|");
                let n = "<\\/?(";
                for (let e = 0, i = t.length; e < i; e++) n += "(?!\\b" + t[e] + "\\b)";
                return n += "[^>^<])+>", new RegExp(n, "g")
            },
            _consistencyCheckOfHTML: function(e, t) {
                const n = [],
                    i = this.getListChildren(e, function(i) {
                        return t.test(i.nodeName) || 0 !== i.childNodes.length ? i.parentNode !== e && (this.isFormatElement(i) || this.isComponent(i) || this.isList(i) || (this.isMedia(i) && !this.isAnchor(i.parentNode) || this.isMedia(i.firstElementChild) && this.isAnchor(i)) && !this.getParentElement(i, this.isComponent)) && !this.isRangeFormatElement(i.parentNode) && !this.isListCell(i.parentNode) : (n.push(i), !1)
                    }.bind(this));
                for (let e in n) this.removeItem(n[e]);
                const l = [];
                for (let e, t, n = 0, s = i.length; n < s; n++) e = i[n], t = e.parentNode, t.parentNode.insertBefore(e, t), l.push(t);
                for (let e, t = 0, n = l.length; t < n; t++) e = l[t], this.onlyZeroWidthSpace(e.textContent.trim()) && this.removeItem(e);
                const s = this.getListChildren(e, function(e) {
                    return !this.isTable(e) && !this.isListCell(e) && (this.isFormatElement(e) || this.isRangeFormatElement(e) || this.isTextStyleElement(e)) && 0 === e.childNodes.length && !f.getParentElement(e, ".katex")
                }.bind(this));
                for (let e in s) this.removeItem(s[e]);
                const o = this.getListChildren(e, function(e) {
                    return this.isList(e.parentNode) && !this.isList(e) && !this.isListCell(e)
                }.bind(this));
                for (let e, t, n, i = 0, l = o.length; i < l; i++) {
                    for (e = o[i], t = this.createElement("LI"), n = e.childNodes; n[0];) t.appendChild(n[0]);
                    e.parentNode.insertBefore(t, e), this.removeItem(e)
                }
            },
            _setDefaultOptionStyle: function(e) {
                let t = "";
                return e.height && (t += "height:" + e.height + ";"), e.minHeight && (t += "min-height:" + e.minHeight + ";"), e.maxHeight && (t += "max-height:" + e.maxHeight + ";"), t
            }
        };
        var _ = f,
            b = {
                icons: null,
                init: function(e, t) {
                    "object" != typeof t && (t = {});
                    const n = document;
                    this._initOptions(e, t);
                    const i = n.createElement("DIV");
                    i.className = "sun-editor", e.id && (i.id = "suneditor_" + e.id);
                    const l = n.createElement("DIV");
                    l.className = "se-container";
                    const s = this._createToolBar(n, t.buttonList, t.plugins, t.lang);
                    s.pluginCallButtons.math && this._checkKatexMath(t.katex);
                    const o = n.createElement("DIV");
                    o.className = "se-arrow";
                    const a = n.createElement("DIV");
                    a.className = "se-toolbar-sticky-dummy";
                    const r = n.createElement("DIV");
                    r.className = "se-wrapper";
                    const c = this._initElements(t, i, s.element, o),
                        d = c.bottomBar,
                        u = c.wysiwygFrame,
                        h = c.placeholder;
                    let g = c.codeView;
                    const p = d.resizingBar,
                        m = d.navigation,
                        f = d.charWrapper,
                        _ = d.charCounter,
                        b = n.createElement("DIV");
                    b.className = "se-loading-box sun-editor-common", b.innerHTML = '<div class="se-loading-effect"></div>';
                    const v = n.createElement("DIV");
                    v.className = "se-line-breaker", v.innerHTML = '<button class="se-btn">' + this.icons.line_break + "</button>";
                    const y = n.createElement("DIV");
                    return y.className = "se-resizing-back", r.appendChild(u), r.appendChild(g), h && r.appendChild(h), l.appendChild(s.element), l.appendChild(a), l.appendChild(r), l.appendChild(y), l.appendChild(b), l.appendChild(v), p && l.appendChild(p), i.appendChild(l), g = this._checkCodeMirror(t, g), {
                        constructed: {
                            _top: i,
                            _relative: l,
                            _toolBar: s.element,
                            _editorArea: r,
                            _wysiwygArea: u,
                            _codeArea: g,
                            _placeholder: h,
                            _resizingBar: p,
                            _navigation: m,
                            _charWrapper: f,
                            _charCounter: _,
                            _loading: b,
                            _lineBreaker: v,
                            _resizeBack: y,
                            _stickyDummy: a,
                            _arrow: o
                        },
                        options: t,
                        plugins: s.plugins,
                        pluginCallButtons: s.pluginCallButtons,
                        _icons: this.icons
                    }
                },
                _checkCodeMirror: function(e, t) {
                    if (e.codeMirror) {
                        const n = [{
                            mode: "htmlmixed",
                            htmlMode: !0,
                            lineNumbers: !0,
                            lineWrapping: !0
                        }, e.codeMirror.options || {}].reduce((function(e, t) {
                            for (let n in t) e[n] = t[n];
                            return e
                        }), {});
                        "auto" === e.height && (n.viewportMargin = 1 / 0, n.height = "auto");
                        const i = e.codeMirror.src.fromTextArea(t, n);
                        i.display.wrapper.style.cssText = t.style.cssText, e.codeMirrorEditor = i, (t = i.display.wrapper).className += " se-wrapper-code-mirror"
                    }
                    return t
                },
                _checkKatexMath: function(e) {
                    if (!e) throw Error('[SUNEDITOR.create.fail] To use the math button you need to add a "katex" object to the options.');
                    const t = [{
                        throwOnError: !1
                    }, e.options || {}].reduce((function(e, t) {
                        for (let n in t) e[n] = t[n];
                        return e
                    }), {});
                    e.options = t
                },
                _setOptions: function(e, t, n, i) {
                    this._initOptions(t.element.originElement, e);
                    const l = t.element,
                        s = l.relative,
                        o = l.editorArea,
                        a = !!e.buttonList || e.mode !== i.mode,
                        r = !!e.plugins,
                        c = this._createToolBar(document, a ? e.buttonList : i.buttonList, r ? e.plugins : n, e.lang);
                    c.pluginCallButtons.math && this._checkKatexMath(e.katex);
                    const d = document.createElement("DIV");
                    d.className = "se-arrow", a && (s.replaceChild(c.element, l.toolbar), l.toolbar = c.element, l._arrow = d);
                    const u = this._initElements(e, l.topArea, a ? c.element : l.toolbar, d),
                        h = u.bottomBar,
                        g = u.wysiwygFrame,
                        p = u.placeholder;
                    let m = u.codeView;
                    return l.resizingBar && s.removeChild(l.resizingBar), h.resizingBar && s.appendChild(h.resizingBar), l.resizingBar = h.resizingBar, l.navigation = h.navigation, l.charWrapper = h.charWrapper, l.charCounter = h.charCounter, o.removeChild(l.wysiwygFrame), o.removeChild(l.code), o.appendChild(g), o.appendChild(m), l.placeholder && o.removeChild(l.placeholder), p && o.appendChild(p), m = this._checkCodeMirror(e, m), l.wysiwygFrame = g, l.code = m, l.placeholder = p, {
                        callButtons: a ? c.pluginCallButtons : null,
                        plugins: a || r ? c.plugins : null
                    }
                },
                _initElements: function(e, t, n, i) {
                    t.style.width = e.width, t.style.minWidth = e.minWidth, t.style.maxWidth = e.maxWidth, t.style.display = e.display, "string" == typeof e.position && (t.style.position = e.position), /inline/i.test(e.mode) ? (n.className += " se-toolbar-inline", n.style.width = e.toolbarWidth) : /balloon/i.test(e.mode) && (n.className += " se-toolbar-balloon", n.style.width = e.toolbarWidth, n.appendChild(i));
                    const l = document.createElement(e.iframe ? "IFRAME" : "DIV");
                    if (l.className = "se-wrapper-inner se-wrapper-wysiwyg", e.iframe) {
                        const t = function() {
                            const t = e.iframeCSSFileName;
                            let n = "";
                            for (let e, i = 0, l = t.length; i < l; i++) {
                                if (e = [], /^https?:\/\//.test(t[i])) e.push(t[i]);
                                else {
                                    const n = new RegExp("(^|.*[\\/])" + t[i] + "(\\..+)?.css(?:\\?.*|;.*)?$", "i");
                                    for (let t, i = document.getElementsByTagName("link"), l = 0, s = i.length; l < s; l++) t = i[l].href.match(n), t && e.push(t[0])
                                }
                                if (!e || 0 === e.length) throw '[SUNEDITOR.constructor.iframe.fail] The suneditor CSS files installation path could not be automatically detected. Please set the option property "iframeCSSFileName" before creating editor instances.';
                                for (let t = 0, i = e.length; t < i; t++) n += '<link href="' + e[t] + '" rel="stylesheet">'
                            }
                            return n
                        }() + ("auto" === e.height ? "<style>\n/** Iframe height auto */\nbody{height: min-content; overflow: hidden;}\n</style>" : "");
                        l.allowFullscreen = !0, l.frameBorder = 0, l.addEventListener("load", (function() {
                            this.setAttribute("scrolling", "auto"), this.contentDocument.head.innerHTML = '<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1"><title></title>' + t, this.contentDocument.body.className = "sun-editor-editable", this.contentDocument.body.setAttribute("contenteditable", !0)
                        }))
                    } else l.setAttribute("contenteditable", !0), l.setAttribute("scrolling", "auto"), l.className += " sun-editor-editable";
                    l.style.cssText = _._setDefaultOptionStyle(e);
                    const s = document.createElement("TEXTAREA");
                    s.className = "se-wrapper-inner se-wrapper-code", s.style.display = "none", s.style.height = e.height, s.style.minHeight = e.minHeight, s.style.maxHeight = e.maxHeight, "auto" === e.height && (s.style.overflow = "hidden");
                    let o = null,
                        a = null,
                        r = null,
                        c = null;
                    if (e.resizingBar && (o = document.createElement("DIV"), o.className = "se-resizing-bar sun-editor-common", a = document.createElement("DIV"), a.className = "se-navigation sun-editor-common", o.appendChild(a), e.charCounter)) {
                        if (r = document.createElement("DIV"), r.className = "se-char-counter-wrapper", e.charCounterLabel) {
                            const t = document.createElement("SPAN");
                            t.className = "se-char-label", t.textContent = e.charCounterLabel, r.appendChild(t)
                        }
                        if (c = document.createElement("SPAN"), c.className = "se-char-counter", c.textContent = "0", r.appendChild(c), e.maxCharCount > 0) {
                            const t = document.createElement("SPAN");
                            t.textContent = " / " + e.maxCharCount, r.appendChild(t)
                        }
                        o.appendChild(r)
                    }
                    let d = null;
                    return e.placeholder && (d = document.createElement("SPAN"), d.className = "se-placeholder", d.innerText = e.placeholder), {
                        bottomBar: {
                            resizingBar: o,
                            navigation: a,
                            charWrapper: r,
                            charCounter: c
                        },
                        wysiwygFrame: l,
                        codeView: s,
                        placeholder: d
                    }
                },
                _initOptions: function(e, t) {
                    t.lang = t.lang || m.a, t._defaultTagsWhitelist = "string" == typeof t._defaultTagsWhitelist ? t._defaultTagsWhitelist : "br|p|div|pre|blockquote|h[1-6]|ol|ul|li|hr|figure|figcaption|img|iframe|audio|video|table|thead|tbody|tr|th|td|a|b|strong|var|i|em|u|ins|s|span|strike|del|sub|sup", t._editorTagsWhitelist = t._defaultTagsWhitelist + ("string" == typeof t.addTagsWhitelist && t.addTagsWhitelist.length > 0 ? "|" + t.addTagsWhitelist : ""), t.pasteTagsWhitelist = "string" == typeof t.pasteTagsWhitelist ? t.pasteTagsWhitelist : t._editorTagsWhitelist, t.attributesWhitelist = t.attributesWhitelist && "object" == typeof t.attributesWhitelist ? t.attributesWhitelist : null, t.mode = t.mode || "classic", t.toolbarWidth = t.toolbarWidth ? _.isNumber(t.toolbarWidth) ? t.toolbarWidth + "px" : t.toolbarWidth : "auto", t.stickyToolbar = /balloon/i.test(t.mode) ? -1 : void 0 === t.stickyToolbar ? 0 : /^\d+/.test(t.stickyToolbar) ? _.getNumber(t.stickyToolbar, 0) : -1, t.iframe = t.fullPage || t.iframe, t.iframeCSSFileName = t.iframe ? "string" == typeof t.iframeCSSFileName ? [t.iframeCSSFileName] : t.iframeCSSFileName || ["suneditor"] : null, t.codeMirror = t.codeMirror ? t.codeMirror.src ? t.codeMirror : {
                        src: t.codeMirror
                    } : null, t.display = t.display || ("none" !== e.style.display && e.style.display ? e.style.display : "block"), t.popupDisplay = t.popupDisplay || "full", t.resizingBar = void 0 === t.resizingBar ? !/inline|balloon/i.test(t.mode) : t.resizingBar, t.showPathLabel = !!t.resizingBar && ("boolean" != typeof t.showPathLabel || t.showPathLabel), t.charCounter = t.maxCharCount > 0 || "boolean" == typeof t.charCounter && t.charCounter, t.charCounterType = "string" == typeof t.charCounterType ? t.charCounterType : "char", t.charCounterLabel = "string" == typeof t.charCounterLabel ? t.charCounterLabel.trim() : null, t.maxCharCount = _.isNumber(t.maxCharCount) && t.maxCharCount > -1 ? 1 * t.maxCharCount : null, t.width = t.width ? _.isNumber(t.width) ? t.width + "px" : t.width : e.clientWidth ? e.clientWidth + "px" : "100%", t.minWidth = (_.isNumber(t.minWidth) ? t.minWidth + "px" : t.minWidth) || "", t.maxWidth = (_.isNumber(t.maxWidth) ? t.maxWidth + "px" : t.maxWidth) || "", t.height = t.height ? _.isNumber(t.height) ? t.height + "px" : t.height : e.clientHeight ? e.clientHeight + "px" : "auto", t.minHeight = (_.isNumber(t.minHeight) ? t.minHeight + "px" : t.minHeight) || "", t.maxHeight = (_.isNumber(t.maxHeight) ? t.maxHeight + "px" : t.maxHeight) || "", t.defaultStyle = _._setDefaultOptionStyle(t) + ("string" == typeof t.defaultStyle ? t.defaultStyle : ""), t.font = t.font ? t.font : null, t.fontSize = t.fontSize ? t.fontSize : null, t.formats = t.formats ? t.formats : null, t.colorList = t.colorList ? t.colorList : null, t.lineHeights = t.lineHeights ? t.lineHeights : null, t.paragraphStyles = t.paragraphStyles ? t.paragraphStyles : null, t.textStyles = t.textStyles ? t.textStyles : null, t.fontSizeUnit = "string" == typeof t.fontSizeUnit && t.fontSizeUnit.trim() || "px", t.imageResizing = void 0 === t.imageResizing || t.imageResizing, t.imageHeightShow = void 0 === t.imageHeightShow || !!t.imageHeightShow, t.imageWidth = t.imageWidth ? _.isNumber(t.imageWidth) ? t.imageWidth + "px" : t.imageWidth : "auto", t.imageHeight = t.imageHeight ? _.isNumber(t.imageHeight) ? t.imageHeight + "px" : t.imageHeight : "auto", t.imageSizeOnlyPercentage = !!t.imageSizeOnlyPercentage, t._imageSizeUnit = t.imageSizeOnlyPercentage ? "%" : "px", t.imageRotation = void 0 !== t.imageRotation ? t.imageRotation : !(t.imageSizeOnlyPercentage || !t.imageHeightShow), t.imageFileInput = void 0 === t.imageFileInput || t.imageFileInput, t.imageUrlInput = void 0 === t.imageUrlInput || !t.imageFileInput || t.imageUrlInput, t.imageUploadHeader = t.imageUploadHeader || null, t.imageUploadUrl = t.imageUploadUrl || null, t.imageUploadSizeLimit = /\d+/.test(t.imageUploadSizeLimit) ? _.getNumber(t.imageUploadSizeLimit, 0) : null, t.videoResizing = void 0 === t.videoResizing || t.videoResizing, t.videoHeightShow = void 0 === t.videoHeightShow || !!t.videoHeightShow, t.videoRatioShow = void 0 === t.videoRatioShow || !!t.videoRatioShow, t.videoWidth = t.videoWidth && _.getNumber(t.videoWidth, 0) ? _.isNumber(t.videoWidth) ? t.videoWidth + "px" : t.videoWidth : "", t.videoHeight = t.videoHeight && _.getNumber(t.videoHeight, 0) ? _.isNumber(t.videoHeight) ? t.videoHeight + "px" : t.videoHeight : "", t.videoSizeOnlyPercentage = !!t.videoSizeOnlyPercentage, t._videoSizeUnit = t.videoSizeOnlyPercentage ? "%" : "px", t.videoRotation = void 0 !== t.videoRotation ? t.videoRotation : !(t.videoSizeOnlyPercentage || !t.videoHeightShow), t.videoRatio = _.getNumber(t.videoRatio, 4) || .5625, t.videoRatioList = t.videoRatioList ? t.videoRatioList : null, t.youtubeQuery = (t.youtubeQuery || "").replace("?", ""), t.callBackSave = t.callBackSave ? t.callBackSave : null, t.templates = t.templates ? t.templates : null, t.placeholder = "string" == typeof t.placeholder ? t.placeholder : null, t.katex = t.katex ? t.katex.src ? t.katex : {
                        src: t.katex
                    } : null, t.buttonList = t.buttonList || [
                        ["undo", "redo"],
                        ["bold", "underline", "italic", "strike", "subscript", "superscript"],
                        ["removeFormat"],
                        ["outdent", "indent"],
                        ["fullScreen", "showBlocks", "codeView"],
                        ["preview", "print"]
                    ], this.icons = t.icons && "object" == typeof t.icons ? [g, t.icons].reduce((function(e, t) {
                        for (let n in t) e[n] = t[n];
                        return e
                    }), {}) : g
                },
                _defaultButtons: function(e) {
                    const t = this.icons;
                    return {
                        bold: ["_se_command_bold", e.toolbar.bold + " (CTRL+B)", "STRONG", "", t.bold],
                        underline: ["_se_command_underline", e.toolbar.underline + " (CTRL+U)", "U", "", t.underline],
                        italic: ["_se_command_italic", e.toolbar.italic + " (CTRL+I)", "EM", "", t.italic],
                        strike: ["_se_command_strike", e.toolbar.strike + " (CTRL+SHIFT+S)", "DEL", "", t.strike],
                        subscript: ["_se_command_subscript", e.toolbar.subscript, "SUB", "", t.subscript],
                        superscript: ["_se_command_superscript", e.toolbar.superscript, "SUP", "", t.superscript],
                        removeFormat: ["", e.toolbar.removeFormat, "removeFormat", "", t.erase],
                        indent: ["_se_command_indent", e.toolbar.indent + " (CTRL+])", "indent", "", t.outdent],
                        outdent: ["_se_command_outdent", e.toolbar.outdent + " (CTRL+[)", "outdent", "", t.indent],
                        fullScreen: ["se-code-view-enabled se-resizing-enabled", e.toolbar.fullScreen, "fullScreen", "", t.expansion],
                        showBlocks: ["", e.toolbar.showBlocks, "showBlocks", "", t.show_blocks],
                        codeView: ["se-code-view-enabled se-resizing-enabled", e.toolbar.codeView, "codeView", "", t.code_view],
                        undo: ["_se_command_undo se-resizing-enabled", e.toolbar.undo + " (CTRL+Z)", "undo", "", t.undo],
                        redo: ["_se_command_redo se-resizing-enabled", e.toolbar.redo + " (CTRL+Y / CTRL+SHIFT+Z)", "redo", "", t.redo],
                        preview: ["se-resizing-enabled", e.toolbar.preview, "preview", "", t.preview],
                        print: ["se-resizing-enabled", e.toolbar.print, "print", "", t.print],
                        save: ["_se_command_save se-resizing-enabled", e.toolbar.save, "save", "", t.save],
                        blockquote: ["", e.toolbar.tag_blockquote, "blockquote", "command", t.blockquote],
                        font: ["se-btn-select se-btn-tool-font", e.toolbar.font, "font", "submenu", '<span class="txt">' + e.toolbar.font + "</span>" + t.arrow_down],
                        formatBlock: ["se-btn-select se-btn-tool-format", e.toolbar.formats, "formatBlock", "submenu", '<span class="txt">' + e.toolbar.formats + "</span>" + t.arrow_down],
                        fontSize: ["se-btn-select se-btn-tool-size", e.toolbar.fontSize, "fontSize", "submenu", '<span class="txt">' + e.toolbar.fontSize + "</span>" + t.arrow_down],
                        fontColor: ["", e.toolbar.fontColor, "fontColor", "submenu", t.font_color],
                        hiliteColor: ["", e.toolbar.hiliteColor, "hiliteColor", "submenu", t.highlight_color],
                        align: ["se-btn-align", e.toolbar.align, "align", "submenu", t.align_left],
                        list: ["", e.toolbar.list, "list", "submenu", t.list_number],
                        horizontalRule: ["btn_line", e.toolbar.horizontalRule, "horizontalRule", "submenu", t.horizontal_rule],
                        table: ["", e.toolbar.table, "table", "submenu", t.table],
                        lineHeight: ["", e.toolbar.lineHeight, "lineHeight", "submenu", t.line_height],
                        template: ["", e.toolbar.template, "template", "submenu", t.template],
                        paragraphStyle: ["", e.toolbar.paragraphStyle, "paragraphStyle", "submenu", t.paragraph_style],
                        textStyle: ["", e.toolbar.textStyle, "textStyle", "submenu", t.text_style],
                        link: ["", e.toolbar.link, "link", "dialog", t.link],
                        image: ["", e.toolbar.image, "image", "dialog", t.image],
                        video: ["", e.toolbar.video, "video", "dialog", t.video],
                        math: ["", e.toolbar.math, "math", "dialog", t.math]
                    }
                },
                _createModuleGroup: function(e) {
                    const t = _.createElement("DIV");
                    t.className = "se-btn-module" + (e ? "" : " se-btn-module-border");
                    const n = _.createElement("UL");
                    return n.className = "se-menu-list", t.appendChild(n), {
                        div: t,
                        ul: n
                    }
                },
                _createButton: function(e, t, n, i, l, s) {
                    const o = _.createElement("LI"),
                        a = _.createElement("BUTTON");
                    return a.setAttribute("type", "button"), a.setAttribute("class", "se-btn" + (e ? " " + e : "") + " se-tooltip"), a.setAttribute("data-command", n), a.setAttribute("data-display", i), l || (l = '<span class="se-icon-text">!</span>'), l += '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + (t || n) + "</span></span>", s && a.setAttribute("disabled", !0), a.innerHTML = l, o.appendChild(a), {
                        li: o,
                        button: a
                    }
                },
                _createToolBar: function(e, t, n, i) {
                    const l = e.createElement("DIV");
                    l.className = "se-toolbar-separator-vertical";
                    const s = e.createElement("DIV");
                    s.className = "se-toolbar sun-editor-common";
                    const o = this._defaultButtons(i),
                        a = {},
                        r = {};
                    if (n) {
                        const e = n.length ? n : Object.keys(n).map((function(e) {
                            return n[e]
                        }));
                        for (let t, n = 0, i = e.length; n < i; n++) t = e[n].default || e[n], r[t.name] = t
                    }
                    let c = null,
                        d = null,
                        u = null,
                        h = null,
                        g = "",
                        p = !1;
                    const m = 1 === t.length;
                    for (let n = 0; n < t.length; n++) {
                        const i = t[n];
                        if (u = this._createModuleGroup(m), "object" == typeof i) {
                            for (let e = 0; e < i.length; e++) {
                                if (d = i[e], "object" == typeof d) "function" == typeof d.add ? (g = d.name, c = o[g], r[g] = d) : (g = d.name, c = [d.buttonClass, d.title, d.name, d.dataDisplay, d.innerHTML, d._disabled]);
                                else if (c = o[d], g = d, !c) {
                                    const e = r[g];
                                    if (!e) throw Error("[SUNEDITOR.create.toolbar.fail] The button name of a plugin that does not exist. [" + g + "]");
                                    c = [e.buttonClass, e.title, e.name, e.display, e.innerHTML, e._disabled]
                                }
                                h = this._createButton(c[0], c[1], c[2], c[3], c[4], c[5]), u.ul.appendChild(h.li), r[g] && (a[g] = h.button)
                            }
                            p && s.appendChild(l.cloneNode(!1)), s.appendChild(u.div), p = !0
                        } else if (/^\/$/.test(i)) {
                            const t = e.createElement("DIV");
                            t.className = "se-btn-module-enter", s.appendChild(t), p = !1
                        }
                    }
                    const f = e.createElement("DIV");
                    return f.className = "se-toolbar-cover", s.appendChild(f), {
                        element: s,
                        plugins: r,
                        pluginCallButtons: a
                    }
                }
            };
        var v = function(e, t, n) {
                return {
                    element: {
                        originElement: e,
                        topArea: t._top,
                        relative: t._relative,
                        toolbar: t._toolBar,
                        resizingBar: t._resizingBar,
                        navigation: t._navigation,
                        charWrapper: t._charWrapper,
                        charCounter: t._charCounter,
                        editorArea: t._editorArea,
                        wysiwygFrame: t._wysiwygArea,
                        wysiwyg: n.iframe ? t._wysiwygArea.contentDocument.body : t._wysiwygArea,
                        code: t._codeArea,
                        placeholder: t._placeholder,
                        loading: t._loading,
                        lineBreaker: t._lineBreaker,
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
                        undo: t._toolBar.querySelector("._se_command_undo"),
                        redo: t._toolBar.querySelector("._se_command_redo"),
                        save: t._toolBar.querySelector("._se_command_save"),
                        outdent: t._toolBar.querySelector("._se_command_outdent"),
                        indent: t._toolBar.querySelector("._se_command_indent")
                    },
                    options: n,
                    option: n
                }
            },
            y = {
                name: "notice",
                add: function(e) {
                    const t = e.context;
                    t.notice = {};
                    let n = e.util.createElement("DIV"),
                        i = e.util.createElement("SPAN"),
                        l = e.util.createElement("BUTTON");
                    n.className = "se-notice", l.className = "close", l.setAttribute("aria-label", "Close"), l.setAttribute("title", e.lang.dialogBox.close), l.innerHTML = e.icons.cancel, n.appendChild(i), n.appendChild(l), t.notice.modal = n, t.notice.message = i, l.addEventListener("click", this.onClick_cancel.bind(e)), t.element.relative.insertBefore(n, t.element.editorArea), n = null
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
            x = function(e, t, n, i, l, s) {
                const o = e.element.originElement.ownerDocument || document,
                    a = o.defaultView || window,
                    r = _,
                    c = s,
                    d = {
                        _d: o,
                        _w: a,
                        _parser: new a.DOMParser,
                        _wd: null,
                        _ww: null,
                        util: r,
                        functions: null,
                        notice: y,
                        icons: c,
                        history: null,
                        context: e,
                        pluginCallButtons: t,
                        plugins: n || {},
                        initPlugins: {},
                        _targetPlugins: {},
                        lang: i,
                        effectNode: null,
                        submenu: null,
                        container: null,
                        _resizingName: "",
                        _submenuName: "",
                        _bindedSubmenuOff: null,
                        _bindedContainerOff: null,
                        submenuActiveButton: null,
                        containerActiveButton: null,
                        controllerArray: [],
                        currentControllerName: "",
                        currentControllerTarget: null,
                        codeViewDisabledButtons: null,
                        resizingDisabledButtons: null,
                        _htmlCheckWhitelistRegExp: null,
                        editorTagsWhitelistRegExp: null,
                        pasteTagsWhitelistRegExp: null,
                        hasFocus: !1,
                        _attributesWhitelistRegExp: null,
                        _attributesTagsWhitelist: null,
                        _bindControllersOff: null,
                        _isInline: null,
                        _isBalloon: null,
                        _isBalloonAlways: null,
                        _inlineToolbarAttr: {
                            top: "",
                            width: "",
                            isShow: !1
                        },
                        _notHideToolbar: !1,
                        _sticky: !1,
                        _antiBlur: !1,
                        _lineBreaker: null,
                        _lineBreakerButton: null,
                        _componentsInfoInit: !0,
                        _componentsInfoReset: !1,
                        _imageUploadBefore: function(e, t) {
                            return "function" != typeof h.onImageUploadBefore || h.onImageUploadBefore(e, t, this)
                        },
                        _imageUpload: function(e, t, n, i, l) {
                            "function" == typeof h.onImageUpload && h.onImageUpload(e, 1 * t, n, i, l, this)
                        },
                        _imageUploadError: function(e, t) {
                            return "function" != typeof h.onImageUploadError || h.onImageUploadError(e, t, this)
                        },
                        _imageUploadHandler: function(e, t) {
                            return "function" == typeof h.imageUploadHandler && (h.imageUploadHandler(e, t, this), !0)
                        },
                        _videoUpload: function(e, t, n, i, l) {
                            "function" == typeof h.onVideoUpload && h.onVideoUpload(e, 1 * t, n, i, l, this)
                        },
                        activePlugins: null,
                        componentInfoPlugins: null,
                        commandMap: null,
                        _defaultCommand: {
                            bold: "STRONG",
                            underline: "U",
                            italic: "EM",
                            strike: "DEL",
                            subscript: "SUB",
                            superscript: "SUP"
                        },
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
                            _lineBreakComp: null,
                            _lineBreakDir: ""
                        },
                        callPlugin: function(e, n, i) {
                            if (i = i || t[e], !this.plugins[e]) throw Error('[SUNEDITOR.core.callPlugin.fail] The called plugin does not exist or is in an invalid format. (pluginName:"' + e + '")');
                            this.initPlugins[e] ? "object" == typeof this._targetPlugins[e] && i && this.initMenuTarget(e, i, this._targetPlugins[e]) : (this.plugins[e].add(this, i), this.initPlugins[e] = !0), this.plugins[e].active && !this.commandMap[e] && i && (this.commandMap[e] = i, this.activePlugins.push(e)), "function" == typeof n && n()
                        },
                        addModule: function(e) {
                            for (let t, n = 0, i = e.length; n < i; n++) t = e[n].name, this.plugins[t] || (this.plugins[t] = e[n], "function" == typeof this.plugins[t].add && this.plugins[t].add(this))
                        },
                        initMenuTarget: function(e, t, n) {
                            t ? (t.parentNode.appendChild(n), this._targetPlugins[e] = !0) : this._targetPlugins[e] = n
                        },
                        submenuOn: function(t) {
                            this._bindedSubmenuOff && this._bindedSubmenuOff(), this._bindControllersOff && this.controllersOff();
                            const n = this._submenuName = t.getAttribute("data-command");
                            this.submenu = t.nextElementSibling, this.submenu.style.top = "-10000px", this.submenu.style.visibility = "hidden", this.submenu.style.display = "block", r.addClass(t, "on"), this.submenuActiveButton = t;
                            const i = this.context.element.toolbar,
                                l = i.offsetWidth,
                                s = this.submenu.offsetWidth,
                                o = l <= s ? 0 : l - (t.parentElement.offsetLeft + s);
                            this.submenu.style.left = o < 0 ? o + "px" : "1px";
                            let a = 0,
                                c = t;
                            for (; c && c !== i;) a += c.offsetTop, c = c.offsetParent;
                            this._isBalloon ? a += i.offsetTop + t.offsetHeight : a -= t.offsetHeight;
                            const d = a + this.submenu.offsetHeight - e.element.wysiwyg.offsetHeight + 3;
                            d > 0 && u._getPageBottomSpace() < d ? this.submenu.style.top = -1 * (this.submenu.offsetHeight + 3) + "px" : this.submenu.style.top = "", this.submenu.style.visibility = "", this._bindedSubmenuOff = this.submenuOff.bind(this), this.addDocEvent("mousedown", this._bindedSubmenuOff, !1), this.plugins[n].on && this.plugins[n].on.call(this), this._antiBlur = !0
                        },
                        submenuOff: function() {
                            this.removeDocEvent("mousedown", this._bindedSubmenuOff), this._bindedSubmenuOff = null, this.submenu && (this._submenuName = "", this.submenu.style.display = "none", this.submenu = null, r.removeClass(this.submenuActiveButton, "on"), this.submenuActiveButton = null, this._notHideToolbar = !1), this._antiBlur = !1
                        },
                        containerOn: function(e) {
                            this._bindedContainerOff && this._bindedContainerOff();
                            const t = this._containerName = e.getAttribute("data-command");
                            this.container = e.nextElementSibling, this.container.style.display = "block", r.addClass(e, "on"), this.containerActiveButton = e;
                            const n = this.context.element.toolbar.offsetWidth,
                                i = this.container.offsetWidth,
                                l = n <= i ? 0 : n - (e.parentElement.offsetLeft + i);
                            this.container.style.left = l < 0 ? l + "px" : "1px", this._bindedContainerOff = this.containerOff.bind(this), this.addDocEvent("mousedown", this._bindedContainerOff, !1), this.plugins[t].on && this.plugins[t].on.call(this), this._antiBlur = !0
                        },
                        containerOff: function() {
                            this.removeDocEvent("mousedown", this._bindedContainerOff), this._bindedContainerOff = null, this.container && (this._containerName = "", this.container.style.display = "none", this.container = null, r.removeClass(this.containerActiveButton, "on"), this.containerActiveButton = null, this._notHideToolbar = !1), this._antiBlur = !1
                        },
                        controllersOn: function() {
                            if (this._bindControllersOff) {
                                const e = this._resizingName;
                                this._bindControllersOff(), this._resizingName = e
                            }
                            for (let e, t = 0; t < arguments.length; t++) e = arguments[t], "string" != typeof e ? "function" != typeof e ? r.hasClass(e, "se-controller") ? (e.style && (e.style.display = "block"), this.controllerArray[t] = e) : this.currentControllerTarget = e : this.controllerArray[t] = e : this.currentControllerName = e;
                            this._bindControllersOff = this.controllersOff.bind(this), this.addDocEvent("mousedown", this._bindControllersOff, !1), this.addDocEvent("keydown", this._bindControllersOff, !1), this._antiBlur = !0, "function" == typeof h.showController && h.showController(this.currentControllerName, this.controllerArray, this)
                        },
                        controllersOff: function(e) {
                            if (this._resizingName && e && "keydown" === e.type && 27 !== e.keyCode) return;
                            if (this._resizingName = "", this.currentControllerName = "", this.currentControllerTarget = null, this.effectNode = null, !this._bindControllersOff) return;
                            this.removeDocEvent("mousedown", this._bindControllersOff), this.removeDocEvent("keydown", this._bindControllersOff), this._bindControllersOff = null;
                            const t = this.controllerArray.length;
                            if (t > 0) {
                                for (let e = 0; e < t; e++) "function" == typeof this.controllerArray[e] ? this.controllerArray[e]() : this.controllerArray[e].style.display = "none";
                                this.controllerArray = []
                            }
                            this._antiBlur = !1
                        },
                        execCommand: function(e, t, n) {
                            this._wd.execCommand(e, t, "formatBlock" === e ? "<" + n + ">" : n), this.history.push(!0)
                        },
                        nativeFocus: function() {
                            const t = r.getParentElement(this.getSelectionNode(), "figcaption");
                            t ? t.focus() : e.element.wysiwyg.focus(), this._editorRange()
                        },
                        focus: function() {
                            if ("none" !== e.element.wysiwygFrame.style.display) {
                                if (l.iframe) this.nativeFocus();
                                else try {
                                    const e = this.getRange();
                                    if (e.startContainer === e.endContainer && r.isWysiwygDiv(e.startContainer)) {
                                        const e = r.createElement("P"),
                                            t = r.createElement("BR");
                                        e.appendChild(t), this.setRange(t, 0, t, 0)
                                    } else this.setRange(e.startContainer, e.startOffset, e.endContainer, e.endOffset)
                                } catch (e) {
                                    this.nativeFocus()
                                }
                                u._applyTagEffects(), d._isBalloon && u._toggleToolbarBalloon()
                            }
                        },
                        focusEdge: function(t) {
                            if (t || (t = e.element.wysiwyg.lastElementChild), r.isComponent(t)) {
                                const e = t.querySelector("IMG"),
                                    n = t.querySelector("IFRAME");
                                e ? this.selectComponent(e, "image") : n && this.selectComponent(n, "video")
                            } else t && (t = r.getChildElement(t, (function(e) {
                                return 0 === e.childNodes.length || 3 === e.nodeType
                            }), !0)) ? this.setRange(t, t.textContent.length, t, t.textContent.length) : this.nativeFocus()
                        },
                        setRange: function(e, t, n, i) {
                            if (!e || !n) return;
                            t > e.textContent.length && (t = e.textContent.length), i > n.textContent.length && (i = n.textContent.length);
                            const s = this._wd.createRange();
                            try {
                                s.setStart(e, t), s.setEnd(n, i)
                            } catch (e) {
                                this.nativeFocus()
                            }
                            const o = this.getSelection();
                            o.removeAllRanges && o.removeAllRanges(), o.addRange(s), this._editorRange(), l.iframe && this.nativeFocus()
                        },
                        removeRange: function() {
                            this._variable._range = null, this._variable._selectionNode = null, this.getSelection().removeAllRanges();
                            const e = this.commandMap,
                                t = this.activePlugins;
                            for (let i in e) t.indexOf(i) > -1 ? n[i].active.call(d, null) : e.OUTDENT && /^OUTDENT$/i.test(i) ? e.OUTDENT.setAttribute("disabled", !0) : e.INDENT && /^INDENT$/i.test(i) ? e.INDENT.removeAttribute("disabled") : r.removeClass(e[i], "active")
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
                                n = null;
                            t = e.rangeCount > 0 ? e.getRangeAt(0) : this._createDefaultRange(), this._variable._range = t, n = t.collapsed ? t.commonAncestorContainer : e.extentNode || e.anchorNode, this._variable._selectionNode = n
                        },
                        _createDefaultRange: function() {
                            e.element.wysiwyg.focus();
                            const t = this._wd.createRange();
                            return e.element.wysiwyg.firstChild || this.execCommand("formatBlock", !1, "P"), t.setStart(e.element.wysiwyg.firstChild, 0), t.setEnd(e.element.wysiwyg.firstChild, 0), t
                        },
                        _resetRangeToTextNode: function() {
                            const t = this.getRange();
                            let n, i, l, s = t.startContainer,
                                o = t.startOffset,
                                a = t.endContainer,
                                c = t.endOffset;
                            if (r.isFormatElement(s) && (s = s.childNodes[o], o = 0), r.isFormatElement(a) && (a = a.childNodes[c], c = 0), n = r.isWysiwygDiv(s) ? e.element.wysiwyg.firstChild : s, i = o, r.isBreak(n) || 1 === n.nodeType && n.childNodes.length > 0) {
                                const e = r.isBreak(n);
                                if (!e) {
                                    for (; n && !r.isBreak(n) && 1 === n.nodeType;) n = n.childNodes[i] || n.nextElementSibling || n.nextSibling, i = 0;
                                    let e = r.getFormatElement(n, null);
                                    e === r.getRangeFormatElement(e, null) && (e = r.createElement(r.getParentElement(n, r.isCell) ? "DIV" : "P"), n.parentNode.insertBefore(e, n), e.appendChild(n))
                                }
                                if (r.isBreak(n)) {
                                    const t = r.createTextNode(r.zeroWidthSpace);
                                    n.parentNode.insertBefore(t, n), n = t, e && s === a && (a = n, c = 1)
                                }
                            }
                            if (s = n, o = i, n = r.isWysiwygDiv(a) ? e.element.wysiwyg.lastChild : a, i = c, r.isBreak(n) || 1 === n.nodeType && n.childNodes.length > 0) {
                                const e = r.isBreak(n);
                                if (!e) {
                                    for (; n && !r.isBreak(n) && 1 === n.nodeType && (l = n.childNodes, 0 !== l.length);) n = l[i > 0 ? i - 1 : i] || !/FIGURE/i.test(l[0].nodeName) ? l[0] : n.previousElementSibling || n.previousSibling || s, i = i > 0 ? n.textContent.length : i;
                                    let e = r.getFormatElement(n, null);
                                    e === r.getRangeFormatElement(e, null) && (e = r.createElement(r.isCell(e) ? "DIV" : "P"), n.parentNode.insertBefore(e, n), e.appendChild(n))
                                }
                                if (r.isBreak(n)) {
                                    const t = r.createTextNode(r.zeroWidthSpace);
                                    n.parentNode.insertBefore(t, n), n = t, i = 1, e && !n.previousSibling && r.removeItem(a)
                                }
                            }
                            a = n, c = i, this.setRange(s, o, a, c)
                        },
                        getSelectedElements: function(t) {
                            this._resetRangeToTextNode();
                            let n = this.getRange();
                            if (r.isWysiwygDiv(n.startContainer)) {
                                const t = e.element.wysiwyg.children;
                                if (0 === t.length) return null;
                                this.setRange(t[0], 0, t[t.length - 1], t[t.length - 1].textContent.trim().length), n = this.getRange()
                            }
                            const i = n.startContainer,
                                l = n.endContainer,
                                s = n.commonAncestorContainer,
                                o = r.getListChildren(s, (function(e) {
                                    return t ? t(e) : r.isFormatElement(e)
                                }));
                            if (r.isWysiwygDiv(s) || r.isRangeFormatElement(s) || o.unshift(r.getFormatElement(s, null)), i === l || 1 === o.length) return o;
                            let a = r.getFormatElement(i, null),
                                c = r.getFormatElement(l, null),
                                d = null,
                                u = null;
                            const h = function(e) {
                                return !r.isTable(e) || /^TABLE$/i.test(e.nodeName)
                            };
                            let g = r.getRangeFormatElement(a, h),
                                p = r.getRangeFormatElement(c, h);
                            r.isTable(g) && r.isListCell(g.parentNode) && (g = g.parentNode), r.isTable(p) && r.isListCell(p.parentNode) && (p = p.parentNode);
                            const m = g === p;
                            for (let e, t = 0, n = o.length; t < n; t++)
                                if (e = o[t], a === e || !m && e === g) d = t;
                                else if (c === e || !m && e === p) {
                                u = t;
                                break
                            }
                            return null === d && (d = 0), null === u && (u = o.length - 1), o.slice(d, u + 1)
                        },
                        getSelectedElementsAndComponents: function(e) {
                            const t = this.getRange().commonAncestorContainer,
                                n = r.getParentElement(t, r.isComponent),
                                i = r.isTable(t) ? this.getSelectedElements(null) : this.getSelectedElements(function(e) {
                                    const t = this.getParentElement(e, this.isComponent);
                                    return this.isFormatElement(e) && (!t || t === n) || this.isComponent(e) && !this.getFormatElement(e)
                                }.bind(r));
                            if (e)
                                for (let e = 0, t = i.length; e < t; e++)
                                    for (let n = e - 1; n >= 0; n--)
                                        if (i[n].contains(i[e])) {
                                            i.splice(e, 1), e--, t--;
                                            break
                                        } return i
                        },
                        isEdgePoint: function(e, t) {
                            return 0 === t || !e.nodeValue && 1 === t || t === e.nodeValue.length
                        },
                        showLoading: function() {
                            e.element.loading.style.display = "block"
                        },
                        closeLoading: function() {
                            e.element.loading.style.display = "none"
                        },
                        appendFormatTag: function(e, t) {
                            const n = r.getFormatElement(this.getSelectionNode(), null),
                                i = t ? "string" == typeof t ? t : t.nodeName : r.isFormatElement(n) && !r.isFreeFormatElement(n) ? n.nodeName : "P",
                                l = r.createElement(i);
                            return l.innerHTML = "<br>", (t && "string" != typeof t || !t && r.isFormatElement(n)) && r.copyTagAttributes(l, t || n), r.isCell(e) ? e.insertBefore(l, e.nextElementSibling) : e.parentNode.insertBefore(l, e.nextElementSibling), l
                        },
                        insertComponent: function(e, t) {
                            const n = this.removeNode();
                            let i = null,
                                l = this.getSelectionNode(),
                                s = r.getFormatElement(l, null);
                            if (r.isListCell(s))
                                if (/^HR$/i.test(e.nodeName)) {
                                    const t = r.createElement("LI"),
                                        n = r.createTextNode(r.zeroWidthSpace);
                                    t.appendChild(e), t.appendChild(n), s.parentNode.insertBefore(t, s.nextElementSibling), this.setRange(n, 1, n, 1)
                                } else this.insertNode(e, l === s ? null : n.container.nextSibling), e.nextSibling || e.parentNode.appendChild(r.createElement("BR")), i = r.createElement("LI"), s.parentNode.insertBefore(i, s.nextElementSibling);
                            else {
                                if (this.getRange().collapsed && (3 === n.container.nodeType || r.isBreak(n.container))) {
                                    const e = r.getParentElement(n.container, function(e) {
                                        return this.isRangeFormatElement(e)
                                    }.bind(r));
                                    i = r.splitElement(n.container, n.offset, e ? r.getElementDepth(e) + 1 : 0), i && (s = i.previousSibling)
                                }
                                this.insertNode(e, s), i || (i = this.appendFormatTag(e, r.isFormatElement(s) ? s : null))
                            }
                            return i = r.getEdgeChildNodes(i, null).sc || i, this.setRange(i, 0, i, 0), t || this.history.push(1), i
                        },
                        selectComponent: function(e, t) {
                            if ("image" === t) {
                                if (!d.plugins.image) return;
                                d.removeRange(), d.callPlugin("image", (function() {
                                    const t = d.plugins.resizing.call_controller_resize.call(d, e, "image");
                                    d.plugins.image.onModifyMode.call(d, e, t), r.getParentElement(e, ".se-image-container") || (d.plugins.image.openModify.call(d, !0), d.plugins.image.update_image.call(d, !0, !0, !0))
                                }), null)
                            } else if ("video" === t) {
                                if (!d.plugins.video) return;
                                d.removeRange(), d.callPlugin("video", (function() {
                                    const t = d.plugins.resizing.call_controller_resize.call(d, e, "video");
                                    d.plugins.video.onModifyMode.call(d, e, t)
                                }), null)
                            }
                        },
                        insertNode: function(e, t) {
                            const n = r.isFormatElement(e) || r.isRangeFormatElement(e) || r.isComponent(e);
                            if (!t && n) {
                                const e = this.removeNode();
                                if (3 === e.container.nodeType || r.isBreak(e.container)) {
                                    const n = r.getParentElement(e.container, function(e) {
                                        return this.isRangeFormatElement(e)
                                    }.bind(r));
                                    (t = r.splitElement(e.container, e.offset, n ? r.getElementDepth(n) + 1 : 0)) && (t = t.previousSibling)
                                }
                            }
                            const i = this.getRange(),
                                l = i.startContainer,
                                s = i.startOffset,
                                o = i.endContainer,
                                a = i.endOffset,
                                c = i.commonAncestorContainer;
                            let d, u = null;
                            if (t) d = t.parentNode, t = t.nextSibling, u = !0;
                            else if (d = l, 3 === l.nodeType && (d = l.parentNode), i.collapsed)
                                if (3 === c.nodeType) t = c.textContent.length > a ? c.splitText(a) : c.nextSibling;
                                else if (r.isBreak(d)) t = d, d = d.parentNode;
                            else {
                                let n = d.childNodes[s];
                                const i = n && 3 === n.nodeType && r.onlyZeroWidthSpace(n) && r.isBreak(n.nextSibling) ? n.nextSibling : n;
                                i ? i.nextSibling ? t = r.isBreak(i) && !r.isBreak(e) ? i : i.nextSibling : (d.removeChild(i), t = null) : t = null
                            } else {
                                if (l === o) {
                                    t = this.isEdgePoint(o, a) ? o.nextSibling : o.splitText(a);
                                    let e = l;
                                    this.isEdgePoint(l, s) || (e = l.splitText(s)), d.removeChild(e), 0 === d.childNodes.length && n && (d.innerHTML = "<br>")
                                } else {
                                    const e = this.removeNode(),
                                        i = e.container,
                                        l = e.prevContainer;
                                    if (i && 0 === i.childNodes.length && n && (r.isFormatElement(i) ? i.innerHTML = "<br>" : r.isRangeFormatElement(i) && (i.innerHTML = "<p><br></p>")), !n && l)
                                        if (d = 3 === l.nodeType ? l.parentNode : l, d.contains(i))
                                            for (t = i; t.parentNode === d;) t = t.parentNode;
                                        else t = null;
                                    else d = n ? c : i, t = n ? o : null;
                                    for (; t && t.parentNode !== c;) t = t.parentNode
                                }
                            }
                            try {
                                if (r.isFormatElement(e) || r.isRangeFormatElement(e) || !r.isListCell(d) && r.isComponent(e)) {
                                    const e = d;
                                    if (r.isList(t)) d = t, t = null;
                                    else if (!u && !t) {
                                        const e = this.removeNode(),
                                            n = 3 === e.container.nodeType ? r.isListCell(r.getFormatElement(e.container, null)) ? e.container : r.getFormatElement(e.container, null) || e.container.parentNode : e.container,
                                            i = r.isWysiwygDiv(n) || r.isRangeFormatElement(n);
                                        d = i ? n : n.parentNode, t = i ? null : n.nextSibling
                                    }
                                    0 === e.childNodes.length && d !== e && r.removeItem(e)
                                }!n || r.isRangeFormatElement(d) || r.isListCell(d) || r.isWysiwygDiv(d) || (t = d.nextElementSibling, d = d.parentNode), d.insertBefore(e, t)
                            } catch (t) {
                                d.appendChild(e)
                            } finally {
                                let t = 1;
                                if (3 === e.nodeType) {
                                    const t = e.previousSibling,
                                        n = e.nextSibling,
                                        i = !t || 3 !== t.nodeType || r.onlyZeroWidthSpace(t) ? "" : t.textContent,
                                        l = !n || 3 !== n.nodeType || r.onlyZeroWidthSpace(n) ? "" : n.textContent;
                                    return t && i.length > 0 && (e.textContent = i + e.textContent, r.removeItem(t)), n && n.length > 0 && (e.textContent += l, r.removeItem(n)), {
                                        startOffset: i.length,
                                        endOffset: e.textContent.length - l.length
                                    }
                                }
                                if (!r.isBreak(e) && r.isFormatElement(d)) {
                                    let n = null;
                                    e.previousSibling || (n = r.createTextNode(r.zeroWidthSpace), e.parentNode.insertBefore(n, e)), e.nextSibling || (n = r.createTextNode(r.zeroWidthSpace), e.parentNode.appendChild(n)), r._isIgnoreNodeChange(e) && (e = e.nextSibling, t = 0)
                                }
                                this.setRange(e, t, e, t), this.history.push(!0)
                            }
                        },
                        removeNode: function() {
                            const t = this.getRange();
                            let n, i = 0,
                                l = t.startContainer,
                                s = t.endContainer;
                            const o = t.startOffset,
                                a = t.endOffset,
                                c = t.commonAncestorContainer;
                            let d = null,
                                u = null;
                            const h = r.getListChildNodes(c, null);
                            let g = r.getArrayIndex(h, l),
                                p = r.getArrayIndex(h, s);
                            if (h.length > 0 && g > -1 && p > -1) {
                                for (let e = g + 1, t = l; e >= 0; e--) h[e] === t.parentNode && h[e].firstChild === t && 0 === o && (g = e, t = t.parentNode);
                                for (let e = p - 1, t = s; e > g; e--) h[e] === t.parentNode && 1 === h[e].nodeType && (h.splice(e, 1), t = t.parentNode, --p)
                            } else {
                                if (0 === h.length) {
                                    if (r.isFormatElement(c) || r.isRangeFormatElement(c) || r.isWysiwygDiv(c) || r.isBreak(c) || r.isMedia(c)) return {
                                        container: c,
                                        offset: 0
                                    };
                                    h.push(c), l = s = c
                                } else if (l = s = h[0], r.isBreak(l)) return {
                                    container: l,
                                    offset: 0
                                };
                                g = p = 0
                            }

                            function m(e) {
                                const t = r.getFormatElement(e, null);
                                if (r.removeItem(e), r.isListCell(t)) {
                                    const e = r.getArrayItem(t.children, r.isList, !1);
                                    if (e) {
                                        const n = e.firstElementChild,
                                            i = n.childNodes;
                                        for (; i[0];) t.insertBefore(i[0], e);
                                        r.removeItemAllParents(n, null, null)
                                    }
                                }
                            }
                            for (let e = g; e <= p; e++) {
                                const t = h[e];
                                if (0 === t.length || 3 === t.nodeType && void 0 === t.data) m(t);
                                else if (t !== l) t !== s ? m(t) : (u = 1 === s.nodeType ? r.createTextNode(s.textContent) : r.createTextNode(s.substringData(a, s.length - a)), u.length > 0 ? s.data = u.data : m(s));
                                else if (1 === l.nodeType ? d = r.createTextNode(l.textContent) : t === s ? (d = r.createTextNode(l.substringData(0, o) + s.substringData(a, s.length - a)), i = o) : d = r.createTextNode(l.substringData(0, o)), d.length > 0 ? l.data = d.data : m(l), t === s) break
                            }
                            if (n = s && s.parentNode ? s : l && l.parentNode ? l : t.endContainer || t.startContainer, !r.isWysiwygDiv(n)) {
                                const t = r.removeItemAllParents(n, null, null);
                                t && (n = t.sc || t.ec || e.element.wysiwyg)
                            }
                            return this.setRange(n, i, n, i), this.history.push(!0), {
                                container: n,
                                offset: i,
                                prevContainer: l && l.parentNode ? l : null
                            }
                        },
                        applyRangeFormatElement: function(e) {
                            const t = this.getSelectedElementsAndComponents(!1);
                            if (!t || 0 === t.length) return;
                            e: for (let e, n, i, l, s, o, a = 0, c = t.length; a < c; a++)
                                if (e = t[a], r.isListCell(e))
                                    if (n = e.lastElementChild, n && r.isListCell(e.nextElementSibling) && t.indexOf(e.nextElementSibling) > -1 && (l = n.lastElementChild, t.indexOf(l) > -1)) {
                                        let e = null;
                                        for (; e = l.lastElementChild;)
                                            if (r.isList(e)) {
                                                if (!(t.indexOf(e.lastElementChild) > -1)) continue e;
                                                l = e.lastElementChild
                                            } i = n.firstElementChild, s = t.indexOf(i), o = t.indexOf(l), t.splice(s, o - s + 1), c = t.length
                                    } else;
                            let n, i, l, s = t[t.length - 1];
                            n = r.isRangeFormatElement(s) || r.isFormatElement(s) ? s : r.getRangeFormatElement(s, null) || r.getFormatElement(s, null), r.isCell(n) ? (i = null, l = n) : (i = n.nextSibling, l = n.parentNode);
                            let o = r.getElementDepth(n),
                                a = null;
                            const c = [],
                                d = function(e, t, n) {
                                    let i = null;
                                    if (e !== t && !r.isTable(t)) {
                                        if (t && r.getElementDepth(e) === r.getElementDepth(t)) return n;
                                        i = r.removeItemAllParents(t, null, e)
                                    }
                                    return i ? i.ec : n
                                };
                            for (let n, s, u, h, g, p, m, f = 0, _ = t.length; f < _; f++)
                                if (n = t[f], s = n.parentNode, s && !e.contains(s))
                                    if (u = r.getElementDepth(n), r.isList(s)) {
                                        if (null === a && (p ? (a = p, m = !0, p = null) : a = s.cloneNode(!1)), c.push(n), g = t[f + 1], f === _ - 1 || g && g.parentNode !== s) {
                                            g && n.contains(g.parentNode) && (p = g.parentNode.cloneNode(!1));
                                            let t, f = s.parentNode;
                                            for (; r.isList(f);) t = r.createElement(f.nodeName), t.appendChild(a), a = t, f = f.parentNode;
                                            const _ = this.detachRangeFormatElement(s, c, null, !0, !0);
                                            o >= u ? (o = u, l = _.cc, i = d(l, s, _.ec), i && (l = i.parentNode)) : l === _.cc && (i = _.ec), l !== _.cc && (h = d(l, _.cc, h), i = void 0 !== h ? h : _.cc);
                                            for (let e = 0, t = _.removeArray.length; e < t; e++) a.appendChild(_.removeArray[e]);
                                            m || e.appendChild(a), p && _.removeArray[_.removeArray.length - 1].appendChild(p), a = null, m = !1
                                        }
                                    } else o >= u && (o = u, l = s, i = n.nextSibling), e.appendChild(n), l !== s && (h = d(l, s), void 0 !== h && (i = h));
                            if (this.effectNode = null, r.mergeSameTags(e, null, !1), r.mergeNestedTags(e, function(e) {
                                    return this.isList(e)
                                }.bind(r)), i && r.getElementDepth(i) > 0 && (r.isList(i.parentNode) || r.isList(i.parentNode.parentNode))) {
                                const t = r.getParentElement(i, function(e) {
                                        return this.isRangeFormatElement(e) && !this.isList(e)
                                    }.bind(r)),
                                    n = r.splitElement(i, null, t ? r.getElementDepth(t) + 1 : 0);
                                n.parentNode.insertBefore(e, n)
                            } else l.insertBefore(e, i), d(e, i);
                            const u = r.getEdgeChildNodes(e.firstElementChild, e.lastElementChild);
                            t.length > 1 ? this.setRange(u.sc, 0, u.ec, u.ec.textContent.length) : this.setRange(u.ec, u.ec.textContent.length, u.ec, u.ec.textContent.length), this.history.push(!1)
                        },
                        detachRangeFormatElement: function(e, t, n, i, l) {
                            const s = this.getRange(),
                                o = s.startOffset,
                                a = s.endOffset;
                            let c = r.getListChildNodes(e, (function(t) {
                                    return t.parentNode === e
                                })),
                                d = e.parentNode,
                                u = null,
                                h = null,
                                g = e.cloneNode(!1);
                            const p = [],
                                m = r.isList(n);
                            let f = !1,
                                _ = !1,
                                b = !1;

                            function v(t, n, i, l) {
                                if (r.onlyZeroWidthSpace(n) && (n.innerHTML = r.zeroWidthSpace), 3 === n.nodeType) return t.insertBefore(n, i), n;
                                const s = (b ? n : l).childNodes;
                                let o = n.cloneNode(!1),
                                    a = null,
                                    c = null;
                                for (; s[0];) c = s[0], !r._notTextNode(c) || r.isBreak(c) || r.isListCell(o) ? o.appendChild(c) : (o.childNodes.length > 0 && (a || (a = o), t.insertBefore(o, i), o = n.cloneNode(!1)), t.insertBefore(c, i), a || (a = c));
                                if (o.childNodes.length > 0) {
                                    if (r.isListCell(t) && r.isListCell(o) && r.isList(i))
                                        if (m) {
                                            for (a = i; i;) o.appendChild(i), i = i.nextSibling;
                                            t.parentNode.insertBefore(o, t.nextElementSibling)
                                        } else {
                                            const t = l.nextElementSibling,
                                                n = r.detachNestedList(l, !1);
                                            e === n && t === l.nextElementSibling || (e = n, _ = !0)
                                        }
                                    else t.insertBefore(o, i);
                                    a || (a = o)
                                }
                                return a
                            }
                            for (let l, s, o, a = 0, y = c.length; a < y; a++)
                                if (l = c[a], b = !1, i && 0 === a && (u = t && t.length !== y && t[0] !== l ? g : e.previousSibling), t && (s = t.indexOf(l)), t && -1 === s) g || (g = e.cloneNode(!1)), g.appendChild(l);
                                else {
                                    if (t && (o = t[s + 1]), g && g.children.length > 0 && (d.insertBefore(g, e), g = null), !m && r.isListCell(l))
                                        if (o && r.getElementDepth(l) !== r.getElementDepth(o) && (r.isListCell(d) || r.getArrayItem(l.children, r.isList, !1))) {
                                            const t = l.nextElementSibling,
                                                n = r.detachNestedList(l, !1);
                                            e === n && t === l.nextElementSibling || (e = n, _ = !0)
                                        } else {
                                            const t = l;
                                            l = r.createElement(i ? t.nodeName : r.isList(e.parentNode) || r.isListCell(e.parentNode) ? "LI" : r.isCell(e.parentNode) ? "DIV" : "P");
                                            const n = r.isListCell(l),
                                                s = t.childNodes;
                                            for (; s[0] && (!r.isList(s[0]) || n);) l.appendChild(s[0]);
                                            r.copyFormatAttributes(l, t), b = !0
                                        }
                                    else l = l.cloneNode(!1);
                                    if (_) {
                                        _ = b = !1, c = r.getListChildNodes(e, (function(t) {
                                            return t.parentNode === e
                                        })), g = e.cloneNode(!1), d = e.parentNode, a = -1, y = c.length;
                                        continue
                                    }
                                    i ? (p.push(l), r.removeItem(c[a])) : (n ? (f || (d.insertBefore(n, e), f = !0), l = v(n, l, null, c[a])) : l = v(d, l, e, c[a]), t ? (h = l, u || (u = l)) : u || (u = h = l))
                                } const y = e.parentNode;
                            let x = e.nextSibling;
                            g && g.children.length > 0 && y.insertBefore(g, x), n ? u = n.previousSibling : u || (u = e.previousSibling), x = e.nextSibling, 0 === e.children.length || 0 === e.textContent.length ? r.removeItem(e) : r.removeEmptyNode(e, null);
                            let C = null;
                            if (i) C = {
                                cc: y,
                                sc: u,
                                ec: x,
                                removeArray: p
                            };
                            else {
                                u || (u = h), h || (h = u);
                                const e = r.getEdgeChildNodes(u, h.parentNode ? u : h);
                                C = {
                                    cc: (e.sc || e.ec).parentNode,
                                    sc: e.sc,
                                    ec: e.ec
                                }
                            }
                            if (this.effectNode = null, l) return C;
                            !i && C && (t ? this.setRange(C.sc, o, C.ec, a) : this.setRange(C.sc, 0, C.sc, 0)), this.history.push(!1)
                        },
                        detachList: function(e, t) {
                            let n = {},
                                i = !1,
                                l = !1,
                                s = null,
                                o = null;
                            const a = function(e) {
                                return !this.isComponent(e)
                            }.bind(r);
                            for (let c, d, u, h, g = 0, p = e.length; g < p; g++) {
                                if (u = g === p - 1, d = r.getRangeFormatElement(e[g], a), h = r.isList(d), !c && h) c = d, n = {
                                    r: c,
                                    f: [r.getParentElement(e[g], "LI")]
                                }, 0 === g && (i = !0);
                                else if (c && h)
                                    if (c !== d) {
                                        const a = this.detachRangeFormatElement(n.f[0].parentNode, n.f, null, t, !0);
                                        d = e[g].parentNode, i && (s = a.sc, i = !1), u && (o = a.ec), h ? (c = d, n = {
                                            r: c,
                                            f: [r.getParentElement(e[g], "LI")]
                                        }, u && (l = !0)) : c = null
                                    } else n.f.push(r.getParentElement(e[g], "LI")), u && (l = !0);
                                if (u && r.isList(c)) {
                                    const e = this.detachRangeFormatElement(n.f[0].parentNode, n.f, null, t, !0);
                                    (l || 1 === p) && (o = e.ec), i && (s = e.sc || o)
                                }
                            }
                            return {
                                sc: s,
                                ec: o
                            }
                        },
                        nodeChange: function(e, t, n, i) {
                            let l = this.getRange();
                            t = !!(t && t.length > 0) && t, n = !!(n && n.length > 0) && n;
                            const s = !e,
                                o = s && !n && !t;
                            let c = l.startContainer,
                                d = l.startOffset,
                                u = l.endContainer,
                                h = l.endOffset;
                            if (o && l.collapsed && r.isFormatElement(c.parentNode) && r.isFormatElement(u.parentNode) || c === u && 1 === c.nodeType && "false" === c.getAttribute("contenteditable")) return;
                            if (l.collapsed && !o && 1 === c.nodeType && !r.isBreak(c)) {
                                let e = null;
                                const t = c.childNodes[d];
                                t && (t.nextSibling ? e = r.isBreak(t) ? t : t.nextSibling : (c.removeChild(t), e = null));
                                const n = r.createTextNode(r.zeroWidthSpace);
                                c.insertBefore(n, e), this.setRange(n, 1, n, 1), l = this.getRange(), c = l.startContainer, d = l.startOffset, u = l.endContainer, h = l.endOffset
                            }
                            r.isFormatElement(c) && (c = c.childNodes[d], d = 0), r.isFormatElement(u) && (u = u.childNodes[h], h = u.textContent.length), s && (e = r.createElement("DIV"));
                            const g = e.nodeName;
                            if (!o && c === u && !n && e) {
                                let t = c,
                                    n = 0;
                                const i = [],
                                    l = e.style;
                                for (let e = 0, t = l.length; e < t; e++) i.push(l[e]);
                                const o = e.classList;
                                for (let e = 0, t = o.length; e < t; e++) i.push("." + o[e]);
                                if (i.length > 0) {
                                    for (; !r.isFormatElement(t) && !r.isWysiwygDiv(t);) {
                                        for (let l = 0; l < i.length; l++)
                                            if (1 === t.nodeType) {
                                                const o = i[l],
                                                    r = !!/^\./.test(o) && new a.RegExp("\\s*" + o.replace(/^\./, "") + "(\\s+|$)", "ig"),
                                                    c = s ? !!t.style[o] : !!t.style[o] && !!e.style[o] && t.style[o] === e.style[o],
                                                    d = !1 !== r && (s ? !!t.className.match(r) : !!t.className.match(r) && !!e.className.match(r));
                                                (c || d) && n++
                                            } t = t.parentNode
                                    }
                                    if (n >= i.length) return
                                }
                            }
                            let p, m = {},
                                f = {},
                                _ = "",
                                b = "",
                                v = "";
                            if (t) {
                                for (let e, n = 0, i = t.length; n < i; n++) e = t[n], /^\./.test(e) ? b += (b ? "|" : "\\s*(?:") + e.replace(/^\./, "") : _ += (_ ? "|" : "(?:;|^|\\s)(?:") + e;
                                _ && (_ += ")\\s*:[^;]*\\s*(?:;|$)", _ = new a.RegExp(_, "ig")), b && (b += ")(?=\\s+|$)", b = new a.RegExp(b, "ig"))
                            }
                            if (n) {
                                v = "^(?:" + n[0];
                                for (let e = 1; e < n.length; e++) v += "|" + n[e];
                                v += ")$", v = new a.RegExp(v, "i")
                            }
                            const y = {
                                    v: !1
                                },
                                x = function(e) {
                                    const t = e.cloneNode(!1);
                                    if (3 === t.nodeType || r.isBreak(t)) return t;
                                    if (o) return null;
                                    const n = !v && s || v && v.test(t.nodeName);
                                    if (n && !i) return y.v = !0, null;
                                    const l = t.style.cssText;
                                    let c = "";
                                    _ && l.length > 0 && (c = l.replace(_, "").trim(), c !== l && (y.v = !0));
                                    const d = t.className;
                                    let u = "";
                                    return b && d.length > 0 && (u = d.replace(b, "").trim(), u !== d && (y.v = !0)), (!s || !b && d || !_ && l || c || u || !n) && (c || u || t.nodeName !== g || a.Boolean(_) !== a.Boolean(l) || a.Boolean(b) !== a.Boolean(d)) ? (_ && l.length > 0 && (t.style.cssText = c), t.style.cssText || t.removeAttribute("style"), b && d.length > 0 && (t.className = u.trim()), t.className.trim() || t.removeAttribute("class"), t.style.cssText || t.className || t.nodeName !== g && !n ? t : (y.v = !0, null)) : (y.v = !0, null)
                                },
                                C = this.getSelectedElements(null);
                            l = this.getRange(), c = l.startContainer, d = l.startOffset, u = l.endContainer, h = l.endOffset, r.getFormatElement(c, null) || (c = r.getChildElement(C[0], (function(e) {
                                return 3 === e.nodeType
                            }), !1), d = 0), r.getFormatElement(u, null) || (u = r.getChildElement(C[C.length - 1], (function(e) {
                                return 3 === e.nodeType
                            }), !1), h = u.textContent.length);
                            const w = r.getFormatElement(c, null) === r.getFormatElement(u, null),
                                E = C.length - (w ? 0 : 1);
                            p = e.cloneNode(!1);
                            const N = o || s && function(e, t) {
                                    for (let n = 0, i = e.length; n < i; n++)
                                        if (t(e[n])) return !0;
                                    return !1
                                }(n, r._isMaintainedNode),
                                S = this._util_getMaintainedNode.bind(r, N),
                                T = this._util_isMaintainedNode.bind(r, N);
                            if (w) {
                                const e = this._nodeChange_oneLine(C[0], p, x, c, d, u, h, o, s, l.collapsed, y, S, T);
                                m.container = e.startContainer, m.offset = e.startOffset, f.container = e.endContainer, f.offset = e.endOffset, m.container === f.container && r.zeroWidthRegExp.test(m.container.textContent) && (m.offset = f.offset = 1)
                            } else {
                                E > 0 && (p = e.cloneNode(!1), f = this._nodeChange_endLine(C[E], p, x, u, h, o, s, y, S, T));
                                for (let t = E - 1; t > 0; t--) p = e.cloneNode(!1), this._nodeChange_middleLine(C[t], p, x, o, s, y);
                                p = e.cloneNode(!1), m = this._nodeChange_startLine(C[0], p, x, c, d, o, s, y, S, T), E <= 0 ? f = m : f.container || (f.container = m.container, f.offset = m.container.textContent.length)
                            }
                            this.controllersOff(), this.setRange(m.container, m.offset, f.container, f.offset), this.history.push(!1)
                        },
                        _stripRemoveNode: function(e) {
                            const t = e.parentNode;
                            if (!e || 3 === e.nodeType || !t) return;
                            const n = e.childNodes;
                            for (; n[0];) t.insertBefore(n[0], e);
                            t.removeChild(e)
                        },
                        _util_getMaintainedNode: function(e, t) {
                            return t && !e ? this.getParentElement(t, function(e) {
                                return this._isMaintainedNode(e)
                            }.bind(this)) : null
                        },
                        _util_isMaintainedNode: function(e, t) {
                            return t && !e && 3 !== t.nodeType && this._isMaintainedNode(t)
                        },
                        _nodeChange_oneLine: function(e, t, n, i, l, s, o, c, d, u, h, g, p) {
                            let m = i.parentNode;
                            for (; !(m.nextSibling || m.previousSibling || r.isFormatElement(m.parentNode) || r.isWysiwygDiv(m.parentNode)) && m.nodeName !== t.nodeName;) m = m.parentNode;
                            if (!d && m === s.parentNode && m.nodeName === t.nodeName && r.onlyZeroWidthSpace(i.textContent.slice(0, l)) && r.onlyZeroWidthSpace(s.textContent.slice(o))) {
                                const e = m.childNodes;
                                let n = !0;
                                for (let t, l, o, a, c = 0, d = e.length; c < d; c++)
                                    if (t = e[c], a = !r.onlyZeroWidthSpace(t), t !== i)
                                        if (t !== s) {
                                            if (!l && a || l && o && a) {
                                                n = !1;
                                                break
                                            }
                                        } else o = !0;
                                else l = !0;
                                if (n) return r.copyTagAttributes(m, t), {
                                    startContainer: i,
                                    startOffset: l,
                                    endContainer: s,
                                    endOffset: o
                                }
                            }
                            h.v = !1;
                            const f = e,
                                _ = [t],
                                b = e.cloneNode(!1),
                                v = i === s;
                            let y, x, C, w, E, N = i,
                                S = l,
                                T = s,
                                L = o,
                                k = !1,
                                z = !1;

                            function A(e) {
                                const t = new a.RegExp("(?:;|^|\\s)(?:" + w + "null)\\s*:[^;]*\\s*(?:;|$)", "ig");
                                let n = "";
                                return t && e.style.cssText.length > 0 && (n = t.test(e.style.cssText)), !n
                            }
                            if (function e(i, l) {
                                    const s = i.childNodes;
                                    for (let i, o = 0, a = s.length; o < a; o++) {
                                        let a = s[o];
                                        if (!a) continue;
                                        let d, h = l;
                                        if (!k && a === N) {
                                            let e = b;
                                            E = g(a);
                                            const s = r.createTextNode(1 === N.nodeType ? "" : N.substringData(0, S)),
                                                o = r.createTextNode(1 === N.nodeType ? "" : N.substringData(S, v && L >= S ? L - S : N.data.length - S));
                                            if (E) {
                                                const t = g(l);
                                                if (t && t.parentNode !== e) {
                                                    let n = t,
                                                        i = null;
                                                    for (; n.parentNode !== e;) {
                                                        for (l = i = n.parentNode.cloneNode(!1); n.childNodes[0];) i.appendChild(n.childNodes[0]);
                                                        n.appendChild(i), n = n.parentNode
                                                    }
                                                    n.parentNode.appendChild(t)
                                                }
                                                E = E.cloneNode(!1)
                                            }
                                            r.onlyZeroWidthSpace(s) || l.appendChild(s);
                                            const c = g(l);
                                            for (c && (E = c), E && (e = E), x = a, y = [], w = ""; x !== e && x !== f && null !== x;) i = p(x) ? null : n(x), i && 1 === x.nodeType && A(x) && (y.push(i), w += x.style.cssText.substr(0, x.style.cssText.indexOf(":")) + "|"), x = x.parentNode;
                                            const d = y.pop() || o;
                                            for (C = x = d; y.length > 0;) x = y.pop(), C.appendChild(x), C = x;
                                            if (t.appendChild(d), e.appendChild(t), E && !g(T) && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), N = o, S = 0, k = !0, x !== o && x.appendChild(N), !v) continue
                                        }
                                        if (z || a !== T) {
                                            if (k) {
                                                if (1 === a.nodeType && !r.isBreak(a)) {
                                                    r._isIgnoreNodeChange(a) ? (b.appendChild(a.cloneNode(!0)), u || (t = t.cloneNode(!1), b.appendChild(t), _.push(t))) : e(a, a);
                                                    continue
                                                }
                                                x = a, y = [], w = "";
                                                const s = [];
                                                for (; null !== x.parentNode && x !== f && x !== t;) i = z ? x.cloneNode(!1) : n(x), 1 === x.nodeType && !r.isBreak(a) && i && A(x) && (i && (p(i) ? E || s.push(i) : y.push(i)), w += x.style.cssText.substr(0, x.style.cssText.indexOf(":")) + "|"), x = x.parentNode;
                                                y = y.concat(s);
                                                const o = y.pop() || a;
                                                for (C = x = o; y.length > 0;) x = y.pop(), C.appendChild(x), C = x;
                                                if (p(t.parentNode) && !p(o) && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), z || E || !p(o)) o === a ? l = z ? b : t : z ? (b.appendChild(o), l = x) : (t.appendChild(o), l = x);
                                                else {
                                                    t = t.cloneNode(!1);
                                                    const e = o.childNodes;
                                                    for (let n = 0, i = e.length; n < i; n++) t.appendChild(e[n]);
                                                    o.appendChild(t), b.appendChild(o), _.push(t), l = t.children.length > 0 ? x : t
                                                }
                                                if (E && 3 === a.nodeType)
                                                    if (g(a)) {
                                                        const e = r.getParentElement(l, function(e) {
                                                            return this._isMaintainedNode(e.parentNode) || e.parentNode === b
                                                        }.bind(r));
                                                        E.appendChild(e), t = e.cloneNode(!1), _.push(t), b.appendChild(t)
                                                    } else E = null
                                            }
                                            d = a.cloneNode(!1), l.appendChild(d), 1 !== a.nodeType || r.isBreak(a) || (h = d), e(a, h)
                                        } else {
                                            E = g(a);
                                            const e = r.createTextNode(1 === T.nodeType ? "" : T.substringData(L, T.length - L)),
                                                l = r.createTextNode(v || 1 === T.nodeType ? "" : T.substringData(0, L));
                                            if (E ? E = E.cloneNode(!1) : p(t.parentNode) && !E && (t = t.cloneNode(!1), b.appendChild(t), _.push(t)), !r.onlyZeroWidthSpace(e)) {
                                                x = a, w = "", y = [];
                                                const t = [];
                                                for (; x !== b && x !== f && null !== x;) 1 === x.nodeType && A(x) && (p(x) ? t.push(x.cloneNode(!1)) : y.push(x.cloneNode(!1)), w += x.style.cssText.substr(0, x.style.cssText.indexOf(":")) + "|"), x = x.parentNode;
                                                for (y = y.concat(t), d = C = x = y.pop() || e; y.length > 0;) x = y.pop(), C.appendChild(x), C = x;
                                                b.appendChild(d), x.textContent = e.data
                                            }
                                            if (E && d) {
                                                const e = g(d);
                                                e && (E = e)
                                            }
                                            for (x = a, y = [], w = ""; x !== b && x !== f && null !== x;) i = p(x) ? null : n(x), i && 1 === x.nodeType && A(x) && (y.push(i), w += x.style.cssText.substr(0, x.style.cssText.indexOf(":")) + "|"), x = x.parentNode;
                                            const s = y.pop() || l;
                                            for (C = x = s; y.length > 0;) x = y.pop(), C.appendChild(x), C = x;
                                            E ? ((t = t.cloneNode(!1)).appendChild(s), E.insertBefore(t, E.firstChild), b.appendChild(E), _.push(t), E = null) : t.appendChild(s), T = l, L = l.data.length, z = !0, !c && u && (t = l, l.textContent = r.zeroWidthSpace), x !== l && x.appendChild(T)
                                        }
                                    }
                                }(e, b), d && !c && !h.v) return {
                                startContainer: i,
                                startOffset: l,
                                endContainer: s,
                                endOffset: o
                            };
                            if (c = c && d)
                                for (let e = 0; e < _.length; e++) {
                                    let t, n, i, l = _[e];
                                    if (u) t = r.createTextNode(r.zeroWidthSpace), b.replaceChild(t, l);
                                    else {
                                        const e = l.childNodes;
                                        for (n = e[0]; e[0];) i = e[0], b.insertBefore(i, l);
                                        r.removeItem(l)
                                    }
                                    0 === e && (u ? N = T = t : (N = n, T = i))
                                } else {
                                    if (d)
                                        for (let e = 0; e < _.length; e++) this._stripRemoveNode(_[e]);
                                    u && (N = T = t)
                                }
                            r.removeEmptyNode(b, t), u && (S = N.textContent.length, L = T.textContent.length);
                            const B = c || 0 === T.textContent.length;
                            r.isBreak(T) || 0 !== T.textContent.length || (r.removeItem(T), T = N), L = B ? T.textContent.length : L;
                            const H = {
                                    s: 0,
                                    e: 0
                                },
                                M = r.getNodePath(N, b, H),
                                I = !T.parentNode;
                            I && (T = N);
                            const R = {
                                    s: 0,
                                    e: 0
                                },
                                D = r.getNodePath(T, b, I || B ? null : R);
                            S += H.s, L = u ? S : I ? N.textContent.length : B ? L + H.s : L + R.s;
                            const O = r.mergeSameTags(b, [M, D], !0);
                            return e.parentNode.replaceChild(b, e), N = r.getNodeFromPath(M, b), T = r.getNodeFromPath(D, b), {
                                startContainer: N,
                                startOffset: S + O[0],
                                endContainer: T,
                                endOffset: L + O[1]
                            }
                        },
                        _nodeChange_startLine: function(e, t, n, i, l, s, o, a, c, d) {
                            let u = i.parentNode;
                            for (; !(u.nextSibling || u.previousSibling || r.isFormatElement(u.parentNode) || r.isWysiwygDiv(u.parentNode)) && u.nodeName !== t.nodeName;) u = u.parentNode;
                            if (!o && u.nodeName === t.nodeName && !r.isFormatElement(u) && !u.nextSibling && r.onlyZeroWidthSpace(i.textContent.slice(0, l))) {
                                let e = !0,
                                    n = i.previousSibling;
                                for (; n;) {
                                    if (!r.onlyZeroWidthSpace(n)) {
                                        e = !1;
                                        break
                                    }
                                    n = n.previousSibling
                                }
                                if (e) return r.copyTagAttributes(u, t), {
                                    container: i,
                                    offset: l
                                }
                            }
                            a.v = !1;
                            const h = e,
                                g = [t],
                                p = e.cloneNode(!1);
                            let m, f, _, b, v = i,
                                y = l,
                                x = !1;
                            if (function e(i, l) {
                                    const s = i.childNodes;
                                    for (let i, o = 0, a = s.length; o < a; o++) {
                                        const a = s[o];
                                        if (!a) continue;
                                        let u = l;
                                        if (x && !r.isBreak(a)) {
                                            if (1 === a.nodeType) {
                                                r._isIgnoreNodeChange(a) ? (t = t.cloneNode(!1), p.appendChild(a.cloneNode(!0)), p.appendChild(t), g.push(t)) : e(a, a);
                                                continue
                                            }
                                            f = a, m = [];
                                            const s = [];
                                            for (; null !== f.parentNode && f !== h && f !== t;) i = n(f), 1 === f.nodeType && i && (d(i) ? b || s.push(i) : m.push(i)), f = f.parentNode;
                                            m = m.concat(s);
                                            const o = m.length > 0,
                                                u = m.pop() || a;
                                            for (_ = f = u; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            if (d(t.parentNode) && !d(u) && (t = t.cloneNode(!1), p.appendChild(t), g.push(t)), !b && d(u)) {
                                                t = t.cloneNode(!1);
                                                const e = u.childNodes;
                                                for (let n = 0, i = e.length; n < i; n++) t.appendChild(e[n]);
                                                u.appendChild(t), p.appendChild(u), l = d(f) ? t : f, g.push(t)
                                            } else o ? (t.appendChild(u), l = f) : l = t;
                                            if (b && 3 === a.nodeType)
                                                if (c(a)) {
                                                    const e = r.getParentElement(l, function(e) {
                                                        return this._isMaintainedNode(e.parentNode) || e.parentNode === p
                                                    }.bind(r));
                                                    b.appendChild(e), t = e.cloneNode(!1), g.push(t), p.appendChild(t)
                                                } else b = null
                                        }
                                        if (x || a !== v) i = x ? n(a) : a.cloneNode(!1), i && (l.appendChild(i), 1 !== a.nodeType || r.isBreak(a) || (u = i)), e(a, u);
                                        else {
                                            let e = p;
                                            b = c(a);
                                            const s = r.createTextNode(1 === v.nodeType ? "" : v.substringData(0, y)),
                                                o = r.createTextNode(1 === v.nodeType ? "" : v.substringData(y, v.length - y));
                                            if (b) {
                                                const t = c(l);
                                                if (t && t.parentNode !== e) {
                                                    let n = t,
                                                        i = null;
                                                    for (; n.parentNode !== e;) {
                                                        for (l = i = n.parentNode.cloneNode(!1); n.childNodes[0];) i.appendChild(n.childNodes[0]);
                                                        n.appendChild(i), n = n.parentNode
                                                    }
                                                    n.parentNode.appendChild(t)
                                                }
                                                b = b.cloneNode(!1)
                                            }
                                            r.onlyZeroWidthSpace(s) || l.appendChild(s);
                                            const d = c(l);
                                            for (d && (b = d), b && (e = b), f = l, m = []; f !== e && null !== f;) i = n(f), 1 === f.nodeType && i && m.push(i), f = f.parentNode;
                                            const u = m.pop() || l;
                                            for (_ = f = u; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            u !== l ? (t.appendChild(u), l = f) : l = t, r.isBreak(a) && t.appendChild(a.cloneNode(!1)), e.appendChild(t), v = o, y = 0, x = !0, l.appendChild(v)
                                        }
                                    }
                                }(e, p), o && !s && !a.v) return {
                                container: i,
                                offset: l
                            };
                            if (s = s && o)
                                for (let e = 0; e < g.length; e++) {
                                    let t = g[e];
                                    const n = t.childNodes,
                                        i = n[0];
                                    for (; n[0];) p.insertBefore(n[0], t);
                                    r.removeItem(t), 0 === e && (v = i)
                                } else if (o)
                                    for (let e = 0; e < g.length; e++) this._stripRemoveNode(g[e]);
                            if (s || 0 !== p.childNodes.length) {
                                r.removeEmptyNode(p, t), r.onlyZeroWidthSpace(p.textContent) && (v = p.firstChild, y = 0);
                                const n = {
                                        s: 0,
                                        e: 0
                                    },
                                    i = r.getNodePath(v, p, n);
                                y += n.s;
                                const l = r.mergeSameTags(p, [i], !0);
                                e.parentNode.replaceChild(p, e), v = r.getNodeFromPath(i, p), y += l[0]
                            } else e.childNodes ? v = e.childNodes[0] : (v = r.createTextNode(r.zeroWidthSpace), e.appendChild(v));
                            return {
                                container: v,
                                offset: y
                            }
                        },
                        _nodeChange_middleLine: function(e, t, n, i, l, s) {
                            if (!l) {
                                const n = e.cloneNode(!0),
                                    i = t.nodeName,
                                    l = t.style.cssText,
                                    s = t.className;
                                let o, a = n.childNodes,
                                    c = 0,
                                    d = a.length;
                                for (; c < d && (o = a[c], 3 !== o.nodeType); c++) {
                                    if (o.nodeName !== i) {
                                        if (!r.isBreak(o) && r._isIgnoreNodeChange(o)) continue;
                                        if (1 === d) {
                                            a = o.childNodes, d = a.length, c = -1;
                                            continue
                                        }
                                        break
                                    }
                                    o.style.cssText += l, r.addClass(o, s)
                                }
                                if (d > 0 && c === d) return void(e.innerHTML = n.innerHTML)
                            }
                            s.v = !1;
                            const o = e.cloneNode(!1),
                                a = [t];
                            let c = !0;
                            if (function e(i, l) {
                                    const s = i.childNodes;
                                    for (let i, d = 0, u = s.length; d < u; d++) {
                                        let u = s[d];
                                        if (!u) continue;
                                        let h = l;
                                        r.isBreak(u) || !r._isIgnoreNodeChange(u) ? (i = n(u), i && (c = !1, l.appendChild(i), 1 === u.nodeType && (h = i)), r.isBreak(u) || e(u, h)) : (t.childNodes.length > 0 && (o.appendChild(t), t = t.cloneNode(!1)), o.appendChild(u.cloneNode(!0)), o.appendChild(t), a.push(t), l = t)
                                    }
                                }(e, t), !c && (!l || i || s.v)) {
                                if (o.appendChild(t), i && l)
                                    for (let e = 0; e < a.length; e++) {
                                        let t = a[e];
                                        const n = t.childNodes;
                                        for (; n[0];) o.insertBefore(n[0], t);
                                        r.removeItem(t)
                                    } else if (l)
                                        for (let e = 0; e < a.length; e++) this._stripRemoveNode(a[e]);
                                r.removeEmptyNode(o, t), r.mergeSameTags(o, null, !0), e.parentNode.replaceChild(o, e)
                            }
                        },
                        _nodeChange_endLine: function(e, t, n, i, l, s, o, a, c, d) {
                            let u = i.parentNode;
                            for (; !(u.nextSibling || u.previousSibling || r.isFormatElement(u.parentNode) || r.isWysiwygDiv(u.parentNode)) && u.nodeName !== t.nodeName;) u = u.parentNode;
                            if (!o && u.nodeName === t.nodeName && !r.isFormatElement(u) && !u.previousSibling && r.onlyZeroWidthSpace(i.textContent.slice(l))) {
                                let e = !0,
                                    n = i.nextSibling;
                                for (; n;) {
                                    if (!r.onlyZeroWidthSpace(n)) {
                                        e = !1;
                                        break
                                    }
                                    n = n.nextSibling
                                }
                                if (e) return r.copyTagAttributes(u, t), {
                                    container: i,
                                    offset: l
                                }
                            }
                            a.v = !1;
                            const h = e,
                                g = [t],
                                p = e.cloneNode(!1);
                            let m, f, _, b, v = i,
                                y = l,
                                x = !1;
                            if (function e(i, l) {
                                    const s = i.childNodes;
                                    for (let i, o = s.length - 1; 0 <= o; o--) {
                                        const a = s[o];
                                        if (!a) continue;
                                        let u = l;
                                        if (x && !r.isBreak(a)) {
                                            if (1 === a.nodeType) {
                                                if (r._isIgnoreNodeChange(a)) {
                                                    t = t.cloneNode(!1);
                                                    const e = a.cloneNode(!0);
                                                    p.insertBefore(e, l), p.insertBefore(t, e), g.push(t)
                                                } else e(a, a);
                                                continue
                                            }
                                            f = a, m = [];
                                            const s = [];
                                            for (; null !== f.parentNode && f !== h && f !== t;) i = n(f), i && 1 === f.nodeType && (d(i) ? b || s.push(i) : m.push(i)), f = f.parentNode;
                                            m = m.concat(s);
                                            const o = m.length > 0,
                                                u = m.pop() || a;
                                            for (_ = f = u; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            if (d(t.parentNode) && !d(u) && (t = t.cloneNode(!1), p.insertBefore(t, p.firstChild), g.push(t)), !b && d(u)) {
                                                t = t.cloneNode(!1);
                                                const e = u.childNodes;
                                                for (let n = 0, i = e.length; n < i; n++) t.appendChild(e[n]);
                                                u.appendChild(t), p.insertBefore(u, p.firstChild), g.push(t), l = t.children.length > 0 ? f : t
                                            } else o ? (t.insertBefore(u, t.firstChild), l = f) : l = t;
                                            if (b && 3 === a.nodeType)
                                                if (c(a)) {
                                                    const e = r.getParentElement(l, function(e) {
                                                        return this._isMaintainedNode(e.parentNode) || e.parentNode === p
                                                    }.bind(r));
                                                    b.appendChild(e), t = e.cloneNode(!1), g.push(t), p.insertBefore(t, p.firstChild)
                                                } else b = null
                                        }
                                        if (x || a !== v) i = x ? n(a) : a.cloneNode(!1), i && (l.insertBefore(i, l.firstChild), 1 !== a.nodeType || r.isBreak(a) || (u = i)), e(a, u);
                                        else {
                                            b = c(a);
                                            const e = r.createTextNode(1 === v.nodeType ? "" : v.substringData(y, v.length - y)),
                                                s = r.createTextNode(1 === v.nodeType ? "" : v.substringData(0, y));
                                            if (b) {
                                                b = b.cloneNode(!1);
                                                const e = c(l);
                                                if (e && e.parentNode !== p) {
                                                    let t = e,
                                                        n = null;
                                                    for (; t.parentNode !== p;) {
                                                        for (l = n = t.parentNode.cloneNode(!1); t.childNodes[0];) n.appendChild(t.childNodes[0]);
                                                        t.appendChild(n), t = t.parentNode
                                                    }
                                                    t.parentNode.insertBefore(e, t.parentNode.firstChild)
                                                }
                                                b = b.cloneNode(!1)
                                            } else d(t.parentNode) && !b && (t = t.cloneNode(!1), p.appendChild(t), g.push(t));
                                            for (r.onlyZeroWidthSpace(e) || l.insertBefore(e, l.firstChild), f = l, m = []; f !== p && null !== f;) i = d(f) ? null : n(f), i && 1 === f.nodeType && m.push(i), f = f.parentNode;
                                            const o = m.pop() || l;
                                            for (_ = f = o; m.length > 0;) f = m.pop(), _.appendChild(f), _ = f;
                                            o !== l ? (t.insertBefore(o, t.firstChild), l = f) : l = t, r.isBreak(a) && t.appendChild(a.cloneNode(!1)), b ? (b.insertBefore(t, b.firstChild), p.insertBefore(b, p.firstChild), b = null) : p.insertBefore(t, p.firstChild), v = s, y = s.data.length, x = !0, l.insertBefore(v, l.firstChild)
                                        }
                                    }
                                }(e, p), o && !s && !a.v) return {
                                container: i,
                                offset: l
                            };
                            if (s = s && o)
                                for (let e = 0; e < g.length; e++) {
                                    let t = g[e];
                                    const n = t.childNodes;
                                    let i = null;
                                    for (; n[0];) i = n[0], p.insertBefore(i, t);
                                    r.removeItem(t), e === g.length - 1 && (v = i, y = i.textContent.length)
                                } else if (o)
                                    for (let e = 0; e < g.length; e++) this._stripRemoveNode(g[e]);
                            if (s || 0 !== p.childNodes.length) {
                                if (!o && 0 === t.textContent.length) return r.removeEmptyNode(p, null), {
                                    container: null,
                                    offset: 0
                                };
                                r.removeEmptyNode(p, t), r.onlyZeroWidthSpace(p.textContent) ? (v = p.firstChild, y = v.textContent.length) : r.onlyZeroWidthSpace(v) && (v = t, y = 1);
                                const n = {
                                        s: 0,
                                        e: 0
                                    },
                                    i = r.getNodePath(v, p, n);
                                y += n.s;
                                const l = r.mergeSameTags(p, [i], !0);
                                e.parentNode.replaceChild(p, e), v = r.getNodeFromPath(i, p), y += l[0]
                            } else e.childNodes ? v = e.childNodes[0] : (v = r.createTextNode(r.zeroWidthSpace), e.appendChild(v));
                            return {
                                container: v,
                                offset: y
                            }
                        },
                        actionCall: function(e, t, n) {
                            if (t) {
                                if (/submenu/.test(t) && (null === n.nextElementSibling || n !== this.submenuActiveButton)) return void this.callPlugin(e, this.submenuOn.bind(this, n), n);
                                if (/dialog/.test(t)) return void this.callPlugin(e, this.plugins[e].open.bind(this), n);
                                if (/command/.test(t)) this.callPlugin(e, this.plugins[e].action.bind(this), n);
                                else if (/container/.test(t) && (null === n.nextElementSibling || n !== this.containerActiveButton)) return void this.callPlugin(e, this.containerOn.bind(this, n), n)
                            } else e && this.commandHandler(n, e);
                            /submenu/.test(t) ? this.submenuOff() : (this.submenuOff(), this.containerOff())
                        },
                        commandHandler: function(t, n) {
                            switch (n) {
                                case "selectAll":
                                    const i = e.element.wysiwyg,
                                        s = r.getChildElement(i.firstChild, (function(e) {
                                            return 0 === e.childNodes.length || 3 === e.nodeType
                                        }), !1) || i.firstChild,
                                        o = r.getChildElement(i.lastChild, (function(e) {
                                            return 0 === e.childNodes.length || 3 === e.nodeType
                                        }), !0) || i.lastChild;
                                    if (!s || !o) return;
                                    this.setRange(s, 0, o, o.textContent.length), this.focus();
                                    break;
                                case "codeView":
                                    r.toggleClass(t, "active"), this.toggleCodeView();
                                    break;
                                case "fullScreen":
                                    r.toggleClass(t, "active"), this.toggleFullScreen(t);
                                    break;
                                case "indent":
                                case "outdent":
                                    this.indent(n);
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
                                    r.toggleClass(t, "active"), this.toggleDisplayBlocks();
                                    break;
                                case "save":
                                    if ("function" == typeof l.callBackSave) l.callBackSave(this.getContents(!1));
                                    else {
                                        if ("function" != typeof h.save) throw Error("[SUNEDITOR.core.commandHandler.fail] Please register call back function in creation option. (callBackSave : Function)");
                                        h.save()
                                    }
                                    e.tool.save && e.tool.save.setAttribute("disabled", !0);
                                    break;
                                default:
                                    n = this._defaultCommand[n.toLowerCase()] || n, this.commandMap[n] || (this.commandMap[n] = t);
                                    const a = r.hasClass(this.commandMap[n], "active") ? null : r.createElement(n);
                                    let c = n;
                                    /^SUB$/i.test(n) && r.hasClass(this.commandMap.SUP, "active") ? c = "SUP" : /^SUP$/i.test(n) && r.hasClass(this.commandMap.SUB, "active") && (c = "SUB"), this.nodeChange(a, null, [c], !1), this.focus()
                            }
                        },
                        removeFormat: function() {
                            this.nodeChange(null, null, null, null)
                        },
                        indent: function(e) {
                            const t = this.getRange(),
                                n = this.getSelectedElements(null),
                                i = [],
                                l = "indent" !== e;
                            let s = t.startContainer,
                                o = t.endContainer,
                                a = t.startOffset,
                                c = t.endOffset;
                            for (let e, t, s = 0, o = n.length; s < o; s++) e = n[s], r.isListCell(e) && this.plugins.list ? (l || e.previousElementSibling) && i.push(e) : (t = /\d+/.test(e.style.marginLeft) ? r.getNumber(e.style.marginLeft, 0) : 0, l ? t -= 25 : t += 25, r.setStyle(e, "marginLeft", t <= 0 ? "" : t + "px"));
                            i.length > 0 && this.plugins.list.editInsideList.call(this, l, i), this.effectNode = null, this.setRange(s, a, o, c), this.history.push(!1)
                        },
                        toggleDisplayBlocks: function() {
                            r.toggleClass(e.element.wysiwyg, "se-show-block"), this._resourcesStateChange()
                        },
                        toggleCodeView: function() {
                            const t = this._variable.isCodeView;
                            this.controllersOff(), r.toggleDisabledButtons(!t, this.codeViewDisabledButtons), t ? (this._setCodeDataToEditor(), e.element.wysiwygFrame.scrollTop = 0, e.element.code.style.display = "none", e.element.wysiwygFrame.style.display = "block", this._variable._codeOriginCssText = this._variable._codeOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: none"), this._variable._wysiwygOriginCssText = this._variable._wysiwygOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: block"), "auto" !== l.height || l.codeMirrorEditor || (e.element.code.style.height = "0px"), this._variable.isCodeView = !1, this._variable.isFullScreen || (this._notHideToolbar = !1, /balloon|balloon-always/i.test(l.mode) && (e.element._arrow.style.display = "", this._isInline = !1, this._isBalloon = !0, u._hideToolbar())), this.nativeFocus(), this.history.push(!1)) : (this._setEditorDataToCodeView(), this._variable._codeOriginCssText = this._variable._codeOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: block"), this._variable._wysiwygOriginCssText = this._variable._wysiwygOriginCssText.replace(/(\s?display(\s+)?:(\s+)?)[a-zA-Z]+(?=;)/, "display: none"), "auto" !== l.height || l.codeMirrorEditor || (e.element.code.style.height = e.element.code.scrollHeight > 0 ? e.element.code.scrollHeight + "px" : "auto"), l.codeMirrorEditor && l.codeMirrorEditor.refresh(), this._variable.isCodeView = !0, this._variable.isFullScreen || (this._notHideToolbar = !0, this._isBalloon && (e.element._arrow.style.display = "none", e.element.toolbar.style.left = "", this._isInline = !0, this._isBalloon = !1, u._showToolbarInline())), this._variable._range = null, e.element.code.focus()), this._checkPlaceholder()
                        },
                        _setCodeDataToEditor: function() {
                            const t = this._getCodeView();
                            if (l.fullPage) {
                                const e = this._parser.parseFromString(t, "text/html"),
                                    n = e.head.children;
                                for (let t = 0, i = n.length; t < i; t++) /script/i.test(n[t].tagName) && (e.head.removeChild(n[t]), t--, i--);
                                this._wd.head.innerHTML = e.head.innerHTML, this._wd.body.innerHTML = this.convertContentsForEditor(e.body.innerHTML);
                                const i = e.body.attributes;
                                for (let e = 0, t = i.length; e < t; e++) "contenteditable" !== i[e].name && this._wd.body.setAttribute(i[e].name, i[e].value);
                                r.hasClass(this._wd.body, "sun-editor-editable") || r.addClass(this._wd.body, "sun-editor-editable")
                            } else e.element.wysiwyg.innerHTML = t.length > 0 ? this.convertContentsForEditor(t) : "<p><br></p>"
                        },
                        _setEditorDataToCodeView: function() {
                            const t = this.convertHTMLForCodeView(e.element.wysiwyg);
                            let n = "";
                            if (l.fullPage) {
                                const e = r.getAttributesToString(this._wd.body, null);
                                n = "<!DOCTYPE html>\n<html>\n" + this._wd.head.outerHTML.replace(/>(?!\n)/g, ">\n") + "<body " + e + ">\n" + t + "</body>\n</html>"
                            } else n = t;
                            e.element.code.style.display = "block", e.element.wysiwygFrame.style.display = "none", this._setCodeView(n)
                        },
                        toggleFullScreen: function(t) {
                            const n = e.element.topArea,
                                i = e.element.toolbar,
                                s = e.element.editorArea,
                                d = e.element.wysiwygFrame,
                                h = e.element.code,
                                g = this._variable;
                            this.controllersOff(), g.isFullScreen ? (g.isFullScreen = !1, d.style.cssText = g._wysiwygOriginCssText, h.style.cssText = g._codeOriginCssText, i.style.cssText = "", s.style.cssText = g._editorAreaOriginCssText, n.style.cssText = g._originCssText, o.body.style.overflow = g._bodyOverflow, l.stickyToolbar > -1 && r.removeClass(i, "se-toolbar-sticky"), g._fullScreenAttrs.sticky && (g._fullScreenAttrs.sticky = !1, e.element._stickyDummy.style.display = "block", r.addClass(i, "se-toolbar-sticky")), this._isInline = g._fullScreenAttrs.inline, this._isBalloon = g._fullScreenAttrs.balloon, this._isInline && u._showToolbarInline(), u.onScroll_window(), r.changeElement(t.querySelector("svg"), c.expansion)) : (g.isFullScreen = !0, g._fullScreenAttrs.inline = this._isInline, g._fullScreenAttrs.balloon = this._isBalloon, (this._isInline || this._isBalloon) && (this._isInline = !1, this._isBalloon = !1), n.style.position = "fixed", n.style.top = "0", n.style.left = "0", n.style.width = "100%", n.style.height = "100%", n.style.zIndex = "2147483647", "" !== e.element._stickyDummy.style.display && (g._fullScreenAttrs.sticky = !0, e.element._stickyDummy.style.display = "none", r.removeClass(i, "se-toolbar-sticky")), g._bodyOverflow = o.body.style.overflow, o.body.style.overflow = "hidden", g._editorAreaOriginCssText = s.style.cssText, g._wysiwygOriginCssText = d.style.cssText, g._codeOriginCssText = h.style.cssText, s.style.cssText = i.style.cssText = "", d.style.cssText = (d.style.cssText.match(/\s?display(\s+)?:(\s+)?[a-zA-Z]+;/) || [""])[0], h.style.cssText = (h.style.cssText.match(/\s?display(\s+)?:(\s+)?[a-zA-Z]+;/) || [""])[0], i.style.width = d.style.height = h.style.height = "100%", i.style.position = "relative", i.style.display = "block", g.innerHeight_fullScreen = a.innerHeight - i.offsetHeight, s.style.height = g.innerHeight_fullScreen + "px", r.changeElement(t.querySelector("svg"), c.reduction), l.iframe && "auto" === l.height && (s.style.overflow = "auto", this._iframeAutoHeight()))
                        },
                        print: function() {
                            const e = r.createElement("IFRAME");
                            e.style.display = "none", o.body.appendChild(e);
                            const t = r.getIframeDocument(e),
                                n = this.getContents(!0),
                                i = this._wd;
                            if (l.iframe) {
                                const e = l.fullPage ? r.getAttributesToString(i.body, ["contenteditable"]) : 'class="sun-editor-editable"';
                                t.write("<!DOCTYPE html><html><head>" + i.head.innerHTML + "<style>" + r.getPageStyle(i) + "</style></head><body " + e + ">" + n + "</body></html>")
                            } else {
                                const e = r.createElement("DIV"),
                                    l = r.createElement("STYLE");
                                l.innerHTML = r.getPageStyle(i), e.className = "sun-editor-editable", e.innerHTML = n, t.head.appendChild(l), t.body.appendChild(e)
                            }
                            try {
                                if (e.focus(), r.isIE_Edge || o.documentMode || a.StyleMedia) try {
                                    e.contentWindow.document.execCommand("print", !1, null)
                                } catch (t) {
                                    e.contentWindow.print()
                                } else e.contentWindow.print()
                            } catch (e) {
                                throw Error("[SUNEDITOR.core.print.fail] error: " + e)
                            } finally {
                                r.removeItem(e)
                            }
                        },
                        preview: function() {
                            const e = this.getContents(!0),
                                t = a.open("", "_blank");
                            t.mimeType = "text/html";
                            const n = this._wd;
                            if (l.iframe) {
                                const i = l.fullPage ? r.getAttributesToString(n.body, ["contenteditable"]) : 'class="sun-editor-editable"';
                                t.document.write("<!DOCTYPE html><html><head>" + n.head.innerHTML + "<style>body {overflow: auto !important;}</style></head><body " + i + ">" + e + "</body></html>")
                            } else t.document.write('<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + i.toolbar.preview + "</title><style>" + r.getPageStyle(n) + '</style></head><body class="sun-editor-editable">' + e + "</body></html>")
                        },
                        setContents: function(t) {
                            const n = this.convertContentsForEditor(t);
                            if (this._resetComponents(), d._variable.isCodeView) {
                                const e = this.convertHTMLForCodeView(n);
                                d._setCodeView(e)
                            } else e.element.wysiwyg.innerHTML = n, d.history.push(!1)
                        },
                        getContents: function(t) {
                            const n = e.element.wysiwyg.innerHTML,
                                i = r.createElement("DIV");
                            i.innerHTML = n;
                            const s = r.getListChildren(i, (function(e) {
                                return /FIGCAPTION/i.test(e.nodeName)
                            }));
                            for (let e = 0, t = s.length; e < t; e++) s[e].removeAttribute("contenteditable");
                            if (l.fullPage && !t) {
                                const e = r.getAttributesToString(this._wd.body, ["contenteditable"]);
                                return "<!DOCTYPE html><html>" + this._wd.head.outerHTML + "<body " + e + ">" + i.innerHTML + "</body></html>"
                            }
                            return i.innerHTML
                        },
                        _makeLine: function(e, t) {
                            if (1 === e.nodeType) return r._notAllowedTags(e) ? "" : !t || r.isFormatElement(e) || r.isRangeFormatElement(e) || r.isComponent(e) || r.isMedia(e) || r.isAnchor(e) && r.isMedia(e.firstElementChild) ? e.outerHTML : "<p>" + e.outerHTML + "</p>";
                            if (3 === e.nodeType) {
                                if (!t) return e.textContent;
                                const n = e.textContent.split(/\n/g);
                                let i = "";
                                for (let e, t = 0, l = n.length; t < l; t++) e = n[t].trim(), e.length > 0 && (i += "<p>" + e + "</p>");
                                return i
                            }
                            return 8 === e.nodeType && this._allowHTMLComments ? "<__comment__>" + e.textContent.trim() + "</__comment__>" : ""
                        },
                        cleanHTML: function(e, t) {
                            const n = o.createRange().createContextualFragment(e);
                            try {
                                r._consistencyCheckOfHTML(n, this._htmlCheckWhitelistRegExp)
                            } catch (e) {
                                console.warn("[SUNEDITOR.cleanHTML.consistencyCheck.fail] " + e)
                            }
                            const i = n.childNodes;
                            let l = "",
                                s = !1;
                            for (let e, t = 0, n = i.length; t < n; t++)
                                if (e = i[t], 1 === e.nodeType && !r.isTextStyleElement(e) && !r.isBreak(e) && !r._notAllowedTags(e)) {
                                    s = !0;
                                    break
                                } for (let e = 0, t = i.length; e < t; e++) l += this._makeLine(i[e], s);
                            return l = l.replace(/\n/g, "").replace(/<(script|style).*>(\n|.)*<\/(script|style)>/g, "").replace(this.editorTagsWhitelistRegExp, "").replace(/<__comment__>/g, "\x3c!-- ").replace(/<\/__comment__>/g, " --\x3e").replace(/(<[a-zA-Z0-9]+)[^>]*(?=>)/g, function(e, t) {
                                let n = null;
                                const i = this._attributesTagsWhitelist[t.match(/(?!<)[a-zA-Z]+/)[0].toLowerCase()];
                                if (n = i ? e.match(i) : e.match(this._attributesWhitelistRegExp), n)
                                    for (let e = 0, i = n.length; e < i; e++) /^class="(?!(__se__|se-))/.test(n[e]) || (t += " " + n[e]);
                                return t
                            }.bind(this)), this._attributesTagsWhitelist.span || (l = l.replace(/<\/?(span[^>^<]*)>/g, "")), l = r.htmlRemoveWhiteSpace(l), r._tagConvertor(l ? t ? l.replace("string" == typeof t ? r.createTagsWhitelist(t) : t, "") : l : e)
                        },
                        convertContentsForEditor: function(e) {
                            const t = o.createRange().createContextualFragment(e);
                            try {
                                r._consistencyCheckOfHTML(t, this._htmlCheckWhitelistRegExp)
                            } catch (e) {
                                console.warn("[SUNEDITOR.convertContentsForEditor.consistencyCheck.fail] " + e)
                            }
                            let n = "";
                            const i = t.childNodes;
                            for (let e = 0, t = i.length; e < t; e++) n += this._makeLine(i[e], !0);
                            return 0 === n.length ? "<p><br></p>" : (n = r.htmlRemoveWhiteSpace(n), n = n.replace(this.editorTagsWhitelistRegExp, "").replace(/\n/g, "").replace(/<__comment__>/g, "\x3c!-- ").replace(/<\/__comment__>/g, " --\x3e"), r._tagConvertor(n))
                        },
                        convertHTMLForCodeView: function(e) {
                            let t = "";
                            const n = a.RegExp,
                                i = new n("^(BLOCKQUOTE|PRE|TABLE|THEAD|TBODY|TR|TH|TD|OL|UL|IMG|IFRAME|VIDEO|AUDIO|FIGURE|FIGCAPTION|HR|BR|CANVAS|SELECT)$", "i"),
                                l = r.isFormatElement.bind(r),
                                s = "string" == typeof e ? o.createRange().createContextualFragment(e) : e;
                            let c = 1 * this._variable.codeIndent;
                            return c = c > 0 ? new a.Array(c + 1).join(" ") : "",
                                function e(s, o, a) {
                                    const d = s.childNodes,
                                        u = i.test(s.nodeName),
                                        h = u ? o : "";
                                    for (let g, p, m, f = 0, _ = d.length; f < _; f++) {
                                        if (g = d[f], m = i.test(g.nodeName), p = m ? "\n" : "", a = !l(g) || u || /^(TH|TD)$/i.test(s.nodeName) ? "" : "\n", 8 === g.nodeType) {
                                            t += "\n\x3c!-- " + g.textContent.trim() + " --\x3e" + p;
                                            continue
                                        }
                                        if (3 === g.nodeType) {
                                            t += r._HTMLConvertor(/^\n+$/.test(g.data) ? "" : g.data);
                                            continue
                                        }
                                        if (0 === g.childNodes.length) {
                                            t += (/^(HR)$/i.test(g.nodeName) ? "\n" : "") + h + g.outerHTML + p;
                                            continue
                                        }
                                        g.innerHTML = g.innerHTML;
                                        const _ = g.nodeName.toLowerCase();
                                        t += (a || (u ? "" : p)) + (h || m ? o : "") + g.outerHTML.match(n("<" + _ + "[^>]*>", "i"))[0] + p, e(g, o + c, ""), t += (m ? o : "") + "</" + _ + ">" + (a || p || u || /^(TH|TD)$/i.test(g.nodeName) ? "\n" : "")
                                    }
                                }(s, "", "\n"), t.trim() + "\n"
                        },
                        addDocEvent: function(e, t, n) {
                            o.addEventListener(e, t, n), l.iframe && this._wd.addEventListener(e, t)
                        },
                        removeDocEvent: function(e, t) {
                            o.removeEventListener(e, t), l.iframe && this._wd.removeEventListener(e, t)
                        },
                        _charCount: function(t) {
                            const n = e.element.charCounter,
                                i = l.maxCharCount;
                            let s = 0;
                            if (t && (s = d._getCharLength(t, l.charCounterType)), n && a.setTimeout((function() {
                                    n.textContent = h.getCharCount(null)
                                })), i > 0) {
                                let t = !1;
                                const n = h.getCharCount(null);
                                if (n > i) {
                                    if (t = !0, s > 0) {
                                        this._editorRange();
                                        const e = this.getRange(),
                                            t = e.endOffset - 1,
                                            l = this.getSelectionNode().textContent,
                                            s = e.endOffset - (n - i);
                                        this.getSelectionNode().textContent = l.slice(0, s < 0 ? 0 : s) + l.slice(e.endOffset, l.length), this.setRange(e.endContainer, t, e.endContainer, t)
                                    }
                                } else n + s > i && (t = !0);
                                if (t) {
                                    const t = e.element.charWrapper;
                                    if (t && !r.hasClass(t, "se-blink") && (r.addClass(t, "se-blink"), a.setTimeout((function() {
                                            r.removeClass(t, "se-blink")
                                        }), 600)), s > 0) return !1
                                }
                            }
                            return !0
                        },
                        _getCharLength: function(e, t) {
                            return /byte/.test(t) ? r.getByteLength(e) : e.length
                        },
                        _checkComponents: function() {
                            for (var e=0; e<this.componentInfoPlugins.length; e++) {
                                this.componentInfoPlugins[e].checkComponentInfo.call(this)
                            }
                        },
                        _resetComponents: function() {
                            for (var e=0; e<this.componentInfoPlugins.length; e++) {
                                this.componentInfoPlugins[e].resetComponentInfo.call(this)
                            }
                        },
                        _setCodeView: function(t) {
                            l.codeMirrorEditor ? l.codeMirrorEditor.getDoc().setValue(t) : e.element.code.value = t
                        },
                        _getCodeView: function() {
                            return l.codeMirrorEditor ? l.codeMirrorEditor.getDoc().getValue() : e.element.code.value
                        },
                        _init: function(i, s) {
                            this._ww = l.iframe ? e.element.wysiwygFrame.contentWindow : a, this._wd = o, l.iframe && "auto" === l.height && (this._iframeAuto = this._wd.body), this._allowHTMLComments = l._editorTagsWhitelist.indexOf("//") > -1, this._htmlCheckWhitelistRegExp = new a.RegExp("^(" + l._editorTagsWhitelist.replace("|//", "") + ")$", "i"), this.editorTagsWhitelistRegExp = r.createTagsWhitelist(l._editorTagsWhitelist.replace("|//", "|__comment__")), this.pasteTagsWhitelistRegExp = r.createTagsWhitelist(l.pasteTagsWhitelist);
                            const c = l.attributesWhitelist,
                                d = {};
                            let g, p, m = "";
                            if (c)
                                for (let e in c) "all" === e ? m = c[e] + "|" : d[e] = new a.RegExp("((?:" + c[e] + ')s*=s*"[^"]*")', "ig");
                            this._attributesWhitelistRegExp = new a.RegExp("((?:" + m + 'contenteditable|colspan|rowspan|target|href|src|class|type|data-format|data-size|data-file-size|data-file-name|data-origin|data-align|data-image-link|data-rotate|data-proportion|data-percentage|origin-size)s*=s*"[^"]*")', "ig"), this._attributesTagsWhitelist = d, this.codeViewDisabledButtons = e.element.toolbar.querySelectorAll('.se-toolbar button:not([class~="se-code-view-enabled"])'), this.resizingDisabledButtons = e.element.toolbar.querySelectorAll('.se-toolbar button:not([class~="se-resizing-enabled"])'), this._isInline = /inline/i.test(l.mode), this._isBalloon = /balloon|balloon-always/i.test(l.mode), this._isBalloonAlways = /balloon-always/i.test(l.mode), this.commandMap = {
                                STRONG: e.tool.bold,
                                U: e.tool.underline,
                                EM: e.tool.italic,
                                DEL: e.tool.strike,
                                SUB: e.tool.subscript,
                                SUP: e.tool.superscript,
                                OUTDENT: e.tool.outdent,
                                INDENT: e.tool.indent
                            }, this.activePlugins = [], this.componentInfoPlugins = [];
                            for (let e in n) g = n[e], p = t[e], g.active && p && this.callPlugin(e, null, p), "function" == typeof g.checkComponentInfo && "function" == typeof g.resetComponentInfo && (this.callPlugin(e, null, p), this.componentInfoPlugins.push(g));
                            this._variable._originCssText = e.element.topArea.style.cssText, this._placeholder = e.element.placeholder, this._lineBreaker = e.element.lineBreaker, this._lineBreakerButton = this._lineBreaker.querySelector("button"), this.history = function(e, t) {
                                const n = window,
                                    i = e.context.element,
                                    l = e.util,
                                    s = e.context.tool.undo,
                                    o = e.context.tool.redo;
                                let a = null,
                                    r = 0,
                                    c = [];

                                function d() {
                                    const n = c[r];
                                    i.wysiwyg.innerHTML = n.contents, e.setRange(l.getNodeFromPath(n.s.path, i.wysiwyg), n.s.offset, l.getNodeFromPath(n.e.path, i.wysiwyg), n.e.offset), e.focus(), 0 === r ? (s && s.setAttribute("disabled", !0), o && o.removeAttribute("disabled")) : r === c.length - 1 ? (s && s.removeAttribute("disabled"), o && o.setAttribute("disabled", !0)) : (s && s.removeAttribute("disabled"), o && o.removeAttribute("disabled")), e.controllersOff(), e._checkComponents(), e._charCount(""), e._resourcesStateChange(), t()
                                }

                                function u() {
                                    e._checkComponents();
                                    const n = e.getContents(!0);
                                    if (c[r] && n === c[r].contents) return;
                                    r++;
                                    const i = e._variable._range;
                                    c.length > r && (c = c.slice(0, r), o && o.setAttribute("disabled", !0)), c[r] = i ? {
                                        contents: n,
                                        s: {
                                            path: l.getNodePath(i.startContainer, null, null),
                                            offset: i.startOffset
                                        },
                                        e: {
                                            path: l.getNodePath(i.endContainer, null, null),
                                            offset: i.endOffset
                                        }
                                    } : {
                                        contents: n,
                                        s: {
                                            path: [0, 0],
                                            offset: [0, 0]
                                        },
                                        e: {
                                            path: 0,
                                            offset: 0
                                        }
                                    }, 1 === r && s && s.removeAttribute("disabled"), e._charCount(""), t()
                                }
                                return {
                                    stack: c,
                                    push: function(t) {
                                        n.setTimeout(e._resourcesStateChange);
                                        const i = "number" == typeof t ? t > 0 ? t : 0 : t ? 400 : 0;
                                        i && !a || (n.clearTimeout(a), i) ? a = n.setTimeout((function() {
                                            n.clearTimeout(a), a = null, u()
                                        }), i) : u()
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
                                    reset: function(n) {
                                        s && s.setAttribute("disabled", !0), o && o.setAttribute("disabled", !0), e.context.tool.save && e.context.tool.save.setAttribute("disabled", !0), c.splice(0), r = 0, c[r] = {
                                            contents: e.getContents(!0),
                                            s: {
                                                path: [0, 0],
                                                offset: 0
                                            },
                                            e: {
                                                path: [0, 0],
                                                offset: 0
                                            }
                                        }, n || t()
                                    },
                                    _destroy: function() {
                                        a && n.clearTimeout(a), c = null
                                    }
                                }
                            }(this, u._onChange_historyStack), l.iframe || this._initWysiwygArea(i, s), a.setTimeout(function() {
                                if (l.iframe && (this._wd = e.element.wysiwygFrame.contentDocument, e.element.wysiwyg = this._wd.body, this._initWysiwygArea(i, s), "auto" === l.height && (this._iframeAuto = this._wd.body)), this._checkComponents(), this._componentsInfoInit = !1, this._componentsInfoReset = !1, this.history.reset(!0), this._resourcesStateChange(), "function" == typeof h.onload) return h.onload(this, i)
                            }.bind(this))
                        },
                        _initWysiwygArea: function(t, n) {
                            l.defaultStyle && (e.element.wysiwyg.style.cssText = l.defaultStyle), t ? n && (e.element.wysiwyg.innerHTML = n) : e.element.wysiwyg.innerHTML = this.convertContentsForEditor(e.element.originElement.value)
                        },
                        _resourcesStateChange: function() {
                            d._iframeAutoHeight(), d._checkPlaceholder()
                        },
                        _iframeAutoHeight: function() {
                            this._iframeAuto && a.setTimeout((function() {
                                e.element.wysiwygFrame.style.height = d._iframeAuto.offsetHeight + "px"
                            }))
                        },
                        _checkPlaceholder: function() {
                            if (this._placeholder) {
                                if (this._variable.isCodeView) return void(this._placeholder.style.display = "none");
                                const t = e.element.wysiwyg;
                                !r.onlyZeroWidthSpace(t.textContent) || t.querySelector(".se-component, pre, blockquote, hr, li, table, img, iframe, video") || (t.innerText.match(/\n/g) || "").length > 1 ? this._placeholder.style.display = "none" : this._placeholder.style.display = "block"
                            }
                        },
                        _setDefaultFormat: function(e) {
                            if (this._resizingName) return;
                            const t = this.getRange(),
                                n = t.commonAncestorContainer,
                                i = t.startContainer,
                                l = r.getRangeFormatElement(n, null);
                            let s, o, a;
                            if (!(r.getParentElement(n, r.isComponent) || (r.isRangeFormatElement(i) || r.isWysiwygDiv(i)) && r.isComponent(i.childNodes[t.startOffset]))) {
                                if (l) return a = r.createElement(e || "P"), a.innerHTML = l.innerHTML, 0 === a.childNodes.length && (a.innerHTML = r.zeroWidthSpace), l.innerHTML = a.outerHTML, a = l.firstChild, s = r.getEdgeChildNodes(a, null).sc, s || (s = r.createTextNode(r.zeroWidthSpace), a.insertBefore(s, a.firstChild)), o = s.textContent.length, void this.setRange(s, o, s, o);
                                if (r.isRangeFormatElement(n) && n.childNodes.length <= 1) {
                                    let e = null;
                                    1 === n.childNodes.length && r.isBreak(n.firstChild) ? e = n.firstChild : (e = r.createTextNode(r.zeroWidthSpace), n.appendChild(e)), this.setRange(e, 1, e, 1)
                                }
                                if (this.execCommand("formatBlock", !1, e || "P"), s = r.getEdgeChildNodes(n, n), s = s ? s.ec : n, a = r.getFormatElement(s, null), !a) return this.removeRange(), void this._editorRange();
                                if (r.isBreak(a.nextSibling) && r.removeItem(a.nextSibling), r.isBreak(a.previousSibling) && r.removeItem(a.previousSibling), r.isBreak(s)) {
                                    const e = r.createTextNode(r.zeroWidthSpace);
                                    s.parentNode.insertBefore(e, s), s = e
                                }
                                o = 3 === s.nodeType ? s.textContent.length : 1, this.effectNode = null, this.setRange(s, o, s, o)
                            }
                        }
                    },
                    u = {
                        _directionKeyCode: new a.RegExp("^(8|13|3[2-9]|40|46)$"),
                        _nonTextKeyCode: new a.RegExp("^(8|13|1[6-9]|20|27|3[3-9]|40|45|46|11[2-9]|12[0-3]|144|145)$"),
                        _historyIgnoreKeyCode: new a.RegExp("^(1[6-9]|20|27|3[3-9]|40|45|11[2-9]|12[0-3]|144|145)$"),
                        _onButtonsCheck: new a.RegExp("^(STRONG|U|EM|DEL|SUB|SUP)$"),
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
                            let n = null;
                            switch (u._keyCodeShortcut[e]) {
                                case "A":
                                    n = "selectAll";
                                    break;
                                case "B":
                                    n = "STRONG";
                                    break;
                                case "S":
                                    t && (n = "DEL");
                                    break;
                                case "U":
                                    n = "U";
                                    break;
                                case "I":
                                    n = "EM";
                                    break;
                                case "Z":
                                    n = t ? "redo" : "undo";
                                    break;
                                case "Y":
                                    n = "redo";
                                    break;
                                case "[":
                                    n = "outdent";
                                    break;
                                case "]":
                                    n = "indent"
                            }
                            return !!n && (d.commandHandler(d.commandMap[n], n), !0)
                        },
                        _applyTagEffects: function() {
                            let t = d.getSelectionNode();
                            if (t === d.effectNode) return;
                            d.effectNode = t;
                            const i = d.commandMap,
                                s = this._onButtonsCheck,
                                o = [],
                                a = [],
                                c = d.activePlugins,
                                u = c.length;
                            let h = "";
                            for (; t.firstChild;) t = t.firstChild;
                            for (let e = t; !r.isWysiwygDiv(e) && e; e = e.parentNode)
                                if (1 === e.nodeType && !r.isBreak(e)) {
                                    h = e.nodeName.toUpperCase(), a.push(h);
                                    for (let t, i = 0; i < u; i++) t = c[i], -1 === o.indexOf(t) && n[t].active.call(d, e) && o.push(t);
                                    r.isFormatElement(e) ? (-1 === o.indexOf("OUTDENT") && i.OUTDENT && (r.isListCell(e) || e.style.marginLeft && r.getNumber(e.style.marginLeft, 0) > 0) && (o.push("OUTDENT"), i.OUTDENT.removeAttribute("disabled")), -1 === o.indexOf("INDENT") && i.INDENT && r.isListCell(e) && !e.previousElementSibling && (o.push("INDENT"), i.INDENT.setAttribute("disabled", !0))) : s.test(h) && (o.push(h), r.addClass(i[h], "active"))
                                } for (let e in i) o.indexOf(e) > -1 || (c.indexOf(e) > -1 ? n[e].active.call(d, null) : i.OUTDENT && /^OUTDENT$/i.test(e) ? i.OUTDENT.setAttribute("disabled", !0) : i.INDENT && /^INDENT$/i.test(e) ? i.INDENT.removeAttribute("disabled") : r.removeClass(i[e], "active"));
                            d._variable.currentNodes = a.reverse(), l.showPathLabel && (e.element.navigation.textContent = d._variable.currentNodes.join(" > "))
                        },
                        _cancelCaptionEdit: function() {
                            this.setAttribute("contenteditable", !1), this.removeEventListener("blur", u._cancelCaptionEdit)
                        },
                        onMouseDown_toolbar: function(e) {
                            let t = e.target;
                            if (d._bindControllersOff && e.stopPropagation(), /^(input|textarea|select|option)$/i.test(t.nodeName) ? d._antiBlur = !1 : e.preventDefault(), r.getParentElement(t, ".se-submenu")) e.stopPropagation(), d._notHideToolbar = !0;
                            else {
                                let n = t.getAttribute("data-command"),
                                    i = t.className;
                                for (; !n && !/se-menu-list/.test(i) && !/se-toolbar/.test(i);) t = t.parentNode, n = t.getAttribute("data-command"), i = t.className;
                                n !== d._submenuName && n !== d._containerName || e.stopPropagation()
                            }
                        },
                        onClick_toolbar: function(e) {
                            let t = e.target,
                                n = t.getAttribute("data-display"),
                                i = t.getAttribute("data-command"),
                                l = t.className;
                            for (; t.parentNode && !i && !/se-menu-list/.test(l) && !/se-toolbar/.test(l);) t = t.parentNode, i = t.getAttribute("data-command"), n = t.getAttribute("data-display"), l = t.className;
                            (i || n) && (t.disabled || (d.hasFocus || d.nativeFocus(), d._variable.isCodeView || d._editorRange(), d.actionCall(i, n, t)))
                        },
                        onMouseDown_wysiwyg: function(t) {
                            if ("false" === e.element.wysiwyg.getAttribute("contenteditable")) return;
                            const n = r.getParentElement(t.target, r.isCell);
                            if (n) {
                                const e = d.plugins.table;
                                e && n !== e._fixedCell && !e._shift && d.callPlugin("table", (function() {
                                    e.onTableCellMultiSelect.call(d, n, !1)
                                }), null)
                            }
                            d._isBalloon && u._hideToolbar(), h.onMouseDown && h.onMouseDown(t, d)
                        },
                        onClick_wysiwyg: function(t) {
                            const n = t.target;
                            if ("false" === e.element.wysiwyg.getAttribute("contenteditable")) return;
                            if (/^FIGURE$/i.test(n.nodeName)) {
                                const e = n.querySelector("IMG"),
                                    i = n.querySelector("IFRAME");
                                if (e) return t.preventDefault(), void d.selectComponent(e, "image");
                                if (i) return t.preventDefault(), void d.selectComponent(i, "video")
                            }
                            const i = r.getParentElement(n, "FIGCAPTION");
                            if (i && (!i.getAttribute("contenteditable") || "false" === i.getAttribute("contenteditable")) && (t.preventDefault(), i.setAttribute("contenteditable", !0), i.focus(), d._isInline && !d._inlineToolbarAttr.isShow)) {
                                u._showToolbarInline();
                                const e = function() {
                                    u._hideToolbar(), i.removeEventListener("blur", e)
                                };
                                i.addEventListener("blur", e)
                            }
                            a.setTimeout(d._editorRange.bind(d)), d._editorRange();
                            const l = d.getSelectionNode(),
                                s = r.getFormatElement(l, null),
                                o = r.getRangeFormatElement(l, null);
                            if (s && s !== o || "false" === n.getAttribute("contenteditable")) u._applyTagEffects();
                            else {
                                if (r.isList(o)) {
                                    const e = r.createElement("LI"),
                                        t = l.nextElementSibling;
                                    e.appendChild(l), o.insertBefore(e, t)
                                } else r.isWysiwygDiv(l) || r.isComponent(l) || d._setDefaultFormat(r.isRangeFormatElement(o) ? "DIV" : "P");
                                t.preventDefault(), d.focus()
                            }
                            d._isBalloon && a.setTimeout(u._toggleToolbarBalloon), h.onClick && h.onClick(t, d)
                        },
                        _balloonDelay: null,
                        _showToolbarBalloonDelay: function() {
                            u._balloonDelay && a.clearTimeout(u._balloonDelay), u._balloonDelay = a.setTimeout(function() {
                                a.clearTimeout(this._balloonDelay), this._balloonDelay = null, this._showToolbarBalloon()
                            }.bind(u), 350)
                        },
                        _toggleToolbarBalloon: function() {
                            d._editorRange();
                            const e = d.getRange();
                            "table" === d.currentControllerName || !d._isBalloonAlways && e.collapsed ? u._hideToolbar() : u._showToolbarBalloon(e)
                        },
                        _showToolbarBalloon: function(t) {
                            if (!d._isBalloon) return;
                            const n = t || d.getRange(),
                                i = e.element.toolbar,
                                l = d.getSelection();
                            let s;
                            if (d._isBalloonAlways && n.collapsed) s = !0;
                            else if (l.focusNode === l.anchorNode) s = l.focusOffset < l.anchorOffset;
                            else {
                                const e = r.getListChildNodes(n.commonAncestorContainer, null);
                                s = r.getArrayIndex(e, l.focusNode) < r.getArrayIndex(e, l.anchorNode)
                            }
                            let o = n.getClientRects();
                            o = o[s ? 0 : o.length - 1];
                            let c = 0,
                                h = 0,
                                g = e.element.topArea;
                            for (; g;) c += g.scrollLeft, h += g.scrollTop, g = g.parentElement;
                            const p = e.element.topArea.offsetWidth,
                                m = u._getEditorOffsets(),
                                f = m.top,
                                _ = m.left;
                            if (i.style.top = "-10000px", i.style.visibility = "hidden", i.style.display = "block", !o) {
                                const t = d.getSelectionNode();
                                if (r.isFormatElement(t)) {
                                    const e = r.createTextNode(r.zeroWidthSpace);
                                    d.insertNode(e, null), d.setRange(e, 1, e, 1), d._editorRange(), o = d.getRange().getClientRects(), o = o[s ? 0 : o.length - 1]
                                }
                                if (!o) {
                                    const n = r.getOffset(t, e.element.wysiwygFrame);
                                    o = {
                                        left: n.left,
                                        top: n.top,
                                        right: n.left,
                                        bottom: n.top + t.offsetHeight,
                                        noText: !0
                                    }, c = 0, h = 0
                                }
                                s = !0
                            }
                            const b = a.Math.round(e.element._arrow.offsetWidth / 2),
                                v = i.offsetWidth,
                                y = i.offsetHeight,
                                x = /iframe/i.test(e.element.wysiwygFrame.nodeName) ? e.element.wysiwygFrame.getClientRects()[0] : null;
                            x && (o = {
                                left: o.left + x.left,
                                top: o.top + x.top,
                                right: o.right + x.right - x.width,
                                bottom: o.bottom + x.bottom - x.height
                            }), u._setToolbarOffset(s, o, i, _, p, c, h, f, b), v === i.offsetWidth && y === i.offsetHeight || u._setToolbarOffset(s, o, i, _, p, c, h, f, b), i.style.visibility = ""
                        },
                        _setToolbarOffset: function(t, n, i, l, s, c, d, h, g) {
                            const p = i.offsetWidth,
                                m = n.noText && !t ? 0 : i.offsetHeight,
                                f = (t ? n.left : n.right) - l - p / 2 + c,
                                _ = f + p - s;
                            let b = (t ? n.top - m - g : n.bottom + g) - (n.noText ? 0 : h) + d,
                                v = f < 0 ? 1 : _ < 0 ? f : f - _ - 1 - 1,
                                y = !1;
                            const x = b + (t ? u._getEditorOffsets().top : i.offsetHeight - e.element.wysiwyg.offsetHeight);
                            !t && x > 0 && u._getPageBottomSpace() < x ? (t = !0, y = !0) : t && o.documentElement.offsetTop > x && (t = !1, y = !0), y && (b = (t ? n.top - m - g : n.bottom + g) - (n.noText ? 0 : h) + d), i.style.left = a.Math.floor(v) + "px", i.style.top = a.Math.floor(b) + "px", t ? (r.removeClass(e.element._arrow, "se-arrow-up"), r.addClass(e.element._arrow, "se-arrow-down"), e.element._arrow.style.top = m + "px") : (r.removeClass(e.element._arrow, "se-arrow-down"), r.addClass(e.element._arrow, "se-arrow-up"), e.element._arrow.style.top = -g + "px");
                            const C = a.Math.floor(p / 2 + (f - v));
                            e.element._arrow.style.left = (C + g > i.offsetWidth ? i.offsetWidth - g : C < g ? g : C) + "px"
                        },
                        _showToolbarInline: function() {
                            if (!d._isInline) return;
                            const t = e.element.toolbar;
                            t.style.visibility = "hidden", t.style.display = "block", d._inlineToolbarAttr.width = t.style.width = l.toolbarWidth, d._inlineToolbarAttr.top = t.style.top = -1 - t.offsetHeight + "px", "function" == typeof h.showInline && h.showInline(t, e, d), u.onScroll_window(), d._inlineToolbarAttr.isShow = !0, t.style.visibility = ""
                        },
                        _hideToolbar: function() {
                            d._notHideToolbar || d._variable.isFullScreen || (e.element.toolbar.style.display = "none", d._inlineToolbarAttr.isShow = !1)
                        },
                        onInput_wysiwyg: function(e) {
                            d._editorRange();
                            const t = (null === e.data ? "" : void 0 === e.data ? " " : e.data) || "";
                            d._charCount(t) || (e.preventDefault(), e.stopPropagation()), d.history.push(!0), h.onInput && h.onInput(e, d)
                        },
                        _onShortcutKey: !1,
                        onKeyDown_wysiwyg: function(t) {
                            const n = t.keyCode,
                                i = t.shiftKey,
                                l = t.ctrlKey || t.metaKey || 91 === n || 92 === n,
                                s = t.altKey;
                            if (d.submenuOff(), d._isBalloon && u._hideToolbar(), l && u._shortcutCommand(n, i)) return u._onShortcutKey = !0, t.preventDefault(), t.stopPropagation(), !1;
                            u._onShortcutKey && (u._onShortcutKey = !1);
                            let o = d.getSelectionNode();
                            const c = d.getRange(),
                                g = !c.collapsed || c.startContainer !== c.endContainer,
                                p = d._resizingName;
                            let m = r.getFormatElement(o, null) || o,
                                f = r.getRangeFormatElement(m, null);
                            switch (n) {
                                case 8:
                                    if (!g && p) {
                                        t.preventDefault(), t.stopPropagation(), d.plugins[p].destroy.call(d);
                                        break
                                    }
                                    if (!r.isFormatElement(m) && !e.element.wysiwyg.firstElementChild && !r.isComponent(o)) return t.preventDefault(), t.stopPropagation(), d._setDefaultFormat("P"), !1;
                                    if (!g && !m.previousElementSibling && r.isWysiwygDiv(m.parentNode) && r.isFormatElement(m) && !r.isFreeFormatElement(m) && !r.isListCell(m) && m.childNodes.length <= 1 && (!m.firstChild || r.onlyZeroWidthSpace(m.textContent))) {
                                        t.preventDefault(), t.stopPropagation(), m.innerHTML = "<br>";
                                        const e = m.attributes;
                                        for (; e[0];) m.removeAttribute(e[0].name);
                                        return d.nativeFocus(), !1
                                    }
                                    if (m && c.startContainer === c.endContainer && 3 === o.nodeType && !r.isFormatElement(o.parentNode) && (c.collapsed ? 1 === o.textContent.length : c.endOffset - c.startOffset === o.textContent.length)) {
                                        t.preventDefault();
                                        let e = null,
                                            n = o.parentNode.previousSibling;
                                        const i = o.parentNode.nextSibling;
                                        n || (i ? (n = i, e = 0) : (n = r.createElement("BR"), m.appendChild(n))), o.textContent = "", r.removeItemAllParents(o, null, m), e = "number" == typeof e ? e : 3 === n.nodeType ? n.textContent.length : 1, d.setRange(n, e, n, e);
                                        break
                                    }
                                    const n = c.commonAncestorContainer;
                                    if (m = r.getFormatElement(c.startContainer, null), f = r.getRangeFormatElement(m, null), f && m && !r.isCell(f) && !/^FIGCAPTION$/i.test(f.nodeName)) {
                                        if (r.isListCell(m) && r.isList(f) && (r.isListCell(f.parentNode) || m.previousElementSibling) && (o === m || 3 === o.nodeType && (!o.previousSibling || r.isList(o.previousSibling))) && (r.getFormatElement(c.startContainer, null) !== r.getFormatElement(c.endContainer, null) ? f.contains(c.startContainer) : 0 === c.startOffset && c.collapsed)) {
                                            if (c.startContainer !== c.endContainer) t.preventDefault(), d.removeNode(), 3 === c.startContainer.nodeType && d.setRange(c.startContainer, c.startContainer.textContent.length, c.startContainer, c.startContainer.textContent.length), d.history.push(!0);
                                            else {
                                                let e = m.previousElementSibling || f.parentNode;
                                                if (r.isListCell(e)) {
                                                    t.preventDefault();
                                                    let n = e;
                                                    if (!e.contains(m) && r.isListCell(n) && r.isList(n.lastElementChild)) {
                                                        for (n = n.lastElementChild.lastElementChild; r.isListCell(n) && r.isList(n.lastElementChild);) n = n.lastElementChild && n.lastElementChild.lastElementChild;
                                                        e = n
                                                    }
                                                    let i = e === f.parentNode ? f.previousSibling : e.lastChild;
                                                    i || (i = r.createTextNode(r.zeroWidthSpace), f.parentNode.insertBefore(i, f.parentNode.firstChild));
                                                    const l = 3 === i.nodeType ? i.textContent.length : 1,
                                                        s = m.childNodes;
                                                    let o = i,
                                                        a = s[0];
                                                    for (; a = s[0];) e.insertBefore(a, o.nextSibling), o = a;
                                                    r.removeItem(m), 0 === f.children.length && r.removeItem(f), d.setRange(i, l, i, l), d.history.push(!0)
                                                }
                                            }
                                            break
                                        }
                                        if (!g && 0 === c.startOffset) {
                                            let e = !0,
                                                i = n;
                                            for (; i && i !== f && !r.isWysiwygDiv(i);) {
                                                if (i.previousSibling && (1 === i.previousSibling.nodeType || !r.onlyZeroWidthSpace(i.previousSibling.textContent.trim()))) {
                                                    e = !1;
                                                    break
                                                }
                                                i = i.parentNode
                                            }
                                            if (e && f.parentNode) {
                                                t.preventDefault(), d.detachRangeFormatElement(f, r.isListCell(m) ? [m] : null, null, !1, !1), d.history.push(!0);
                                                break
                                            }
                                        }
                                    }
                                    if (!g && 0 === c.startOffset && (r.isComponent(n.previousSibling) || 3 === n.nodeType && !n.previousSibling && 0 === c.startOffset && 0 === c.endOffset && r.isComponent(m.previousSibling))) {
                                        let e = m.previousSibling;
                                        r.hasClass(e, "se-image-container") || /^IMG$/i.test(e.nodeName) ? (e = /^IMG$/i.test(e.nodeName) ? e : e.querySelector("img"), d.selectComponent(e, "image"), 0 === m.textContent.length && r.removeItem(m)) : r.hasClass(e, "se-video-container") && (d.selectComponent(e.querySelector("iframe"), "video"), 0 === m.textContent.length && r.removeItem(m));
                                        break
                                    }
                                    break;
                                case 46:
                                    if (p) {
                                        t.preventDefault(), t.stopPropagation(), d.plugins[p].destroy.call(d);
                                        break
                                    }
                                    if ((r.isFormatElement(o) || null === o.nextSibling) && c.startOffset === o.textContent.length) {
                                        let e = m.nextElementSibling;
                                        if (!e) {
                                            t.preventDefault();
                                            break
                                        }
                                        if (r.isComponent(e)) {
                                            if (t.preventDefault(), r.onlyZeroWidthSpace(m) && (r.removeItem(m), r.isTable(e))) {
                                                let t = r.getChildElement(e, r.isCell, !1);
                                                t = t.firstElementChild || t, d.setRange(t, 0, t, 0);
                                                break
                                            }(r.hasClass(e, "se-component") || /^(IMG|IFRAME)$/i.test(e.nodeName)) && (t.stopPropagation(), r.hasClass(e, "se-image-container") || /^IMG$/i.test(e.nodeName) ? (e = /^IMG$/i.test(e.nodeName) ? e : e.querySelector("img"), d.selectComponent(e, "image")) : r.hasClass(e, "se-video-container") && d.selectComponent(e.querySelector("iframe"), "video"));
                                            break
                                        }
                                    }
                                    if (m = r.getFormatElement(c.startContainer, null), f = r.getRangeFormatElement(m, null), r.isListCell(m) && r.isList(f) && (o === m || 3 === o.nodeType && (!o.nextSibling || r.isList(o.nextSibling)) && (r.getFormatElement(c.startContainer, null) !== r.getFormatElement(c.endContainer, null) ? f.contains(c.endContainer) : c.endOffset === o.textContent.length && c.collapsed))) {
                                        c.startContainer !== c.endContainer && d.removeNode();
                                        let e = r.getArrayItem(m.children, r.isList, !1);
                                        if (e = e || m.nextElementSibling || f.parentNode.nextElementSibling, e && (r.isList(e) || r.getArrayItem(e.children, r.isList, !1))) {
                                            let n, i;
                                            if (t.preventDefault(), r.isList(e)) {
                                                const t = e.firstElementChild;
                                                for (i = t.childNodes, n = i[0]; i[0];) m.insertBefore(i[0], e);
                                                r.removeItem(t)
                                            } else {
                                                for (n = e.firstChild, i = e.childNodes; i[0];) m.appendChild(i[0]);
                                                r.removeItem(e)
                                            }
                                            d.setRange(n, 0, n, 0), d.history.push(!0)
                                        }
                                        break
                                    }
                                    break;
                                case 9:
                                    if (p) break;
                                    if (t.preventDefault(), l || s || r.isWysiwygDiv(o)) break;
                                    const _ = !c.collapsed || d.isEdgePoint(c.startContainer, c.startOffset),
                                        b = d.getSelectedElements(null);
                                    o = d.getSelectionNode();
                                    const v = [];
                                    let y = [],
                                        x = r.isListCell(b[0]),
                                        C = r.isListCell(b[b.length - 1]),
                                        w = {
                                            sc: c.startContainer,
                                            so: c.startOffset,
                                            ec: c.endContainer,
                                            eo: c.endOffset
                                        };
                                    for (let e, t = 0, n = b.length; t < n; t++)
                                        if (e = b[t], r.isListCell(e)) {
                                            if (!e.previousElementSibling && !i) continue;
                                            v.push(e)
                                        } else y.push(e);
                                    if (v.length > 0 && _ && d.plugins.list) w = d.plugins.list.editInsideList.call(d, i, v);
                                    else {
                                        const e = r.getParentElement(o, r.isCell);
                                        if (e && _) {
                                            const t = r.getParentElement(e, "table"),
                                                n = r.getListChildren(t, r.isCell);
                                            let l = i ? r.prevIdx(n, e) : r.nextIdx(n, e);
                                            l !== n.length || i || (l = 0), -1 === l && i && (l = n.length - 1);
                                            let s = n[l];
                                            if (!s) break;
                                            s = s.firstElementChild || s, d.setRange(s, 0, s, 0);
                                            break
                                        }
                                        y = y.concat(v), x = C = null
                                    }
                                    if (y.length > 0)
                                        if (i) {
                                            const e = y.length - 1;
                                            for (let t, n = 0; n <= e; n++) {
                                                t = y[n].childNodes;
                                                for (let e, n = 0, i = t.length; n < i && (e = t[n], e); n++)
                                                    if (!r.onlyZeroWidthSpace(e)) {
                                                        /^\s{1,4}$/.test(e.textContent) ? r.removeItem(e) : /^\s{1,4}/.test(e.textContent) && (e.textContent = e.textContent.replace(/^\s{1,4}/, ""));
                                                        break
                                                    }
                                            }
                                            const t = r.getChildElement(y[0], "text", !1),
                                                n = r.getChildElement(y[e], "text", !0);
                                            !x && t && (w.sc = t, w.so = 0), !C && n && (w.ec = n, w.eo = n.textContent.length)
                                        } else {
                                            const e = r.createTextNode(new a.Array(d._variable.tabSize + 1).join(" "));
                                            if (1 === y.length) {
                                                const t = d.insertNode(e, null);
                                                x || (w.sc = e, w.so = t.endOffset), C || (w.ec = e, w.eo = t.endOffset)
                                            } else {
                                                const t = y.length - 1;
                                                for (let n, i = 0; i <= t; i++) n = y[i].firstChild, n && (r.isBreak(n) ? y[i].insertBefore(e.cloneNode(!1), n) : n.textContent = e.textContent + n.textContent);
                                                const n = r.getChildElement(y[0], "text", !1),
                                                    i = r.getChildElement(y[t], "text", !0);
                                                !x && n && (w.sc = n, w.so = 0), !C && i && (w.ec = i, w.eo = i.textContent.length)
                                            }
                                        } d.setRange(w.sc, w.so, w.ec, w.eo), d.history.push(!1);
                                    break;
                                case 13:
                                    const E = r.getFreeFormatElement(o, null);
                                    if (!i && E) {
                                        t.preventDefault();
                                        const e = o === E,
                                            n = d.getSelection(),
                                            i = o.childNodes,
                                            l = n.focusOffset,
                                            s = o.previousElementSibling,
                                            a = o.nextSibling;
                                        if (i && (e && c.collapsed && i.length - 1 <= l + 1 && r.isBreak(i[l]) && (!i[l + 1] || (!i[l + 2] || r.onlyZeroWidthSpace(i[l + 2].textContent)) && 3 === i[l + 1].nodeType && r.onlyZeroWidthSpace(i[l + 1].textContent)) && l > 0 && r.isBreak(i[l - 1]) || !e && r.onlyZeroWidthSpace(o.textContent) && r.isBreak(s) && (r.isBreak(s.previousSibling) || !r.onlyZeroWidthSpace(s.previousSibling.textContent)) && (!a || !r.isBreak(a) && r.onlyZeroWidthSpace(a.textContent)))) {
                                            e ? r.removeItem(i[l - 1]) : r.removeItem(o);
                                            const t = d.appendFormatTag(E, r.isFormatElement(E.nextElementSibling) ? E.nextElementSibling : null);
                                            r.copyFormatAttributes(t, E), d.setRange(t, 1, t, 1);
                                            break
                                        }
                                        if (e) {
                                            h.insertHTML(c.collapsed && r.isBreak(c.startContainer.childNodes[c.startOffset - 1]) ? "<br>" : "<br><br>", !0);
                                            let e = n.focusNode;
                                            const t = n.focusOffset;
                                            E === e && (e = e.childNodes[t - l > 1 ? t - 1 : t]), d.setRange(e, 1, e, 1)
                                        } else {
                                            const e = n.focusNode.nextSibling,
                                                t = r.createElement("BR");
                                            d.insertNode(t, null);
                                            const i = t.previousSibling,
                                                l = t.nextSibling;
                                            r.isBreak(e) || r.isBreak(i) || l && !r.onlyZeroWidthSpace(l) ? d.setRange(l, 0, l, 0) : (t.parentNode.insertBefore(t.cloneNode(!1), t), d.setRange(t, 1, t, 1))
                                        }
                                        u._onShortcutKey = !0;
                                        break
                                    }
                                    if (g) break;
                                    if (f && m && !r.isCell(f) && !/^FIGCAPTION$/i.test(f.nodeName)) {
                                        const e = d.getRange();
                                        if ((3 !== e.commonAncestorContainer.nodeType || !e.commonAncestorContainer.nextElementSibling) && r.onlyZeroWidthSpace(m.innerText.trim())) {
                                            t.preventDefault();
                                            let e = null;
                                            if (r.isListCell(f.parentNode)) {
                                                f = m.parentNode.parentNode.parentNode;
                                                const t = r.splitElement(m, null, r.getElementDepth(m) - 2);
                                                e = r.createElement("LI"), f.insertBefore(e, t)
                                            } else {
                                                const t = r.isCell(f.parentNode) ? "DIV" : r.isList(f.parentNode) ? "LI" : r.isFormatElement(f.nextElementSibling) ? f.nextElementSibling.nodeName : r.isFormatElement(f.previousElementSibling) ? f.previousElementSibling.nodeName : "P";
                                                e = r.createElement(t);
                                                const n = d.detachRangeFormatElement(f, [m], null, !0, !0);
                                                n.cc.insertBefore(e, n.ec)
                                            }
                                            e.innerHTML = "<br>", r.copyFormatAttributes(e, m), r.removeItemAllParents(m, null, null), d.setRange(e, 1, e, 1);
                                            break
                                        }
                                    }
                                    if (f && r.getParentElement(f, "FIGCAPTION") && r.getParentElement(f, r.isList) && (t.preventDefault(), m = d.appendFormatTag(m, null), d.setRange(m, 0, m, 0)), p) {
                                        t.preventDefault(), t.stopPropagation();
                                        const n = e[p],
                                            i = n._container,
                                            l = i.previousElementSibling || i.nextElementSibling;
                                        let s = null;
                                        r.isListCell(i.parentNode) ? s = r.createElement("BR") : (s = r.createElement(r.isFormatElement(l) ? l.nodeName : "P"), s.innerHTML = "<br>"), i.parentNode.insertBefore(s, i), d.callPlugin(p, (function() {
                                            const e = d.plugins.resizing.call_controller_resize.call(d, n._element, p);
                                            d.plugins[p].onModifyMode.call(d, n._element, e)
                                        }), null)
                                    }
                                    break;
                                case 27:
                                    if (p) return t.preventDefault(), t.stopPropagation(), d.controllersOff(), !1
                            }
                            if (i && /16/.test(n)) {
                                t.preventDefault(), t.stopPropagation();
                                const e = d.plugins.table;
                                if (e && !e._shift && !e._ref) {
                                    const t = r.getParentElement(m, r.isCell);
                                    if (t) return void e.onTableCellMultiSelect.call(d, t, !0)
                                }
                            }
                            if (!(l || s || g || u._nonTextKeyCode.test(n)) && c.collapsed && c.startContainer === c.endContainer && r.isBreak(c.commonAncestorContainer)) {
                                const e = r.createTextNode(r.zeroWidthSpace);
                                d.insertNode(e, null), d.setRange(e, 1, e, 1)
                            }
                            h.onKeyDown && h.onKeyDown(t, d)
                        },
                        onKeyUp_wysiwyg: function(e) {
                            if (u._onShortcutKey) return;
                            d._editorRange();
                            const t = d.getRange(),
                                n = e.keyCode,
                                i = e.ctrlKey || e.metaKey || 91 === n || 92 === n,
                                l = e.altKey;
                            let s = d.getSelectionNode();
                            if (d._isBalloon && (d._isBalloonAlways && 27 !== n || !t.collapsed)) {
                                if (!d._isBalloonAlways) return void u._showToolbarBalloon();
                                27 !== n && u._showToolbarBalloonDelay()
                            }
                            if (8 === n && r.isWysiwygDiv(s) && "" === s.textContent) {
                                e.preventDefault(), e.stopPropagation(), s.innerHTML = "";
                                const t = r.createElement(r.isFormatElement(d._variable.currentNodes[0]) ? d._variable.currentNodes[0] : "P");
                                return t.innerHTML = "<br>", s.appendChild(t), d.setRange(t, 0, t, 0), u._applyTagEffects(), void d.history.push(!1)
                            }
                            const o = r.getFormatElement(s, null),
                                a = r.getRangeFormatElement(s, null);
                            if ((o || !t.collapsed) && o !== a || r.isComponent(s) || (d._setDefaultFormat(r.isRangeFormatElement(a) ? "DIV" : "P"), s = d.getSelectionNode()), u._directionKeyCode.test(n) && u._applyTagEffects(), !i && !l && !u._nonTextKeyCode.test(n) && 3 === s.nodeType && r.zeroWidthRegExp.test(s.textContent) && r.getByteLength(e.key) < 3) {
                                let e = t.startOffset,
                                    n = t.endOffset;
                                const i = (s.textContent.substring(0, n).match(u._frontZeroWidthReg) || "").length;
                                e = t.startOffset - i, n = t.endOffset - i, s.textContent = s.textContent.replace(r.zeroWidthRegExp, ""), d.setRange(s, e < 0 ? 0 : e, s, n < 0 ? 0 : n)
                            }
                            d._charCount(""), d.history.push(!0), h.onKeyUp && h.onKeyUp(e, d)
                        },
                        onScroll_wysiwyg: function(e) {
                            d.controllersOff(), d._lineBreaker.style.display = "none", d._isBalloon && u._hideToolbar(), h.onScroll && h.onScroll(e, d)
                        },
                        onFocus_wysiwyg: function(e) {
                            d._antiBlur || (d.hasFocus = !0, d._isInline && u._showToolbarInline(), h.onFocus && h.onFocus(e, d))
                        },
                        onBlur_wysiwyg: function(e) {
                            d._antiBlur || (d.hasFocus = !1, d.controllersOff(), (d._isInline || d._isBalloon) && u._hideToolbar(), h.onBlur && h.onBlur(e, d))
                        },
                        onMouseDown_resizingBar: function(t) {
                            t.stopPropagation(), d._variable.resizeClientY = t.clientY, e.element.resizeBackground.style.display = "block", o.addEventListener("mousemove", u._resize_editor), o.addEventListener("mouseup", (function t() {
                                e.element.resizeBackground.style.display = "none", o.removeEventListener("mousemove", u._resize_editor), o.removeEventListener("mouseup", t)
                            }))
                        },
                        _resize_editor: function(t) {
                            const n = e.element.editorArea.offsetHeight + (t.clientY - d._variable.resizeClientY);
                            e.element.wysiwygFrame.style.height = e.element.code.style.height = (n < d._variable.minResizingSize ? d._variable.minResizingSize : n) + "px", d._variable.resizeClientY = t.clientY
                        },
                        onResize_window: function() {
                            if (d.controllersOff(), 0 !== e.element.toolbar.offsetWidth) return d._variable.isFullScreen ? (d._variable.innerHeight_fullScreen += a.innerHeight - e.element.toolbar.offsetHeight - d._variable.innerHeight_fullScreen, void(e.element.editorArea.style.height = d._variable.innerHeight_fullScreen + "px")) : void(d._variable.isCodeView && d._isInline ? u._showToolbarInline() : (d._iframeAutoHeight(), d._sticky && (e.element.toolbar.style.width = e.element.topArea.offsetWidth - 2 + "px", u.onScroll_window())))
                        },
                        onScroll_window: function() {
                            if (d._variable.isFullScreen || 0 === e.element.toolbar.offsetWidth || l.stickyToolbar < 0) return;
                            const t = e.element,
                                n = t.editorArea.offsetHeight,
                                i = (this.scrollY || o.documentElement.scrollTop) + l.stickyToolbar,
                                s = u._getEditorOffsets().top - (d._isInline ? t.toolbar.offsetHeight : 0);
                            i < s ? u._offStickyToolbar() : i + d._variable.minResizingSize >= n + s ? (d._sticky || u._onStickyToolbar(), t.toolbar.style.top = n + s + l.stickyToolbar - i - d._variable.minResizingSize + "px") : i >= s && u._onStickyToolbar()
                        },
                        _getEditorOffsets: function() {
                            let t = e.element.topArea,
                                n = 0,
                                i = 0,
                                l = 0;
                            for (; t;) n += t.offsetTop, i += t.offsetLeft, l += t.scrollTop, t = t.offsetParent;
                            return {
                                top: n,
                                left: i,
                                scroll: l
                            }
                        },
                        _getPageBottomSpace: function() {
                            return o.documentElement.scrollHeight - (u._getEditorOffsets().top + e.element.topArea.offsetHeight)
                        },
                        _onStickyToolbar: function() {
                            const t = e.element;
                            d._isInline || (t._stickyDummy.style.height = t.toolbar.offsetHeight + "px", t._stickyDummy.style.display = "block"), t.toolbar.style.top = l.stickyToolbar + "px", t.toolbar.style.width = d._isInline ? d._inlineToolbarAttr.width : t.toolbar.offsetWidth + "px", r.addClass(t.toolbar, "se-toolbar-sticky"), d._sticky = !0
                        },
                        _offStickyToolbar: function() {
                            const t = e.element;
                            t._stickyDummy.style.display = "none", t.toolbar.style.top = d._isInline ? d._inlineToolbarAttr.top : "", t.toolbar.style.width = d._isInline ? d._inlineToolbarAttr.width : "", t.editorArea.style.marginTop = "", r.removeClass(t.toolbar, "se-toolbar-sticky"), d._sticky = !1
                        },
                        _codeViewAutoHeight: function() {
                            e.element.code.style.height = e.element.code.scrollHeight + "px"
                        },
                        onPaste_wysiwyg: function(e) {
                            const t = e.clipboardData;
                            if (!t) return !0;
                            const n = t.getData("text/plain").replace(/\n/g, ""),
                                i = d.cleanHTML(t.getData("text/html"), d.pasteTagsWhitelistRegExp),
                                s = d._charCount("byte-html" === l.charCounterType ? i : n);
                            return ("function" != typeof h.onPaste || h.onPaste(e, i, s, d)) && s ? void(i ? (e.stopPropagation(), e.preventDefault(), h.insertHTML(i, !0)) : d.history.push(!0)) : (e.preventDefault(), e.stopPropagation(), !1)
                        },
                        onCut_wysiwyg: function() {
                            a.setTimeout((function() {
                                d.history.push(!1)
                            }))
                        },
                        onDragOver_wysiwyg: function(e) {
                            e.preventDefault()
                        },
                        onDrop_wysiwyg: function(t) {
                            const n = t.dataTransfer;
                            if (!n) return !0;
                            const i = n.files;
                            if (i.length > 0 && d.plugins.image) u._setDropLocationSelection(t), d.callPlugin("image", (function() {
                                e.image.imgInputFile.files = i, d.plugins.image.onRender_imgInput.call(d), e.image.imgInputFile.files = null
                            }), null);
                            else {
                                if (!d._charCount(n.getData("text/plain"))) return t.preventDefault(), t.stopPropagation(), !1; {
                                    const e = d.cleanHTML(n.getData("text/html"), d.pasteTagsWhitelistRegExp);
                                    e && (u._setDropLocationSelection(t), h.insertHTML(e, !0))
                                }
                            }
                            h.onDrop && h.onDrop(t, d)
                        },
                        onmouseMove_wysiwyg: function(t) {
                            const n = r.getParentElement(t.target, r.isComponent),
                                i = d._lineBreaker.style;
                            if (n) {
                                let s = 0,
                                    o = e.element.wysiwyg;
                                do {
                                    s += o.scrollTop, o = o.parentElement
                                } while (o && !/^(BODY|HTML)$/i.test(o.nodeName));
                                const a = e.element.wysiwyg.scrollTop,
                                    c = u._getEditorOffsets(),
                                    h = r.getOffset(n, e.element.wysiwygFrame).top + a,
                                    g = t.pageY + s + (l.iframe ? e.element.toolbar.offsetHeight : 0),
                                    p = h + (l.iframe ? s : c.top);
                                let m = "",
                                    f = "";
                                if (!r.isFormatElement(n.previousElementSibling) && g < p + 20) f = h, m = "t";
                                else {
                                    if (r.isFormatElement(n.nextElementSibling) || !(g > p + n.offsetHeight - 20)) return void(i.display = "none");
                                    f = h + n.offsetHeight, m = "b"
                                }
                                d._variable._lineBreakComp = n, d._variable._lineBreakDir = m, i.top = f - a + "px", i.visibility = "hidden", i.display = "block", d._lineBreakerButton.style.left = n.offsetLeft + n.offsetWidth / 2 - d._lineBreakerButton.offsetWidth / 2 + "px", i.visibility = ""
                            } else "none" !== i.display && (i.display = "none")
                        },
                        _onMouseDown_lineBreak: function(e) {
                            e.preventDefault()
                        },
                        _onLineBreak: function() {
                            const e = d._variable._lineBreakComp,
                                t = r.createElement("P");
                            t.innerHTML = "<br>", e.parentNode.insertBefore(t, "t" === d._variable._lineBreakDir ? e : e.nextSibling), d._lineBreaker.style.display = "none", d._variable._lineBreakComp = null, d.setRange(t.firstChild, 1, t.firstChild, 1), d.history.push(!1)
                        },
                        _setDropLocationSelection: function(e) {
                            e.stopPropagation(), e.preventDefault();
                            const t = d.getRange();
                            d.setRange(t.startContainer, t.startOffset, t.endContainer, t.endOffset)
                        },
                        _onChange_historyStack: function() {
                            u._applyTagEffects(), e.tool.save && e.tool.save.removeAttribute("disabled"), h.onChange && h.onChange(d.getContents(!0), d)
                        },
                        _addEvent: function() {
                            const t = l.iframe ? d._ww : e.element.wysiwyg;
                            e.element.toolbar.addEventListener("mousedown", u.onMouseDown_toolbar, !1), e.element.toolbar.addEventListener("click", u.onClick_toolbar, !1), t.addEventListener("mousedown", u.onMouseDown_wysiwyg, !1), t.addEventListener("click", u.onClick_wysiwyg, !1), t.addEventListener(r.isIE ? "textinput" : "input", u.onInput_wysiwyg, !1), t.addEventListener("keydown", u.onKeyDown_wysiwyg, !1), t.addEventListener("keyup", u.onKeyUp_wysiwyg, !1), t.addEventListener("paste", u.onPaste_wysiwyg, !1), t.addEventListener("cut", u.onCut_wysiwyg, !1), t.addEventListener("dragover", u.onDragOver_wysiwyg, !1), t.addEventListener("drop", u.onDrop_wysiwyg, !1), t.addEventListener("scroll", u.onScroll_wysiwyg, !1), t.addEventListener("focus", u.onFocus_wysiwyg, !1), t.addEventListener("blur", u.onBlur_wysiwyg, !1), t.addEventListener("mousemove", u.onmouseMove_wysiwyg, !1), d._lineBreakerButton.addEventListener("mousedown", u._onMouseDown_lineBreak, !1), d._lineBreakerButton.addEventListener("click", u._onLineBreak, !1), d.plugins.table && t.addEventListener("touchstart", u.onMouseDown_wysiwyg, {
                                passive: !0,
                                useCapture: !1
                            }), "auto" !== l.height || l.codeMirrorEditor || (e.element.code.addEventListener("keydown", u._codeViewAutoHeight, !1), e.element.code.addEventListener("keyup", u._codeViewAutoHeight, !1), e.element.code.addEventListener("paste", u._codeViewAutoHeight, !1)), e.element.resizingBar && (/\d+/.test(l.height) ? e.element.resizingBar.addEventListener("mousedown", u.onMouseDown_resizingBar, !1) : r.addClass(e.element.resizingBar, "se-resizing-none")), a.removeEventListener("resize", u.onResize_window), a.removeEventListener("scroll", u.onScroll_window), a.addEventListener("resize", u.onResize_window, !1), l.stickyToolbar > -1 && a.addEventListener("scroll", u.onScroll_window, !1)
                        },
                        _removeEvent: function() {
                            const t = l.iframe ? d._ww : e.element.wysiwyg;
                            e.element.toolbar.removeEventListener("mousedown", u.onMouseDown_toolbar), e.element.toolbar.removeEventListener("click", u.onClick_toolbar), t.removeEventListener("mousedown", u.onMouseDown_wysiwyg), t.removeEventListener("click", u.onClick_wysiwyg), t.removeEventListener(r.isIE ? "textinput" : "input", u.onInput_wysiwyg), t.removeEventListener("keydown", u.onKeyDown_wysiwyg), t.removeEventListener("keyup", u.onKeyUp_wysiwyg), t.removeEventListener("paste", u.onPaste_wysiwyg), t.removeEventListener("cut", u.onCut_wysiwyg), t.removeEventListener("dragover", u.onDragOver_wysiwyg), t.removeEventListener("drop", u.onDrop_wysiwyg), t.removeEventListener("scroll", u.onScroll_wysiwyg), t.removeEventListener("mousemove", u.onmouseMove_wysiwyg), d._lineBreakerButton.removeEventListener("mousedown", u._onMouseDown_lineBreak), d._lineBreakerButton.removeEventListener("click", u._onLineBreak), t.removeEventListener("touchstart", u.onMouseDown_wysiwyg, {
                                passive: !0,
                                useCapture: !1
                            }), t.removeEventListener("focus", u.onFocus_wysiwyg), t.removeEventListener("blur", u.onBlur_wysiwyg), e.element.code.removeEventListener("keydown", u._codeViewAutoHeight), e.element.code.removeEventListener("keyup", u._codeViewAutoHeight), e.element.code.removeEventListener("paste", u._codeViewAutoHeight), e.element.resizingBar && e.element.resizingBar.removeEventListener("mousedown", u.onMouseDown_resizingBar), a.removeEventListener("resize", u.onResize_window), a.removeEventListener("scroll", u.onScroll_window)
                        }
                    },
                    h = {
                        core: d,
                        util: r,
                        onload: null,
                        onScroll: null,
                        onMouseDown: null,
                        onClick: null,
                        onInput: null,
                        onKeyDown: null,
                        onKeyUp: null,
                        onDrop: null,
                        onChange: null,
                        onPaste: null,
                        onFocus: null,
                        onBlur: null,
                        showInline: null,
                        showController: null,
                        imageUploadHandler: null,
                        onImageUploadBefore: null,
                        onImageUpload: null,
                        onImageUploadError: null,
                        onVideoUpload: null,
                        setOptions: function(s) {
                            u._removeEvent(), d.plugins = s.plugins || d.plugins;
                            const o = [s, s].reduce((function(e, t) {
                                    for (let n in t)
                                        if ("plugins" === n && t[n] && e[n]) {
                                            let i = e[n],
                                                l = t[n];
                                            i = i.length ? i : a.Object.keys(i).map((function(e) {
                                                return i[e]
                                            })), l = l.length ? l : a.Object.keys(l).map((function(e) {
                                                return l[e]
                                            })), e[n] = l.filter((function(e) {
                                                return -1 === i.indexOf(e)
                                            })).concat(i)
                                        } else e[n] = t[n];
                                    return e
                                }), {}),
                                r = b._setOptions(o, e, d.plugins, s);
                            r.callButtons && (t = r.callButtons, d.initPlugins = {}), r.plugins && (d.plugins = n = r.plugins);
                            const c = e.element.wysiwyg.innerHTML,
                                h = e.element,
                                g = {
                                    _top: h.topArea,
                                    _relative: h.relative,
                                    _toolBar: h.toolbar,
                                    _editorArea: h.editorArea,
                                    _wysiwygArea: h.wysiwygFrame,
                                    _codeArea: h.code,
                                    _placeholder: h.placeholder,
                                    _resizingBar: h.resizingBar,
                                    _navigation: h.navigation,
                                    _charCounter: h.charCounter,
                                    _charWrapper: h.charWrapper,
                                    _loading: h.loading,
                                    _lineBreaker: h.lineBreaker,
                                    _resizeBack: h.resizeBackground,
                                    _stickyDummy: h._stickyDummy,
                                    _arrow: h._arrow
                                };
                            l = o, d.lang = i = l.lang, d.context = e = v(e.element.originElement, g, l), d._componentsInfoReset = !0, d._init(!0, c), u._addEvent(), d._charCount(""), u._offStickyToolbar(), u.onResize_window()
                        },
                        setDefaultStyle: function(t) {
                            const n = r._setDefaultOptionStyle(l);
                            "string" == typeof t && t.trim().length > 0 ? e.element.wysiwyg.style.cssText = n + t : e.element.wysiwyg.style.cssText = n
                        },
                        noticeOpen: function(e) {
                            d.notice.open.call(d, e)
                        },
                        noticeClose: function() {
                            d.notice.close.call(d)
                        },
                        save: function() {
                            e.element.originElement.value = d.getContents(!1)
                        },
                        getContext: function() {
                            return e
                        },
                        getContents: function(e) {
                            return d.getContents(e)
                        },
                        getCharCount: function(t) {
                            return t = "string" == typeof t ? t : l.charCounterType, d._getCharLength("byte-html" === t ? e.element.wysiwyg.innerHTML : e.element.wysiwyg.textContent, t)
                        },
                        getImagesInfo: function() {
                            return e.image ? e.image._imagesInfo : []
                        },
                        getVideosInfo: function() {
                            return e.video ? e.video._videosInfo : []
                        },
                        insertImage: function(e) {
                            d.plugins.image && e && (d.initPlugins.image ? d.plugins.image.submitAction.call(d, e) : d.callPlugin("image", d.plugins.image.submitAction.bind(d, e), null), d.focus())
                        },
                        insertHTML: function(e, t) {
                            if ("string" == typeof e) {
                                t || (e = d.cleanHTML(e, null));
                                try {
                                    const t = o.createRange().createContextualFragment(e).childNodes;
                                    let n, i, l;
                                    for (; n = t[0];) l = d.insertNode(n, i), i = n;
                                    const s = 3 === i.nodeType ? l.endOffset || i.textContent.length : i.childNodes.length;
                                    d.setRange(i, s, i, s)
                                } catch (t) {
                                    d.execCommand("insertHTML", !1, e)
                                }
                            } else if (r.isComponent(e)) d.insertComponent(e, !1);
                            else {
                                let t = null;
                                (r.isFormatElement(e) || r.isMedia(e)) && (t = r.getFormatElement(d.getSelectionNode(), null)), d.insertNode(e, t)
                            }
                            d.effectNode = null, d.focus(), d.history.push(!1)
                        },
                        setContents: function(e) {
                            d.setContents(e)
                        },
                        appendContents: function(t) {
                            const n = d.convertContentsForEditor(t);
                            if (d._variable.isCodeView) d._setCodeView(d._getCodeView() + "\n" + d.convertHTMLForCodeView(n));
                            else {
                                const t = r.createElement("DIV");
                                t.innerHTML = n;
                                const i = e.element.wysiwyg,
                                    l = t.children;
                                for (let e = 0, t = l.length; e < t; e++) i.appendChild(l[e])
                            }
                            d.history.push(!1)
                        },
                        disabled: function() {
                            e.tool.cover.style.display = "block", e.element.wysiwyg.setAttribute("contenteditable", !1), l.codeMirrorEditor ? l.codeMirrorEditor.setOption("readOnly", !0) : e.element.code.setAttribute("disabled", "disabled")
                        },
                        enabled: function() {
                            e.tool.cover.style.display = "none", e.element.wysiwyg.setAttribute("contenteditable", !0), l.codeMirrorEditor ? l.codeMirrorEditor.setOption("readOnly", !1) : e.element.code.removeAttribute("disabled")
                        },
                        show: function() {
                            const t = e.element.topArea.style;
                            "none" === t.display && (t.display = l.display)
                        },
                        hide: function() {
                            e.element.topArea.style.display = "none"
                        },
                        destroy: function() {
                            for (var n in d.history._destroy(), u._removeEvent(), r.removeItem(e.element.topArea), d) delete d[n];
                            for (var n in u) delete u[n];
                            for (var n in e) delete e[n];
                            for (var n in t) delete t[n];
                            for (var n in this) delete this[n]
                        },
                        toolbar: {
                            disabled: function() {
                                e.tool.cover.style.display = "block"
                            },
                            enabled: function() {
                                e.tool.cover.style.display = "none"
                            },
                            show: function() {
                                d._isInline ? u._showToolbarInline() : (e.element.toolbar.style.display = "", e.element._stickyDummy.style.display = "")
                            },
                            hide: function() {
                                d._isInline ? u._hideToolbar() : (e.element.toolbar.style.display = "none", e.element._stickyDummy.style.display = "none")
                            }
                        }
                    };
                return d._init(!1, null), u._addEvent(), d._charCount(""), d.functions = h, d.addModule([y]), h
            },
            C = {
                init: function(e) {
                    return {
                        create: function(t, n) {
                            return this.create(t, n, e)
                        }.bind(this)
                    }
                },
                create: function(e, t, n) {
                    "object" != typeof t && (t = {}), n && (t = [n, t].reduce((function(e, t) {
                        for (let n in t)
                            if ("plugins" === n && t[n] && e[n]) {
                                let i = e[n],
                                    l = t[n];
                                i = i.length ? i : Object.keys(i).map((function(e) {
                                    return i[e]
                                })), l = l.length ? l : Object.keys(l).map((function(e) {
                                    return l[e]
                                })), e[n] = l.filter((function(e) {
                                    return -1 === i.indexOf(e)
                                })).concat(i)
                            } else e[n] = t[n];
                        return e
                    }), {}));
                    const i = "string" == typeof e ? document.getElementById(e) : e;
                    if (!i) {
                        if ("string" == typeof e) throw Error('[SUNEDITOR.create.fail] The element for that id was not found (ID:"' + e + '")');
                        throw Error("[SUNEDITOR.create.fail] suneditor requires textarea's element or id value")
                    }
                    const l = b.init(i, t);
                    if (l.constructed._top.id && document.getElementById(l.constructed._top.id)) throw Error('[SUNEDITOR.create.fail] The ID of the suneditor you are trying to create already exists (ID:"' + l.constructed._top.id + '")');
                    return i.style.display = "none", l.constructed._top.style.display = "block", "object" == typeof i.nextElementSibling ? i.parentNode.insertBefore(l.constructed._top, i.nextElementSibling) : i.parentNode.appendChild(l.constructed._top), x(v(i, l.constructed, l.options), l.pluginCallButtons, l.plugins, l.options.lang, t, l._icons)
                }
            };
        window.SUNEDITOR = C.init({
            plugins: h
        })
    },
    ee5k: function(e, t, n) {
        "use strict";
        var i, l;
        i = "undefined" != typeof window ? window : this, l = function(e, t) {
            const n = {
                name: "resizing",
                add: function(e) {
                    const t = e.icons,
                        n = e.context;
                    n.resizing = {
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
                        _isChange: !1,
                        alignIcons: {
                            basic: t.align_justify,
                            left: t.align_left,
                            right: t.align_right,
                            center: t.align_center
                        }
                    };
                    let i = this.setController_resize.call(e);
                    n.resizing.resizeContainer = i, n.resizing.resizeDiv = i.querySelector(".se-modal-resize"), n.resizing.resizeDot = i.querySelector(".se-resize-dot"), n.resizing.resizeDisplay = i.querySelector(".se-resize-display");
                    let l = this.setController_button.call(e);
                    n.resizing.resizeButton = l, l.addEventListener("mousedown", (function(e) {
                        e.stopPropagation()
                    }), !1);
                    let s = n.resizing.resizeHandles = n.resizing.resizeDot.querySelectorAll("span");
                    n.resizing.resizeButtonGroup = l.querySelector("._se_resizing_btn_group"), n.resizing.rotationButtons = l.querySelectorAll("._se_resizing_btn_group ._se_rotation"), n.resizing.percentageButtons = l.querySelectorAll("._se_resizing_btn_group ._se_percentage"), n.resizing.alignMenu = l.querySelector(".se-resizing-align-list"), n.resizing.alignMenuList = n.resizing.alignMenu.querySelectorAll("button"), n.resizing.alignButton = l.querySelector("._se_resizing_align_button"), n.resizing.autoSizeButton = l.querySelector("._se_resizing_btn_group ._se_auto_size"), n.resizing.captionButton = l.querySelector("._se_resizing_caption_button"), s[0].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[1].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[2].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[3].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[4].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[5].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[6].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), s[7].addEventListener("mousedown", this.onMouseDown_resize_handle.bind(e)), l.addEventListener("click", this.onClick_resizeButton.bind(e)), n.element.relative.appendChild(i), n.element.relative.appendChild(l), i = null, l = null, s = null
                },
                setController_resize: function() {
                    const e = this.util.createElement("DIV");
                    return e.className = "se-controller se-resizing-container", e.style.display = "none", e.innerHTML = '<div class="se-modal-resize"></div><div class="se-resize-dot"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span><span class="lw"></span><span class="th"></span><span class="rw"></span><span class="bh"></span><div class="se-resize-display"></div></div>', e
                },
                setController_button: function() {
                    const e = this.lang,
                        t = this.icons,
                        n = this.util.createElement("DIV");
                    return n.className = "se-controller se-controller-resizing", n.innerHTML = '<div class="se-arrow se-arrow-up"></div><div class="se-btn-group _se_resizing_btn_group"><button type="button" data-command="percent" data-value="1" class="se-tooltip _se_percentage"><span>100%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize100 + '</span></span></button><button type="button" data-command="percent" data-value="0.75" class="se-tooltip _se_percentage"><span>75%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize75 + '</span></span></button><button type="button" data-command="percent" data-value="0.5" class="se-tooltip _se_percentage"><span>50%</span><span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.resize50 + '</span></span></button><button type="button" data-command="auto" class="se-btn se-tooltip _se_auto_size">' + t.auto_size + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.autoSize + '</span></span></button><button type="button" data-command="rotate" data-value="-90" class="se-btn se-tooltip _se_rotation">' + t.rotate_left + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.rotateLeft + '</span></span></button><button type="button" data-command="rotate" data-value="90" class="se-btn se-tooltip _se_rotation">' + t.rotate_right + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.rotateRight + '</span></span></button></div><div class="se-btn-group" style="padding-top: 0;"><button type="button" data-command="mirror" data-value="h" class="se-btn se-tooltip">' + t.mirror_horizontal + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mirrorHorizontal + '</span></span></button><button type="button" data-command="mirror" data-value="v" class="se-btn se-tooltip">' + t.mirror_vertical + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.mirrorVertical + '</span></span></button><button type="button" data-command="onalign" class="se-btn se-tooltip _se_resizing_align_button">' + t.align_justify + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.toolbar.align + '</span></span></button><div class="se-btn-group-sub sun-editor-common se-list-layer se-resizing-align-list"><div class="se-list-inner"><ul class="se-list-basic"><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="basic">' + t.align_justify + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.basic + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="left">' + t.align_left + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.left + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="center">' + t.align_center + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.center + '</span></span></button></li><li><button type="button" class="se-btn-list se-tooltip" data-command="align" data-value="right">' + t.align_right + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.right + '</span></span></button></li></ul></div></div><button type="button" data-command="caption" class="se-btn se-tooltip _se_resizing_caption_button">' + t.caption + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.caption + '</span></span></button><button type="button" data-command="revert" class="se-btn se-tooltip">' + t.revert + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.dialogBox.revertButton + '</span></span></button><button type="button" data-command="update" class="se-btn se-tooltip">' + t.modify + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.edit + '</span></span></button><button type="button" data-command="delete" class="se-btn se-tooltip">' + t.delete + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + e.controller.remove + "</span></span></button></div>", n
                },
                _module_getSizeX: function(e, t, n, i) {
                    return t || (t = e._element), n || (n = e._cover), i || (i = e._container), i && n && t ? /%$/.test(t.style.width) ? (this.util.getNumber(i.style.width, 2) || 100) + "%" : t.style.width : ""
                },
                _module_getSizeY: function(e, t, n, i) {
                    return t || (t = e._element), n || (n = e._cover), i || (i = e._container), i && n && t ? this.util.getNumber(n.style.paddingBottom, 0) > 0 && !this.context.resizing._rotateVertical ? n.style.height : /%$/.test(t.style.height) && /%$/.test(t.style.width) ? (this.util.getNumber(i.style.height, 2) || 100) + "%" : t.style.height : ""
                },
                _module_setModifyInputSize: function(e, t) {
                    const n = e._onlyPercentage && this.context.resizing._rotateVertical;
                    e.proportion.checked = e._proportionChecked = "false" !== e._element.getAttribute("data-proportion");
                    let i = n ? "" : this.plugins.resizing._module_getSizeX.call(this, e);
                    if (i === e._defaultSizeX && (i = ""), e._onlyPercentage && (i = this.util.getNumber(i, 2)), e.inputX.value = i, t.setInputSize.call(this, "x"), !e._onlyPercentage) {
                        let t = n ? "" : this.plugins.resizing._module_getSizeY.call(this, e);
                        t === e._defaultSizeY && (t = ""), e._onlyPercentage && (t = this.util.getNumber(t, 2)), e.inputY.value = t
                    }
                    e.inputX.disabled = !!n, e.inputY.disabled = !!n, e.proportion.disabled = !!n, t.setRatio.call(this)
                },
                _module_setInputSize: function(e, t) {
                    if (e._onlyPercentage) "x" === t && e.inputX.value > 100 && (e.inputX.value = 100);
                    else if (e.proportion.checked && e._ratio && /\d/.test(e.inputX.value) && /\d/.test(e.inputY.value)) {
                        const n = e.inputX.value.replace(/\d+|\./g, "") || e.sizeUnit,
                            i = e.inputY.value.replace(/\d+|\./g, "") || e.sizeUnit;
                        if (n !== i) return;
                        const l = "%" === n ? 2 : 0;
                        "x" === t ? e.inputY.value = this.util.getNumber(e._ratioY * this.util.getNumber(e.inputX.value, l), l) + i : e.inputX.value = this.util.getNumber(e._ratioX * this.util.getNumber(e.inputY.value, l), l) + n
                    }
                },
                _module_setRatio: function(e) {
                    const t = e.inputX.value,
                        n = e.inputY.value;
                    if (e.proportion.checked && /\d+/.test(t) && /\d+/.test(n)) {
                        if ((t.replace(/\d+|\./g, "") || e.sizeUnit) !== (n.replace(/\d+|\./g, "") || e.sizeUnit)) e._ratio = !1;
                        else if (!e._ratio) {
                            const i = this.util.getNumber(t, 0),
                                l = this.util.getNumber(n, 0);
                            e._ratio = !0, e._ratioX = i / l, e._ratioY = l / i
                        }
                    } else e._ratio = !1
                },
                _module_sizeRevert: function(e) {
                    e._onlyPercentage ? e.inputX.value = e._origin_w > 100 ? 100 : e._origin_w : (e.inputX.value = e._origin_w, e.inputY.value = e._origin_h)
                },
                _module_saveCurrentSize: function(e) {
                    const t = this.plugins.resizing._module_getSizeX.call(this, e),
                        n = this.plugins.resizing._module_getSizeY.call(this, e);
                    e._element.setAttribute("data-size", t + "," + n), e._videoRatio && (e._videoRatio = n)
                },
                call_controller_resize: function(e, t) {
                    const n = this.context.resizing,
                        i = this.context[t];
                    n._resize_plugin = t;
                    const l = n.resizeContainer,
                        s = n.resizeDiv,
                        o = this.util.getOffset(e, this.context.element.wysiwygFrame),
                        a = n._rotateVertical = /^(90|270)$/.test(Math.abs(e.getAttribute("data-rotate")).toString()),
                        r = a ? e.offsetHeight : e.offsetWidth,
                        c = a ? e.offsetWidth : e.offsetHeight,
                        d = o.top,
                        u = o.left - this.context.element.wysiwygFrame.scrollLeft;
                    l.style.top = d + "px", l.style.left = u + "px", l.style.width = r + "px", l.style.height = c + "px", s.style.top = "0px", s.style.left = "0px", s.style.width = r + "px", s.style.height = c + "px";
                    let h = e.getAttribute("data-align") || "basic";
                    h = "none" === h ? "basic" : h;
                    const g = this.util.getParentElement(e, this.util.isComponent),
                        p = this.util.getParentElement(e, "FIGURE"),
                        m = this.plugins.resizing._module_getSizeX.call(this, i, e, p, g) || "auto",
                        f = i._onlyPercentage && "image" === t ? "" : ", " + (this.plugins.resizing._module_getSizeY.call(this, i, e, p, g) || "auto");
                    this.util.changeTxt(n.resizeDisplay, this.lang.dialogBox[h] + " (" + m + f + ")"), n.resizeButtonGroup.style.display = i._resizing ? "" : "none";
                    const _ = !i._resizing || i._resizeDotHide || i._onlyPercentage ? "none" : "flex",
                        b = n.resizeHandles;
                    for (let e = 0, t = b.length; e < t; e++) b[e].style.display = _;
                    if (i._resizing) {
                        const e = n.rotationButtons;
                        e[0].style.display = e[1].style.display = i._rotation ? "" : "none"
                    }
                    const v = n.alignMenuList;
                    this.util.changeElement(n.alignButton.querySelector("svg"), n.alignIcons[h]);
                    for (let e = 0, t = v.length; e < t; e++) v[e].getAttribute("data-value") === h ? this.util.addClass(v[e], "on") : this.util.removeClass(v[e], "on");
                    const y = n.percentageButtons,
                        x = /%$/.test(e.style.width) && /%$/.test(g.style.width) ? this.util.getNumber(g.style.width, 0) / 100 + "" : "";
                    for (let e = 0, t = y.length; e < t; e++) y[e].getAttribute("data-value") === x ? this.util.addClass(y[e], "active") : this.util.removeClass(y[e], "active");
                    i._captionShow ? (n.captionButton.style.display = "", this.util.getChildElement(e.parentNode, "figcaption") ? (this.util.addClass(n.captionButton, "active"), i._captionChecked = !0) : (this.util.removeClass(n.captionButton, "active"), i._captionChecked = !1)) : n.captionButton.style.display = "none", this._resizingName = t, this.util.toggleDisabledButtons(!0, this.resizingDisabledButtons), this.controllersOn(n.resizeContainer, n.resizeButton, this.util.toggleDisabledButtons.bind(this, !1, this.resizingDisabledButtons), e, t);
                    const C = this.context.element.wysiwygFrame.offsetWidth - u - n.resizeButton.offsetWidth;
                    n.resizeButton.style.top = c + d + 60 + "px", n.resizeButton.style.left = u + (C < 0 ? C : 0) + "px", n.resizeButton.firstElementChild.style.left = C < 0 ? 20 - C + "px" : "20px", n._resize_w = r, n._resize_h = c;
                    const w = (e.getAttribute("origin-size") || "").split(",");
                    return n._origin_w = w[0] || e.naturalWidth, n._origin_h = w[1] || e.naturalHeight, {
                        w: r,
                        h: c,
                        t: d,
                        l: u
                    }
                },
                _closeAlignMenu: null,
                openAlignMenu: function() {
                    this.util.addClass(this.context.resizing.alignButton, "on"), this.context.resizing.alignMenu.style.display = "block", this.plugins.resizing._closeAlignMenu = function() {
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
                    const n = this.util.createElement("DIV");
                    return n.className = "se-component " + t, n.setAttribute("contenteditable", !1), n.appendChild(e), n
                },
                onClick_resizeButton: function(e) {
                    e.stopPropagation();
                    const t = e.target,
                        n = t.getAttribute("data-command") || t.parentNode.getAttribute("data-command");
                    if (!n) return;
                    const i = t.getAttribute("data-value") || t.parentNode.getAttribute("data-value"),
                        l = this.context.resizing._resize_plugin,
                        s = this.context[l],
                        o = s._element,
                        a = this.plugins[l];
                    if (e.preventDefault(), "function" != typeof this.plugins.resizing._closeAlignMenu || (this.plugins.resizing._closeAlignMenu(), "onalign" !== n)) {
                        switch (n) {
                            case "auto":
                                a.setAutoSize.call(this), a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l));
                                break;
                            case "percent":
                                let e = this.plugins.resizing._module_getSizeY.call(this, s);
                                if (this.context.resizing._rotateVertical) {
                                    const t = o.getAttribute("data-percentage");
                                    t && (e = t.split(",")[1])
                                }
                                this.plugins.resizing.resetTransform.call(this, o), a.setPercentSize.call(this, 100 * i, null !== this.util.getNumber(e, 0) && /%$/.test(e) ? e : ""), a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l));
                                break;
                            case "mirror":
                                const t = o.getAttribute("data-rotate") || "0";
                                let n = o.getAttribute("data-rotateX") || "",
                                    r = o.getAttribute("data-rotateY") || "";
                                "h" === i && !this.context.resizing._rotateVertical || "v" === i && this.context.resizing._rotateVertical ? r = r ? "" : "180" : n = n ? "" : "180", o.setAttribute("data-rotateX", n), o.setAttribute("data-rotateY", r), this.plugins.resizing._setTransForm(o, t, n, r);
                                break;
                            case "rotate":
                                const c = this.context.resizing,
                                    d = 1 * o.getAttribute("data-rotate") + 1 * i,
                                    u = this._w.Math.abs(d) >= 360 ? 0 : d;
                                o.setAttribute("data-rotate", u), c._rotateVertical = /^(90|270)$/.test(this._w.Math.abs(u).toString()), this.plugins.resizing.setTransformSize.call(this, o, null, null), a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l));
                                break;
                            case "onalign":
                                return void this.plugins.resizing.openAlignMenu.call(this);
                            case "align":
                                const h = "basic" === i ? "none" : i;
                                a.setAlign.call(this, h, null, null, null), a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l));
                                break;
                            case "caption":
                                const g = !s._captionChecked;
                                if (a.openModify.call(this, !0), s._captionChecked = s.captionCheckEl.checked = g, "image" === l ? a.update_image.call(this, !1, !1, !1) : "video" === l && (this.context.dialog.updateModal = !0, a.submitAction.call(this)), g) {
                                    const e = this.util.getChildElement(s._caption, (function(e) {
                                        return 3 === e.nodeType
                                    }));
                                    e ? this.setRange(e, 0, e, e.textContent.length) : s._caption.focus(), this.controllersOff()
                                } else a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l)), a.openModify.call(this, !0);
                                break;
                            case "revert":
                                a.setOriginSize.call(this), a.onModifyMode.call(this, o, this.plugins.resizing.call_controller_resize.call(this, o, l));
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
                setTransformSize: function(e, t, n) {
                    let i = e.getAttribute("data-percentage");
                    const l = this.context.resizing._rotateVertical,
                        s = 1 * e.getAttribute("data-rotate");
                    let o = "";
                    if (i && !l) i = i.split(","), "auto" === i[0] && "auto" === i[1] ? this.plugins[this.context.resizing._resize_plugin].setAutoSize.call(this) : this.plugins[this.context.resizing._resize_plugin].setPercentSize.call(this, i[0], i[1]);
                    else {
                        const i = this.util.getParentElement(e, "FIGURE"),
                            a = t || e.offsetWidth,
                            r = n || e.offsetHeight,
                            c = (l ? r : a) + "px",
                            d = (l ? a : r) + "px";
                        if (this.plugins[this.context.resizing._resize_plugin].cancelPercentAttr.call(this), this.plugins[this.context.resizing._resize_plugin].setSize.call(this, a + "px", r + "px", !0), i.style.width = c, i.style.height = this.context[this.context.resizing._resize_plugin]._caption ? "" : d, l) {
                            let e = a / 2 + "px " + a / 2 + "px 0",
                                t = r / 2 + "px " + r / 2 + "px 0";
                            o = 90 === s || -270 === s ? t : e
                        }
                    }
                    e.style.transformOrigin = o, this.plugins.resizing._setTransForm(e, s.toString(), e.getAttribute("data-rotateX") || "", e.getAttribute("data-rotateY") || ""), e.style.maxWidth = l ? "none" : "", this.plugins.resizing.setCaptionPosition.call(this, e)
                },
                _setTransForm: function(e, t, n, i) {
                    let l = (e.offsetWidth - e.offsetHeight) * (/-/.test(t) ? 1 : -1),
                        s = "";
                    if (/[1-9]/.test(t) && (n || i)) switch (s = n ? "Y" : "X", t) {
                        case "90":
                            s = n && i ? "X" : i ? s : "";
                            break;
                        case "270":
                            l *= -1, s = n && i ? "Y" : n ? s : "";
                            break;
                        case "-90":
                            s = n && i ? "Y" : n ? s : "";
                            break;
                        case "-270":
                            l *= -1, s = n && i ? "X" : i ? s : "";
                            break;
                        default:
                            s = ""
                    }
                    t % 180 == 0 && (e.style.maxWidth = ""), e.style.transform = "rotate(" + t + "deg)" + (n ? " rotateX(" + n + "deg)" : "") + (i ? " rotateY(" + i + "deg)" : "") + (s ? " translate" + s + "(" + l + "px)" : "")
                },
                setCaptionPosition: function(e) {
                    const t = this.util.getChildElement(this.util.getParentElement(e, "FIGURE"), "FIGCAPTION");
                    t && (t.style.marginTop = (this.context.resizing._rotateVertical ? e.offsetWidth - e.offsetHeight : 0) + "px")
                },
                onMouseDown_resize_handle: function(e) {
                    const t = this.context.resizing,
                        n = t._resize_direction = e.target.classList[0];
                    e.stopPropagation(), e.preventDefault();
                    const i = this.context.resizing._resize_plugin,
                        l = this.context[i]._element,
                        s = this.plugins[i];
                    t._resizeClientX = e.clientX, t._resizeClientY = e.clientY, this.context.element.resizeBackground.style.display = "block", t.resizeButton.style.display = "none", t.resizeDiv.style.float = /l/.test(n) ? "right" : /r/.test(n) ? "left" : "none";
                    const o = function(e) {
                            if ("keydown" === e.type && 27 !== e.keyCode) return;
                            const i = t._isChange;
                            t._isChange = !1, this.removeDocEvent("mousemove", a), this.removeDocEvent("mouseup", o), this.removeDocEvent("keydown", o), "keydown" === e.type ? (this.controllersOff(), this.context.element.resizeBackground.style.display = "none", this.plugins[this.context.resizing._resize_plugin].init.call(this)) : (this.plugins.resizing.cancel_controller_resize.call(this, n), i && this.history.push(!1)), s.onModifyMode.call(this, l, this.plugins.resizing.call_controller_resize.call(this, l, t._resize_plugin))
                        }.bind(this),
                        a = this.plugins.resizing.resizing_element.bind(this, t, n, this.context[t._resize_plugin]);
                    this.addDocEvent("mousemove", a), this.addDocEvent("mouseup", o), this.addDocEvent("keydown", o)
                },
                resizing_element: function(e, t, n, i) {
                    const l = i.clientX,
                        s = i.clientY;
                    let o = n._element_w,
                        a = n._element_h;
                    const r = n._element_w + (/r/.test(t) ? l - e._resizeClientX : e._resizeClientX - l),
                        c = n._element_h + (/b/.test(t) ? s - e._resizeClientY : e._resizeClientY - s),
                        d = n._element_h / n._element_w * r;
                    /t/.test(t) && (e.resizeDiv.style.top = n._element_h - (/h/.test(t) ? c : d) + "px"), /l/.test(t) && (e.resizeDiv.style.left = n._element_w - r + "px"), /r|l/.test(t) && (e.resizeDiv.style.width = r + "px", o = r), /^(t|b)[^h]$/.test(t) ? (e.resizeDiv.style.height = d + "px", a = d) : /^(t|b)h$/.test(t) && (e.resizeDiv.style.height = c + "px", a = c), e._resize_w = o, e._resize_h = a, this.util.changeTxt(e.resizeDisplay, this._w.Math.round(o) + " x " + this._w.Math.round(a)), e._isChange = !0
                },
                cancel_controller_resize: function(e) {
                    const t = this.context.resizing._rotateVertical;
                    this.controllersOff(), this.context.element.resizeBackground.style.display = "none";
                    let n = this._w.Math.round(t ? this.context.resizing._resize_h : this.context.resizing._resize_w),
                        i = this._w.Math.round(t ? this.context.resizing._resize_w : this.context.resizing._resize_h);
                    if (!t && !/%$/.test(n)) {
                        const e = 16,
                            t = this.context.element.wysiwygFrame.clientWidth - 2 * e - 2;
                        this.util.getNumber(n, 0) > t && (i = this._w.Math.round(i / n * t), n = t)
                    }
                    this.plugins[this.context.resizing._resize_plugin].setSize.call(this, n, i, !1, e), this.plugins[this.context.resizing._resize_plugin].init.call(this)
                }
            };
            return void 0 === t && (e.SUNEDITOR_MODULES || (e.SUNEDITOR_MODULES = {}), e.SUNEDITOR_MODULES.resizing = n), n
        }, "object" == typeof e.exports ? e.exports = i.document ? l(i, !0) : function(e) {
            if (!e.document) throw new Error("SUNEDITOR_MODULES a window with a document");
            return l(e)
        } : l(i)
    }
});