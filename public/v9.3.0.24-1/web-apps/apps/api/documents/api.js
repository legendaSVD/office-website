;(function(DocsAPI, window, document, undefined) {
    DocsAPI.DocEditor = function(placeholderId, config) {
        var _self = this,
            _config = config || {};
        extend(_config, DocsAPI.DocEditor.defaultConfig);
        _config.editorConfig.canUseHistory = _config.events && !!_config.events.onRequestHistory;
        _config.editorConfig.canHistoryClose = _config.events && !!_config.events.onRequestHistoryClose;
        _config.editorConfig.canHistoryRestore = _config.events && !!_config.events.onRequestRestore;
        _config.editorConfig.canSendEmailAddresses = _config.events && !!_config.events.onRequestEmailAddresses;
        _config.editorConfig.canRequestEditRights = _config.events && !!_config.events.onRequestEditRights;
        _config.editorConfig.canRequestClose = _config.events && !!_config.events.onRequestClose;
        _config.editorConfig.canRename = _config.events && !!_config.events.onRequestRename;
        _config.editorConfig.canMakeActionLink = _config.events && !!_config.events.onMakeActionLink;
        _config.editorConfig.canRequestUsers = _config.events && !!_config.events.onRequestUsers;
        _config.editorConfig.canRequestSendNotify = _config.events && !!_config.events.onRequestSendNotify;
        _config.editorConfig.mergeFolderUrl = _config.editorConfig.mergeFolderUrl || _config.editorConfig.saveAsUrl;
        _config.editorConfig.canRequestSaveAs = _config.events && !!_config.events.onRequestSaveAs;
        _config.editorConfig.canRequestInsertImage = _config.events && !!_config.events.onRequestInsertImage;
        _config.editorConfig.canRequestMailMergeRecipients = _config.events && !!_config.events.onRequestMailMergeRecipients;
        _config.editorConfig.canRequestCompareFile = _config.events && !!_config.events.onRequestCompareFile;
        _config.editorConfig.canRequestSharingSettings = _config.events && !!_config.events.onRequestSharingSettings;
        _config.editorConfig.canRequestCreateNew = _config.events && !!_config.events.onRequestCreateNew;
        _config.editorConfig.canRequestReferenceData = _config.events && !!_config.events.onRequestReferenceData;
        _config.editorConfig.canRequestOpen = _config.events && !!_config.events.onRequestOpen;
        _config.editorConfig.canRequestSelectDocument = _config.events && !!_config.events.onRequestSelectDocument;
        _config.editorConfig.canRequestSelectSpreadsheet = _config.events && !!_config.events.onRequestSelectSpreadsheet;
        _config.editorConfig.canRequestReferenceSource = _config.events && !!_config.events.onRequestReferenceSource;
        _config.editorConfig.canSaveDocumentToBinary = _config.events && !!_config.events.onSaveDocument;
        _config.editorConfig.canStartFilling = _config.events && !!_config.events.onRequestStartFilling;
        _config.editorConfig.canRequestRefreshFile = _config.events && !!_config.events.onRequestRefreshFile;
        _config.editorConfig.canUpdateVersion = _config.events && !!_config.events.onOutdatedVersion;
        _config.editorConfig.canRequestFillingStatus = _config.events && !!_config.events.onRequestFillingStatus;
        _config.frameEditorId = placeholderId;
        _config.parentOrigin = window.location.origin;
        var onMouseUp = function (evt) {
            _processMouse(evt);
        };
        var _attachMouseEvents = function() {
            if (window.addEventListener) {
                window.addEventListener("mouseup", onMouseUp, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmouseup", onMouseUp);
            }
        };
        var _detachMouseEvents = function() {
            if (window.removeEventListener) {
                window.removeEventListener("mouseup", onMouseUp, false)
            } else if (window.detachEvent) {
                window.detachEvent("onmouseup", onMouseUp);
            }
        };
        var _onAppReady = function() {
            _attachMouseEvents();
            if (_config.editorConfig) {
                _init(_config.editorConfig);
            }
            if (_config.document) {
                _openDocument(_config.document);
            }
        };
        var _onMessage = function(msg) {
            if ( msg ) {
                if ( msg.type === "onExternalPluginMessage" ) {
                    _sendCommand(msg);
                } else if ((window.parent !== window) && msg.type === "onExternalPluginMessageCallback") {
                    postMessage(window.parent, msg);
                } else
                if ( msg.frameEditorId == placeholderId ) {
                    var events = _config.events || {},
                        handler = events[msg.event],
                        res;
                    if (msg.event === 'onRequestEditRights' && !handler) {
                        _applyEditRights(false, 'handler isn\'t defined');
                    } else
                    if (msg.event === 'onSwitchEditorType' && !handler) {
                        if ( msg.data ) {
                            if ( typeof msg.data.type == 'string' )
                                localStorage.setItem('asc-force-editor-type', msg.data.type);
                            if ( msg.data.restart )
                                window.location.reload();
                        }
                    } else {
                        if (msg.event === 'onAppReady') {
                            _onAppReady();
                        }
                        if (handler && typeof handler == "function") {
                            res = handler.call(_self, {target: _self, data: msg.data});
                        }
                    }
                }
            }
        };
        var _checkConfigParams = function() {
            if (_config.document) {
                if (!_config.document.url || ((typeof _config.document.fileType !== 'string' || _config.document.fileType=='') &&
                                              (typeof _config.documentType !== 'string' || _config.documentType==''))) {
                    window.alert("One or more required parameter for the config object is not set");
                    return false;
                }
                var appMap = {
                        'text': 'docx',
                        'text-pdf': 'pdf',
                        'spreadsheet': 'xlsx',
                        'presentation': 'pptx',
                        'word': 'docx',
                        'cell': 'xlsx',
                        'slide': 'pptx',
                        'pdf': 'pdf',
                        'diagram': 'vsdx'
                    }, app;
                if (_config.documentType=='text' || _config.documentType=='spreadsheet' ||_config.documentType=='presentation')
                    console.warn("The \"documentType\" parameter for the config object must take one of the values word/cell/slide/pdf/diagram.");
                if (typeof _config.documentType === 'string' && _config.documentType != '') {
                    app = appMap[_config.documentType.toLowerCase()];
                    if (!app) {
                        window.alert("The \"documentType\" parameter for the config object is invalid. Please correct it.");
                        return false;
                    } else if (typeof _config.document.fileType !== 'string' || _config.document.fileType == '') {
                        _config.document.fileType = app;
                    }
                }
                if (typeof _config.document.fileType === 'string' && _config.document.fileType != '') {
                    _config.document.fileType = _config.document.fileType.toLowerCase();
                    var type = /^(?:(xls|xlsx|ods|csv|gsheet|xlsm|xlt|xltm|xltx|fods|ots|xlsb|sxc|et|ett|numbers)|(pps|ppsx|ppt|pptx|odp|gslides|pot|potm|potx|ppsm|pptm|fodp|otp|sxi|dps|dpt|key|odg)|(pdf|djvu|xps|oxps)|(doc|docx|odt|gdoc|txt|rtf|mht|htm|html|mhtml|epub|docm|dot|dotm|dotx|fodt|ott|fb2|xml|oform|docxf|sxw|stw|wps|wpt|pages|hwp|hwpx|md|hml)|(vsdx|vssx|vstx|vsdm|vssm|vstm))$/
                                    .exec(_config.document.fileType);
                    if (!type) {
                        window.alert("The \"document.fileType\" parameter for the config object is invalid. Please correct it.");
                        return false;
                    } else if (typeof _config.documentType !== 'string' || _config.documentType == ''){
                        if (typeof type[1] === 'string') _config.documentType = 'cell'; else
                        if (typeof type[2] === 'string') _config.documentType = 'slide'; else
                        if (typeof type[3] === 'string') _config.documentType = 'pdf'; else
                        if (typeof type[4] === 'string') _config.documentType = 'word'; else
                        if (typeof type[5] === 'string') _config.documentType = 'diagram';
                    }
                }
                var type = /^(?:(djvu|xps|oxps))$/.exec(_config.document.fileType);
                if (type && typeof type[1] === 'string') {
                    _config.editorConfig.canUseHistory = false;
                }
                if (!_config.document.title || _config.document.title=='')
                    _config.document.title = 'Unnamed.' + _config.document.fileType;
                if (!_config.document.key) {
                    _config.document.key = 'xxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function (c) {var r = Math.random() * 16 | 0; return r.toString(16);});
                } else if (typeof _config.document.key !== 'string') {
                    window.alert("The \"document.key\" parameter for the config object must be string. Please correct it.");
                    return false;
                }
                if (_config.editorConfig.user && _config.editorConfig.user.id && (typeof _config.editorConfig.user.id == 'number')) {
                    _config.editorConfig.user.id = _config.editorConfig.user.id.toString();
                    console.warn("The \"id\" parameter for the editorConfig.user object must be a string.");
                }
                _config.document.token = _config.token;
            }
            return true;
        };
        (function() {
            var result = /[\?\&]placement=(\w+)&?/.exec(window.location.search);
            if (!!result && result.length && result[1] == 'desktop' ) {
                console.warn('some errors occurred in the desktop app while document opening. please, contact with support team');
            }
            if (!!window.AscDesktopEditor)
            {
                _config.editorConfig.targetApp = 'desktop';
                if (!_config.editorConfig.customization) _config.editorConfig.customization = {};
                _config.editorConfig.customization.about = false;
                _config.editorConfig.customization.compactHeader = false;
            }
        })();
        var target = document.getElementById(placeholderId),
            iframe;
        getShardkey(_config);
        if (target && _checkConfigParams()) {
            iframe = createIframe(_config);
            if (_config.editorConfig.customization && _config.editorConfig.customization.integrationMode==='embed')
                window.AscEmbed && window.AscEmbed.initWorker(iframe);
            if (_config.document && (_config.document.isForm!==true && _config.document.isForm!==false)) {
                iframe.onload = function() {
                    _sendCommand({
                        command: 'checkParams',
                        data: {
                            url: _config.document.url,
                            directUrl: _config.document.directUrl,
                            token: _config.document.token,
                            key: _config.document.key
                        }
                    })
                };
            }
            if (iframe.src) {
                var pathArray = iframe.src.split('/');
                this.frameOrigin = pathArray[0] + '//' + pathArray[2];
            }
            target.parentNode && target.parentNode.replaceChild(iframe, target);
            var _msgDispatcher = new MessageDispatcher(_onMessage, this);
        }
        var _destroyEditor = function(cmd) {
            var target = document.createElement("div");
            target.setAttribute('id', placeholderId);
            if (iframe) {
                _msgDispatcher && _msgDispatcher.unbindEvents();
                _detachMouseEvents();
                iframe.parentNode && iframe.parentNode.replaceChild(target, iframe);
            }
        };
        var _sendCommand = function(cmd, buffer) {
            if (iframe && iframe.contentWindow)
                postMessage(iframe.contentWindow, cmd, buffer);
        };
        var _init = function(editorConfig) {
            _sendCommand({
                command: 'init',
                data: {
                    config: editorConfig
                }
            });
        };
        var _openDocument = function(doc) {
            _sendCommand({
                command: 'openDocument',
                data: {
                    doc: doc
                }
            });
        };
        var _openDocumentFromBinary = function(doc) {
            doc && _sendCommand({
                command: 'openDocumentFromBinary',
                data: doc.buffer
            }, doc.buffer);
        };
        var _showMessage = function(title, msg) {
            msg = msg || title;
            _sendCommand({
                command: 'showMessage',
                data: {
                    msg: msg
                }
            });
        };
        var _applyEditRights = function(allowed, message) {
            _sendCommand({
                command: 'applyEditRights',
                data: {
                    allowed: allowed,
                    message: message
                }
            });
        };
        var _processRightsChange = function(enabled, message) {
            _sendCommand({
                command: 'processRightsChange',
                data: {
                    enabled: enabled,
                    message: message
                }
            });
        };
        var _denyEditingRights = function(message) {
            _sendCommand({
                command: 'processRightsChange',
                data: {
                    enabled: false,
                    message: message
                }
            });
        };
        var _refreshHistory = function(data, message) {
            _sendCommand({
                command: 'refreshHistory',
                data: {
                    data: data,
                    message: message
                }
            });
        };
        var _setHistoryData = function(data, message) {
            _sendCommand({
                command: 'setHistoryData',
                data: {
                    data: data,
                    message: message
                }
            });
        };
        var _setEmailAddresses = function(data) {
            _sendCommand({
                command: 'setEmailAddresses',
                data: {
                    data: data
                }
            });
        };
        var _setActionLink = function (data) {
            _sendCommand({
                command: 'setActionLink',
                data: {
                    url: data
                }
            });
        };
        var _processMailMerge = function(enabled, message) {
            _sendCommand({
                command: 'processMailMerge',
                data: {
                    enabled: enabled,
                    message: message
                }
            });
        };
        var _downloadAs = function(data) {
            _sendCommand({
                command: 'downloadAs',
                data: data
            });
        };
        var _setUsers = function(data) {
            _sendCommand({
                command: 'setUsers',
                data: data
            });
        };
        var _showSharingSettings = function(data) {
            _sendCommand({
                command: 'showSharingSettings',
                data: data
            });
        };
        var _setSharingSettings = function(data) {
            _sendCommand({
                command: 'setSharingSettings',
                data: data
            });
        };
        var _insertImage = function(data) {
            _sendCommand({
                command: 'insertImage',
                data: data
            });
        };
        var _setMailMergeRecipients = function(data) {
            _sendCommand({
                command: 'setMailMergeRecipients',
                data: data
            });
        };
        var _setRevisedFile = function(data) {
            _sendCommand({
                command: 'setRevisedFile',
                data: data
            });
        };
        var _setRequestedDocument = function(data) {
            _sendCommand({
                command: 'setRequestedDocument',
                data: data
            });
        };
        var _setRequestedSpreadsheet = function(data) {
            _sendCommand({
                command: 'setRequestedSpreadsheet',
                data: data
            });
        };
        var _setReferenceSource = function(data) {
            _sendCommand({
                command: 'setReferenceSource',
                data: data
            });
        };
        var _setFavorite = function(data) {
            _sendCommand({
                command: 'setFavorite',
                data: data
            });
        };
        var _requestClose = function(data) {
            _sendCommand({
                command: 'requestClose',
                data: data
            });
        };
        var _startFilling = function(data) {
            _sendCommand({
                command: 'startFilling',
                data: data
            });
        };
        var _requestRoles = function(data) {
            _sendCommand({
                command: 'requestRoles',
                data: data
            });
        };
        var _processMouse = function(evt) {
            var r = iframe.getBoundingClientRect();
            var data = {
                type: evt.type,
                x: evt.x - r.left,
                y: evt.y - r.top,
                event: evt
            };
            _sendCommand({
                command: 'processMouse',
                data: data
            });
        };
        var _grabFocus = function(data) {
            setTimeout(function(){
                _sendCommand({
                    command: 'grabFocus',
                    data: data
                });
            }, 10);
        };
        var _blurFocus = function(data) {
            _sendCommand({
                command: 'blurFocus',
                data: data
            });
        };
        var _setReferenceData = function(data) {
            _sendCommand({
                command: 'setReferenceData',
                data: data
            });
        };
        var _refreshFile = function(data) {
            _sendCommand({
                command: 'refreshFile',
                data: data
            });
        };
        var _serviceCommand = function(command, data) {
            _sendCommand({
                command: 'internalCommand',
                data: {
                    command: command,
                    data: data
                }
            });
        };
        return {
            showMessage         : _showMessage,
            processRightsChange : _processRightsChange,
            denyEditingRights   : _denyEditingRights,
            refreshHistory      : _refreshHistory,
            setHistoryData      : _setHistoryData,
            setEmailAddresses   : _setEmailAddresses,
            setActionLink       : _setActionLink,
            processMailMerge    : _processMailMerge,
            downloadAs          : _downloadAs,
            serviceCommand      : _serviceCommand,
            attachMouseEvents   : _attachMouseEvents,
            detachMouseEvents   : _detachMouseEvents,
            destroyEditor       : _destroyEditor,
            setUsers            : _setUsers,
            showSharingSettings : _showSharingSettings,
            setSharingSettings  : _setSharingSettings,
            insertImage         : _insertImage,
            setMailMergeRecipients: _setMailMergeRecipients,
            setRevisedFile      : _setRevisedFile,
            setFavorite         : _setFavorite,
            requestClose        : _requestClose,
            grabFocus           : _grabFocus,
            blurFocus           : _blurFocus,
            setReferenceData    : _setReferenceData,
            refreshFile         : _refreshFile,
            setRequestedDocument: _setRequestedDocument,
            setRequestedSpreadsheet: _setRequestedSpreadsheet,
            setReferenceSource: _setReferenceSource,
            openDocument: _openDocumentFromBinary,
            startFilling: _startFilling,
            requestRoles: _requestRoles
        }
    };
    DocsAPI.DocEditor.defaultConfig = {
        type: 'desktop',
        width: '100%',
        height: '100%',
        editorConfig: {
            lang: 'en',
            canCoAuthoring: true,
            customization: {
                about: true,
                feedback: false
            }
        }
    };
    DocsAPI.DocEditor.version = function() {
        return '9.3.0';
    };
    DocsAPI.DocEditor.warmUp = function(id) {
        var target = document.getElementById(id);
        if ( target ) {
            var path = extendAppPath({}, getBasePath());
            path += 'api/documents/preload.html';
            var iframe = document.createElement("iframe");
            iframe.width = 0;
            iframe.height = 0;
            iframe.style = 'border:0 none;';
            iframe.src = path;
            target.parentNode && target.parentNode.replaceChild(iframe, target);
        }
    }
    MessageDispatcher = function(fn, scope) {
        var _fn     = fn,
            _scope  = scope || window,
            eventFn = function(msg) {
                _onMessage(msg);
            };
        var _bindEvents = function() {
            if (window.addEventListener) {
                window.addEventListener("message", eventFn, false)
            }
            else if (window.attachEvent) {
                window.attachEvent("onmessage", eventFn);
            }
        };
        var _unbindEvents = function() {
            if (window.removeEventListener) {
                window.removeEventListener("message", eventFn, false)
            }
            else if (window.detachEvent) {
                window.detachEvent("onmessage", eventFn);
            }
        };
        var _onMessage = function(msg) {
            if (msg && window.JSON && _scope.frameOrigin==msg.origin ) {
                if (msg.data && msg.data.event === 'onSaveDocument') {
                    if (_fn) {
                        _fn.call(_scope, msg.data);
                    }
                    return;
                }
                try {
                    var msg = window.JSON.parse(msg.data);
                    if (_fn) {
                        _fn.call(_scope, msg);
                    }
                } catch(e) {}
            }
        };
        _bindEvents.call(this);
        return {
            unbindEvents: _unbindEvents
        }
    };
    function getShardkey(config) {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
            if (scripts[i].src.match(/(.*)api\/documents\/api.js/i)) {
                var shardkey = /[\?\&]shardkey=([^&]+)&?/.exec(scripts[i].src);
                shardkey && shardkey.length && (config.editorConfig.shardkey = shardkey[1]);
                break;
            }
        }
    }
    function getBasePath() {
        var scripts = document.getElementsByTagName('script'),
            match;
        for (var i = scripts.length - 1; i >= 0; i--) {
            match = scripts[i].src.match(/(.*)api\/documents\/api.js/i);
            if (match) {
                return match[1];
            }
        }
        return "";
    }
    function getExtensionPath() {
        if ("undefined" == typeof(extensionParams) || null == extensionParams["url"])
            return null;
        return extensionParams["url"] + "apps/";
    }
    function getTestPath() {
        var scripts = document.getElementsByTagName('script'),
            match;
        for (var i = scripts.length - 1; i >= 0; i--) {
            match = scripts[i].src.match(/(.*)apps\/api\/documents\/api.js/i);
            if (match) {
                return match[1] + "test/";
            }
        }
        return "";
    }
    function isLocalStorageAvailable() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        }
        catch(e) {
            return false;
        }
    }
    function correct_app_type(config) {
        if ( config.type == 'mobile' ) {
            if ( !config.editorConfig.customization || !config.editorConfig.customization.mobile ||
                    config.editorConfig.customization.mobile.disableForceDesktop !== true )
            {
                if ( isLocalStorageAvailable() ) {
                    const f = localStorage.getItem('asc-force-editor-type');
                    if ( f === 'desktop' ) {
                        config.editorConfig.forceDesktop = true;
                        return 'desktop';
                    }
                }
            }
        }
        return config.type;
    }
    function getAppPath(config) {
        var extensionPath = getExtensionPath(),
            path = extensionPath ? extensionPath : (config.type=="test" ? getTestPath() : getBasePath()),
            appMap = {
                'text': 'documenteditor',
                'text-pdf': 'documenteditor',
                'spreadsheet': 'spreadsheeteditor',
                'presentation': 'presentationeditor',
                'word': 'documenteditor',
                'cell': 'spreadsheeteditor',
                'slide': 'presentationeditor',
                'pdf': 'pdfeditor',
                'diagram': 'visioeditor',
                'common': 'common'
            },
            appType = 'word',
            type,
            fillForms = false,
            isForm = false;
        if (config.document) {
            if (typeof config.document.fileType === 'string')
                type = /^(?:(pdf)|(djvu|xps|oxps)|(xls|xlsx|ods|csv|xlst|xlsy|gsheet|xlsm|xlt|xltm|xltx|fods|ots|xlsb|numbers)|(pps|ppsx|ppt|pptx|odp|pptt|ppty|gslides|pot|potm|potx|ppsm|pptm|fodp|otp|key|odg)|(oform|docxf)|(vsdx|vssx|vstx|vsdm|vssm|vstm))$/
                    .exec(config.document.fileType);
            if (config.document.permissions)
                fillForms = (config.document.permissions.fillForms===undefined ? config.document.permissions.edit !== false : config.document.permissions.fillForms) &&
                            config.editorConfig && (config.editorConfig.mode !== 'view');
        }
        var corrected_type = correct_app_type(config);
        if (type && typeof type[2] === 'string') {
            appType = corrected_type === 'mobile' || corrected_type === 'embedded' ? 'word' : 'pdf';
        } else if (type && typeof type[1] === 'string') {
            isForm = config.document ? config.document.isForm : undefined;
            if (corrected_type === 'embedded')
                appType = fillForms && isForm===undefined ? 'common' : 'word';
            else if (corrected_type !== 'mobile')
                appType = isForm===undefined ? 'common' : isForm ? 'word' : 'pdf';
        } else if (type && typeof type[5] === 'string') {
            appType = 'word';
        } else {
            if (typeof config.documentType === 'string')
                appType = config.documentType.toLowerCase();
            else {
                if (type && typeof type[3] === 'string') appType = 'cell'; else
                if (type && typeof type[4] === 'string') appType = 'slide'; else
                if (type && typeof type[6] === 'string') appType = 'diagram';
            }
        }
        if (!(config.editorConfig && config.editorConfig.shardkey && config.document && config.editorConfig.shardkey!==config.document.key))
            path = extendAppPath(config, path);
        path += appMap[appType];
        const path_type = corrected_type === "mobile" ? "mobile" :
                          corrected_type === "embedded" ? (fillForms && isForm ? "forms" : "embed") : "main";
        if (appType !== 'common')
            path += "/" + path_type;
        var index = "/index.html";
        if (config.editorConfig && path_type!=="forms" && appType!=='common') {
            var customization = config.editorConfig.customization;
            if ( typeof(customization) == 'object' && ( customization.toolbarNoTabs ||
               (config.editorConfig.targetApp!=='desktop') && (customization.loaderName || customization.loaderLogo))) {
                index = "/index_loader.html";
            } else if (config.editorConfig.mode === 'editdiagram' || config.editorConfig.mode === 'editmerge' || config.editorConfig.mode === 'editole')
                index = "/index_internal.html";
        }
        path += index;
        return path;
    }
    function getAppParameters(config) {
        var params = "?_dc=0";
        if (config.editorConfig && config.editorConfig.lang)
            params += "&lang=" + config.editorConfig.lang;
        if (config.editorConfig && config.editorConfig.targetApp!=='desktop') {
            if ( (typeof(config.editorConfig.customization) == 'object') && config.editorConfig.customization.loaderName) {
                if (config.editorConfig.customization.loaderName !== 'none') params += "&customer=" + encodeURIComponent(config.editorConfig.customization.loaderName);
            } else
                params += "&customer=ONLYOFFICE";
            if (typeof(config.editorConfig.customization) == 'object') {
                if ( config.editorConfig.customization.loaderLogo && config.editorConfig.customization.loaderLogo !== '') {
                    params += "&logo=" + encodeURIComponent(config.editorConfig.customization.loaderLogo);
                }
                if ( config.editorConfig.customization.logo ) {
                    if (config.editorConfig.customization.logo.visible===false) {
                        params += "&headerlogo=";
                    } else if (config.type=='embedded' && (config.editorConfig.customization.logo.image || config.editorConfig.customization.logo.imageEmbedded || config.editorConfig.customization.logo.imageDark)) {
                        (config.editorConfig.customization.logo.image || config.editorConfig.customization.logo.imageEmbedded) && (params += "&headerlogo=" + encodeURIComponent(config.editorConfig.customization.logo.image || config.editorConfig.customization.logo.imageEmbedded));
                        config.editorConfig.customization.logo.imageDark && (params += "&headerlogodark=" + encodeURIComponent(config.editorConfig.customization.logo.imageDark));
                        config.editorConfig.customization.logo.imageLight && (params += "&headerlogolight=" + encodeURIComponent(config.editorConfig.customization.logo.imageLight));
                    } else if (config.type!='embedded' && (config.editorConfig.customization.logo.image || config.editorConfig.customization.logo.imageDark || config.editorConfig.customization.logo.imageLight)) {
                        config.editorConfig.customization.logo.image && (params += "&headerlogo=" + encodeURIComponent(config.editorConfig.customization.logo.image));
                        config.editorConfig.customization.logo.imageDark && (params += "&headerlogodark=" + encodeURIComponent(config.editorConfig.customization.logo.imageDark));
                        config.editorConfig.customization.logo.imageLight && (params += "&headerlogolight=" + encodeURIComponent(config.editorConfig.customization.logo.imageLight));
                    }
                }
            }
        }
        if (config.editorConfig && (config.editorConfig.mode == 'editdiagram' || config.editorConfig.mode == 'editmerge' || config.editorConfig.mode == 'editole'))
            params += "&internal=true";
        if (config.type)
            params += "&type=" + config.type;
        if (config.frameEditorId)
            params += "&frameEditorId=" + config.frameEditorId;
        var type = config.document ? /^(?:(pdf)|(oform|docxf))$/.exec(config.document.fileType) : null,
            isPdf = type && typeof type[1] === 'string',
            oldForm = type && typeof type[2] === 'string';
        if (!(isPdf || oldForm) && (config.editorConfig && config.editorConfig.mode == 'view' ||
            config.document && config.document.permissions && (config.document.permissions.edit === false && !config.document.permissions.review )))
            params += "&mode=view";
        if ((isPdf || oldForm) && (config.document && config.document.permissions && config.document.permissions.edit === false || config.editorConfig && config.editorConfig.mode == 'view'))
            params += "&mode=fillforms";
        if (config.document) {
            config.document.isForm = isPdf ? config.document.isForm : !!oldForm;
            (config.document.isForm===true || config.document.isForm===false) && (params += "&isForm=" + config.document.isForm);
        }
        if (config.editorConfig && config.editorConfig.customization && !!config.editorConfig.customization.compactHeader)
            params += "&compact=true";
        if (config.editorConfig && config.editorConfig.customization && config.editorConfig.customization.features && config.editorConfig.customization.features.tabBackground) {
            if (typeof config.editorConfig.customization.features.tabBackground === 'object') {
                params += "&tabBackground=" + (config.editorConfig.customization.features.tabBackground.mode || "header") + (config.editorConfig.customization.features.tabBackground.change!==false ? "-ls" : "");
            } else
                params += "&tabBackground=" + config.editorConfig.customization.features.tabBackground + "-ls";
        }
        if (config.editorConfig && config.editorConfig.customization && (config.editorConfig.customization.toolbar===false))
            params += "&toolbar=false";
        if (config.parentOrigin)
            params += "&parentOrigin=" + config.parentOrigin;
        if (config.editorConfig && config.editorConfig.customization && config.editorConfig.customization.uiTheme )
            params += "&uitheme=" + config.editorConfig.customization.uiTheme;
        if (config.document && config.document.fileType)
            params += "&fileType=" + config.document.fileType;
        if (config.editorConfig && config.editorConfig.shardkey && config.document && config.editorConfig.shardkey!==config.document.key)
            params += "&shardkey=" + config.document.key;
        if (config.editorConfig) {
            var customization = config.editorConfig.customization;
            if ( customization && typeof(customization) == 'object' && ( customization.toolbarNoTabs || (config.editorConfig.targetApp!=='desktop') && (customization.loaderName || customization.loaderLogo))) {
                params += "&indexPostfix=_loader";
            }
        }
        if (config.editorConfig && config.editorConfig.customization && config.editorConfig.customization.wordHeadingsColor && typeof config.editorConfig.customization.wordHeadingsColor === 'string') {
            params += "&headingsColor=" + config.editorConfig.customization.wordHeadingsColor.replace(/#/, '');
        }
        return params;
    }
    function createIframe(config) {
        var iframe = document.createElement("iframe");
        iframe.src = getAppPath(config) + getAppParameters(config);
        iframe.width = config.width;
        iframe.height = config.height;
        iframe.align = "top";
        iframe.frameBorder = 0;
        iframe.name = "frameEditor";
        config.title && (typeof config.title === 'string') && (iframe.title = config.title);
        iframe.allowFullscreen = true;
        iframe.setAttribute("allowfullscreen","");
        iframe.setAttribute("onmousewheel","");
        iframe.setAttribute("allow", "autoplay; camera; microphone; display-capture; clipboard-write;");
		if (config.type == "mobile")
		{
			iframe.style.position = "fixed";
            iframe.style.overflow = "hidden";
            document.body.style.overscrollBehaviorY = "contain";
		}
        return iframe;
    }
    function postMessage(wnd, msg, buffer) {
        if (wnd && wnd.postMessage && window.JSON) {
            buffer ? wnd.postMessage(msg, "*", [buffer]) : wnd.postMessage(window.JSON.stringify(msg), "*");
        }
    }
    function extend(dest, src) {
        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                if (typeof dest[prop] === 'undefined') {
                    dest[prop] = src[prop];
                } else
                if (typeof dest[prop] === 'object' &&
                        typeof src[prop] === 'object') {
                    extend(dest[prop], src[prop])
                }
            }
        }
        return dest;
    }
    function extendAppPath(config,  path) {
        if ( !config.isLocalFile ) {
            const ver = '/9.3.0-{{HASH_POSTFIX}}';
            if ( ver.lastIndexOf('{{') < 0 && path.indexOf(ver) < 0 ) {
                const pos = path.indexOf('/web-apps/app');
                if ( pos > 0 )
                    return [path.slice(0, pos), ver, path.slice(pos)].join('');
            }
        }
        return path;
    }
    (function() {
        if (document.currentScript) {
            var scriptDirectory = document.currentScript.src;
            var cacheWarmupId = /[?&]placeholder=([^&#]*)?/.exec(scriptDirectory);
            if (cacheWarmupId && cacheWarmupId.length ) {
                DocsAPI.DocEditor.warmUp.call(this, decodeURIComponent(cacheWarmupId[1]));
            }
        }
    })();
})(window.DocsAPI = window.DocsAPI || {}, window, document);