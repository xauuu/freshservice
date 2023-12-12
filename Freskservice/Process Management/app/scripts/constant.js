const ACTION_TYPES = {
    GROUP_APPROVAL_CREATE: "GROUP_APPROVAL_CREATE",
    GROUP_APPROVAL_UPDATE: "GROUP_APPROVAL_UPDATE",
    EMAIL_TEMPLATE_CREATE: "EMAIL_TEMPLATE_CREATE",
    EMAIL_TEMPLATE_UPDATE: "EMAIL_TEMPLATE_UPDATE",
    SERVICE_REQUEST_CREATE: "SERVICE_REQUEST_CREATE",
    SERVICE_REQUEST_UPDATE: "SERVICE_REQUEST_UPDATE",
    STATE_APPROVAL_CREATE: "STATE_APPROVAL_CREATE",
    STATE_APPROVAL_UPDATE: "STATE_APPROVAL_UPDATE",
    WORKFLOW_CREATE: "WORKFLOW_CREATE",
    WORKFLOW_UPDATE: "WORKFLOW_UPDATE",
    CONDITION_CREATE: "CONDITION_CREATE",
    CONDITION_UPDATE: "CONDITION_UPDATE",
    CLOSE_MODAL: "CLOSE_MODAL",
    LIST_DATA: "LIST_DATA",
    SERVICE_ITEM: "SERVICE_ITEM",
    CUSTOM_OBJECT: "CUSTOM_OBJECT",
    CUSTOM_OBJECT_FIELDS: "CUSTOM_OBJECT_FIELDS",
    DOCUMENT_TEMPLATE: "DOCUMENT_TEMPLATE",
    TABS_CONFIG: "TABS_CONFIG"
};

const FROALA_OPTIONS = {
    key: "7MD3aG3A2C4C3D-13TMIBDIa2NTMNZFFPFZe2a1Id1f1I1fA8D6C4F4G3H3B2A18A17B7==",
    placeholderText: "",
    toolbarButtons: [
        "bold",
        "italic",
        "underline",
        "formatOL",
        "formatUL",
        "textColor",
        "backgroundColor",
        "outdent",
        "indent",
        "insertLink",
        "insertImage",
        "clearFormatting"
    ],
    quickInsertEnabled: !1,
    pasteDeniedAttrs: ["class", "id"],
    pasteDeniedStyleProps: [
        "background",
        "background-color",
        "margin-top",
        "margin-right",
        "word-spacing",
        "float",
        "outline",
        "font-style",
        "vertical-align",
        "text-rendering",
        "font-variant",
        "letter-spacing",
        "orphans",
        "text-transform",
        "white-space",
        "widows",
        "-webkit-text-stroke-width",
        "display",
        "position",
        "overflow",
        "text-overflow",
        "text-decoration",
        "font-variant-ligatures",
        "font-variant-caps"
    ],
    pasteAllowedStyleProps: [".*"],
    pasteDeniedTags: ["meta"],
    wordPasteTableFullWidth: !1,
    richText: !0,
    attribution: !1,
    videoUpload: !1,
    imageUploadURL: "/api/_/inline_images",
    imageDefaultWidth: "auto",
    imageInsertButtons: ["imageUpload", "imageByURL"],
    requestWithCredentials: !0,
    imageDefaultAlign: "left",
    imageUploadRemoteUrls: !1,
    focusOnMarker: !0,
    pasteDeniedStyleProps: [
        "background",
        "background-color",
        "margin-top",
        "margin-right",
        "word-spacing",
        "float",
        "outline",
        "font-style",
        "vertical-align",
        "text-rendering",
        "font-variant",
        "letter-spacing",
        "orphans",
        "text-transform",
        "white-space",
        "widows",
        "-webkit-text-stroke-width",
        "display",
        "position",
        "overflow",
        "text-overflow",
        "text-decoration",
        "font-variant-ligatures",
        "font-variant-caps"
    ],
    height: 250,
    charCounterCount: !1,
    htmlRemoveTags: ["script", "style", "base"],
    htmlAllowedTags: [
        "a",
        "abbr",
        "address",
        "area",
        "article",
        "aside",
        "audio",
        "b",
        "base",
        "bdi",
        "bdo",
        "blockquote",
        "br",
        "button",
        "canvas",
        "caption",
        "cite",
        "code",
        "col",
        "colgroup",
        "datalist",
        "dd",
        "del",
        "details",
        "dfn",
        "dialog",
        "div",
        "dl",
        "dt",
        "em",
        "embed",
        "font",
        "fieldset",
        "figcaption",
        "figure",
        "footer",
        "form",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hgroup",
        "hr",
        "i",
        "iframe",
        "img",
        "input",
        "ins",
        "kbd",
        "keygen",
        "label",
        "legend",
        "li",
        "link",
        "main",
        "map",
        "mark",
        "menu",
        "menuitem",
        "meter",
        "nav",
        "noscript",
        "object",
        "ol",
        "optgroup",
        "option",
        "output",
        "p",
        "param",
        "pre",
        "progress",
        "queue",
        "rp",
        "rt",
        "ruby",
        "s",
        "samp",
        "script",
        "style",
        "section",
        "select",
        "small",
        "source",
        "span",
        "strike",
        "strong",
        "sub",
        "summary",
        "sup",
        "table",
        "tbody",
        "td",
        "textarea",
        "tfoot",
        "th",
        "thead",
        "time",
        "title",
        "tr",
        "track",
        "u",
        "ul",
        "var",
        "video",
        "wbr"
    ],
    htmlAllowedAttrs: [
        "accept",
        "accept-charset",
        "accesskey",
        "action",
        "align",
        "allowfullscreen",
        "allowtransparency",
        "alt",
        "async",
        "autocomplete",
        "autofocus",
        "autoplay",
        "autosave",
        "background",
        "bgcolor",
        "border",
        "charset",
        "cellpadding",
        "cellspacing",
        "checked",
        "cite",
        "class",
        "color",
        "cols",
        "colspan",
        "content",
        "contenteditable",
        "contextmenu",
        "controls",
        "coords",
        "data-.*",
        "datetime",
        "default",
        "defer",
        "dir",
        "dirname",
        "disabled",
        "download",
        "draggable",
        "dropzone",
        "enctype",
        "for",
        "form",
        "formaction",
        "frameborder",
        "headers",
        "height",
        "hidden",
        "high",
        "href",
        "hreflang",
        "http-equiv",
        "icon",
        "id",
        "ismap",
        "itemprop",
        "keytype",
        "kind",
        "label",
        "lang",
        "language",
        "list",
        "loop",
        "low",
        "max",
        "maxlength",
        "media",
        "method",
        "min",
        "mozallowfullscreen",
        "multiple",
        "muted",
        "name",
        "novalidate",
        "open",
        "optimum",
        "pattern",
        "ping",
        "placeholder",
        "playsinline",
        "poster",
        "preload",
        "pubdate",
        "radiogroup",
        "readonly",
        "rel",
        "required",
        "reversed",
        "rows",
        "rowspan",
        "sandbox",
        "scope",
        "scoped",
        "scrolling",
        "seamless",
        "selected",
        "shape",
        "size",
        "sizes",
        "span",
        "src",
        "srcdoc",
        "srclang",
        "srcset",
        "start",
        "step",
        "summary",
        "spellcheck",
        "style",
        "tabindex",
        "target",
        "title",
        "type",
        "translate",
        "usemap",
        "value",
        "valign",
        "webkitallowfullscreen",
        "width",
        "wrap"
    ],
    direction: document.documentElement.getAttribute("dir") || "auto"
};
