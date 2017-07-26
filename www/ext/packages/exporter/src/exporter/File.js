/**
 * This singleton has methods for file manipulation.
 *
 * It allows file saving using browser features or remote server calls.
 *
 * Call {@link #saveAs} to save text files or {@link #saveBinaryAs} to save binary files.
 * If the browser doesn't support file saving then those functions will upload
 * the file content to the server address provided in {@link #url}.
 *
 * The script from the default {@link #url} has a 5Mb upload limitation for file content.
 * In the "server" folder of the `exporter` package there are examples of
 * scripts that could be used to implement an in-house server.
 *
 * **Note:** When using server side download browser pop-ups should NOT be blocked.
 */
Ext.define('Ext.exporter.File', {
    singleton: true,

    requires: [
        'Ext.promise.Promise',
        'Ext.Deferred'
    ],
    
    textPopupWait: 'You may close this window after the file is downloaded!',
    textPopupBlocker: 'The file was not saved because pop-up blocker might be enabled! Please check your browser settings.',

    /**
     * @property {String} url
     *
     * Address of the server that supports file downloading. Check out the scripts
     * from the "server" folder of the `exporter` package if an in-house server
     * needs to be implemented.
     */
    url: 'https://exporter.sencha.com',

    /**
     * @property {Boolean} forceDownload
     *
     * Set to `true` to always download files from the server {@link #url} instead of saving
     * files using browser features.
     */
    forceDownload: false,

    /**
     * Check if we need to use a pop-up window to download the file.
     *
     * @return {Boolean} Returns true if a pop-up window is needed to download files
     * @private
     */
    requiresPopup: function(){
        var pt = Ext.platformTags;

        //Safari and Blob are not friends yet
        return this.forceDownload || Ext.isSafari || pt.phone || pt.tablet;
    },

    /**
     * This function tries to open a new pop-up window that will be used to
     * download the file using a remote server call.
     *
     * This function needs to be called after the end-user clicked a button and it should
     * happen in the same cycle as the user interaction otherwise the browser will block it.
     *
     * See http://stackoverflow.com/a/2587692 for more details.
     *
     * @param {Boolean} binary Set to true if the file to be downloaded is binary
     */
    initializePopup: function(binary){
        var me = this,
            required = me.requiresPopup(),
            win;

        if(!required && binary){
            required = !me.saveBlobAs;
        }

        me.popup = null;
        if(required){
            win = window.open('', '_blank');
            if(win){
                me.popup = win;
                win.document.write(Ext.dom.Helper.markup({
                    tag: 'html',
                    children: [{
                        tag: 'head'
                    }, {
                        tag: 'body',
                        children: [{
                            tag: 'p',
                            html: me.textPopupWait
                        }]
                    }]
                }));
            }
        }
    },

    /**
     * Save a binary file locally using either [Blob][1] or server side script.
     *
     * [1]: https://developer.mozilla.org/en/docs/Web/API/Blob
     *
     * Browser compatibility when using [Blob][1]:
     *
     * - Firefox 20+: max blob size 800 MB
     * - Chrome: max blob size 500 MB
     * - Chrome for Android: max blob size 500 MB
     * - Edge: max blob size n/a
     * - IE 10+: max blob size 600 MB
     * - Opera 15+: max blob size 500 MB
     *
     * For all other browsers it falls back to server side script which means that
     * the file content is uploaded to the server script defined in {@link #url} and comes
     * back to the browser as a file download.
     *
     * @param {String} content File content
     * @param {String} filename Name of the file including the extension
     * @param {String} [charset='UTF-8'] File's charset
     * @param {String} [mimeType='application/octet-stream'] Mime type of the file
     * @return {Ext.promise.Promise}
     */
    saveBinaryAs: function(content, filename, charset, mimeType){
        var me = this,
            saveAs = me.downloadBinaryAs;

        if(!me.requiresPopup() && me.saveBlobAs){
            saveAs = me.saveBlobAs;
        }

        // The method saveBlobAs exists only if the browser supports Blob
        return saveAs.call(me, content, filename, charset, mimeType);
    },

    /**
     * Save a binary file using a server side script. The file content, file name, charset and
     * mime-type are uploaded to the server side script and a download is forced from the server.
     *
     * This method can be used when the browser doesn't support [Blobs][1].
     *
     * [1]: https://developer.mozilla.org/en/docs/Web/API/Blob
     *
     * **Note** Browsers pop-ups should NOT be blocked for this feature to work as expected.
     *
     * @param {String} content File content
     * @param {String} filename Name of the file including the extension
     * @param {String} [charset='UTF-8'] File's charset
     * @param {String} [mimeType='application/octet-stream'] Mime type of the file
     * @return {Ext.promise.Promise}
     */
    downloadBinaryAs: function(content, filename, charset, mimeType){
        var deferred = new Ext.Deferred(),
            markup, win;

        //<debug>
        if (!this.url) {
            Ext.raise('Cannot download file since no URL was defined!');
            return deferred.promise;
        }
        //</debug>

        markup = Ext.dom.Helper.markup({
            tag: 'html',
            children: [
                {tag: 'head'},
                {
                    tag: 'body',
                    children: [
                        {
                            tag: 'form',
                            method: 'POST',
                            action: this.url,
                            children: [{
                                tag: 'input',
                                type: 'hidden',
                                name: 'content',
                                value: Ext.util.Base64.encode(content)
                            }, {
                                tag: 'input',
                                type: 'hidden',
                                name: 'filename',
                                value: filename
                            }, {
                                tag: 'input',
                                type: 'hidden',
                                name: 'charset',
                                value: charset || 'UTF-8'
                            }, {
                                tag: 'input',
                                type: 'hidden',
                                name: 'mime',
                                value: mimeType || 'application/octet-stream'
                            }]
                        },
                        {
                            tag: 'script',
                            type: 'text/javascript',
                            children: 'document.getElementsByTagName("form")[0].submit();'
                        }
                    ]
                }
            ]
        });

        win = this.popup || window.open('', '_blank');
        if (win) {
            win.document.write(markup);
            deferred.resolve();
        } else {
            deferred.reject(this.textPopupBlocker);
        }
        this.popup = null;
        return deferred.promise;
    }

    /**
     * Save a text file locally using the content and name provided.
     *
     * Browser	compatibility:
     *
     * - Firefox 20+: max blob size 800 MB
     * - Chrome: max blob size 500 MB
     * - Chrome for Android: max blob size 500 MB
     * - Edge: max blob size n/a
     * - IE 10+: max blob size 600 MB
     * - IE < 10: Files are saved as text/html and max file size n/a
     * - Opera 15+: max blob size 500 MB
     * - Opera < 15: max blob size n/a
     * - Safari 6.1+: max blob size n/a; Blobs may be opened instead of saved sometimes—you may have
     * to direct your Safari users to manually press ⌘+S to save the file after it is opened.
     * Using the application/octet-stream MIME type to force downloads can cause issues in Safari.
     * - Safari < 6: max blob size n/a
     *
     * @method saveAs
     * @param {String} content File content
     * @param {String} filename Name of the file including the extension
     * @param {String} [charset='UTF-8'] File's charset
     * @param {String} [mimeType='application/octet-stream'] Mime type of the file
     * @return {Ext.promise.Promise}
     */

    /**
     * Save a binary file locally using [Blobs][1].
     *
     * Browser compatibility:
     *
     * - Firefox 20+: max blob size 800 MB
     * - Chrome: max blob size 500 MB
     * - Chrome for Android: max blob size 500 MB
     * - Edge: max blob size n/a
     * - IE 10+: max blob size 600 MB
     * - Opera 15+: max blob size 500 MB
     *
     * [1]: https://developer.mozilla.org/en/docs/Web/API/Blob
     *
     * @method saveBlobAs
     * @param {String} content File content
     * @param {String} filename Name of the file including the extension
     * @param {String} [charset='UTF-8'] File's charset
     * @param {String} [mimeType='application/octet-stream'] Mime type of the file
     * @return {Ext.promise.Promise}
     * @private
     */

}, function(File){
    /* FileSaver.js
     *  A saveAs() & saveTextAs() FileSaver implementation.
     * 1.1.20160328
     *
     *  Modify by Brian Chen
     * By Eli Grey, http://eligrey.com
     * License: MIT
     *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
     */

    /*global self */
    /*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    var navigator = window.navigator,
        saveAs = window.saveAs || (function(view) {
                "use strict";
                // IE <10 is explicitly unsupported
                if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
                    return;
                }
                var
                    doc = view.document
                // only get URL when necessary in case Blob.js hasn't overridden it yet
                    , get_URL = function() {
                        return view.URL || view.webkitURL || view;
                    }
                    , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
                    , can_use_save_link = "download" in save_link
                    , click = function(node) {
                        var event = new MouseEvent("click");
                        node.dispatchEvent(event);
                    }
                    , is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent)
                    , webkit_req_fs = view.webkitRequestFileSystem
                    , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
                    , throw_outside = function(ex) {
                        (view.setImmediate || view.setTimeout)(function() {
                            throw ex;
                        }, 0);
                    }
                    , force_saveable_type = "application/octet-stream"
                    , fs_min_size = 0
                // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
                    , arbitrary_revoke_timeout = 1000 * 40 // in ms
                    , revoke = function(file) {
                        var revoker = function() {
                            if (typeof file === "string") { // file is an object URL
                                get_URL().revokeObjectURL(file);
                            } else { // file is a File
                                file.remove();
                            }
                        };
                        /* // Take note W3C:
                         var
                         uri = typeof file === "string" ? file : file.toURL()
                         , revoker = function(evt) {
                         // idealy DownloadFinishedEvent.data would be the URL requested
                         if (evt.data === uri) {
                         if (typeof file === "string") { // file is an object URL
                         get_URL().revokeObjectURL(file);
                         } else { // file is a File
                         file.remove();
                         }
                         }
                         }
                         ;
                         view.addEventListener("downloadfinished", revoker);
                         */
                        setTimeout(revoker, arbitrary_revoke_timeout);
                    }
                    , dispatch = function(filesaver, event_types, event) {
                        event_types = [].concat(event_types);
                        var i = event_types.length;
                        while (i--) {
                            var listener = filesaver["on" + event_types[i]];
                            if (typeof listener === "function") {
                                try {
                                    listener.call(filesaver, event || filesaver);
                                } catch (ex) {
                                    throw_outside(ex);
                                }
                            }
                        }
                    }
                    , auto_bom = function(blob) {
                        // prepend BOM for UTF-8 XML and text/* types (including HTML)
                        if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                            return new Blob(["\ufeff", blob], {type: blob.type});
                        }
                        return blob;
                    }
                    , FileSaver = function(blob, name, no_auto_bom) {
                        if (!no_auto_bom) {
                            blob = auto_bom(blob);
                        }
                        // First try a.download, then web filesystem, then object URLs
                        var
                            filesaver = this
                            , type = blob.type
                            , blob_changed = false
                            , object_url
                            , target_view
                            , dispatch_all = function() {
                                dispatch(filesaver, "writestart progress write writeend".split(" "));
                            }
                        // on any filesys errors revert to saving with object URLs
                            , fs_error = function() {
                                if (target_view && is_safari && typeof FileReader !== "undefined") {
                                    // Safari doesn't allow downloading of blob urls
                                    var reader = new FileReader();
                                    reader.onloadend = function() {
                                        var base64Data = reader.result;
                                        target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
                                        filesaver.readyState = filesaver.DONE;
                                        dispatch_all();
                                    };
                                    reader.readAsDataURL(blob);
                                    filesaver.readyState = filesaver.INIT;
                                    return;
                                }
                                // don't create more object URLs than needed
                                if (blob_changed || !object_url) {
                                    object_url = get_URL().createObjectURL(blob);
                                }
                                if (target_view) {
                                    target_view.location.href = object_url;
                                } else {
                                    var new_tab = view.open(object_url, "_blank");
                                    if (new_tab === undefined && is_safari) {
                                        //Apple do not allow window.open, see http://bit.ly/1kZffRI
                                        view.location.href = object_url
                                    }
                                }
                                filesaver.readyState = filesaver.DONE;
                                dispatch_all();
                                revoke(object_url);
                            }
                            , abortable = function(func) {
                                return function() {
                                    if (filesaver.readyState !== filesaver.DONE) {
                                        return func.apply(this, arguments);
                                    }
                                };
                            }
                            , create_if_not_found = {create: true, exclusive: false}
                            , slice
                            ;
                        filesaver.readyState = filesaver.INIT;
                        if (!name) {
                            name = "download";
                        }
                        if (can_use_save_link) {
                            object_url = get_URL().createObjectURL(blob);
                            setTimeout(function() {
                                save_link.href = object_url;
                                save_link.download = name;
                                click(save_link);
                                dispatch_all();
                                revoke(object_url);
                                filesaver.readyState = filesaver.DONE;
                            });
                            return;
                        }
                        // Object and web filesystem URLs have a problem saving in Google Chrome when
                        // viewed in a tab, so I force save with application/octet-stream
                        // http://code.google.com/p/chromium/issues/detail?id=91158
                        // Update: Google errantly closed 91158, I submitted it again:
                        // https://code.google.com/p/chromium/issues/detail?id=389642
                        if (view.chrome && type && type !== force_saveable_type) {
                            slice = blob.slice || blob.webkitSlice;
                            blob = slice.call(blob, 0, blob.size, force_saveable_type);
                            blob_changed = true;
                        }
                        // Since I can't be sure that the guessed media type will trigger a download
                        // in WebKit, I append .download to the filename.
                        // https://bugs.webkit.org/show_bug.cgi?id=65440
                        if (webkit_req_fs && name !== "download") {
                            name += ".download";
                        }
                        if (type === force_saveable_type || webkit_req_fs) {
                            target_view = view;
                        }
                        if (!req_fs) {
                            fs_error();
                            return;
                        }
                        fs_min_size += blob.size;
                        req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
                            fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
                                var save = function() {
                                    dir.getFile(name, create_if_not_found, abortable(function(file) {
                                        file.createWriter(abortable(function(writer) {
                                            writer.onwriteend = function(event) {
                                                target_view.location.href = file.toURL();
                                                filesaver.readyState = filesaver.DONE;
                                                dispatch(filesaver, "writeend", event);
                                                revoke(file);
                                            };
                                            writer.onerror = function() {
                                                var error = writer.error;
                                                if (error.code !== error.ABORT_ERR) {
                                                    fs_error();
                                                }
                                            };
                                            "writestart progress write abort".split(" ").forEach(function(event) {
                                                writer["on" + event] = filesaver["on" + event];
                                            });
                                            writer.write(blob);
                                            filesaver.abort = function() {
                                                writer.abort();
                                                filesaver.readyState = filesaver.DONE;
                                            };
                                            filesaver.readyState = filesaver.WRITING;
                                        }), fs_error);
                                    }), fs_error);
                                };
                                dir.getFile(name, {create: false}, abortable(function(file) {
                                    // delete file if it already exists
                                    file.remove();
                                    save();
                                }), abortable(function(ex) {
                                    if (ex.code === ex.NOT_FOUND_ERR) {
                                        save();
                                    } else {
                                        fs_error();
                                    }
                                }));
                            }), fs_error);
                        }), fs_error);
                    }
                    , FS_proto = FileSaver.prototype
                    , saveAs = function(blob, name, no_auto_bom) {
                        return new FileSaver(blob, name, no_auto_bom);
                    }
                    ;
                // IE 10+ (native saveAs)
                if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
                    return function(blob, name, no_auto_bom) {
                        if (!no_auto_bom) {
                            blob = auto_bom(blob);
                        }
                        return navigator.msSaveOrOpenBlob(blob, name || "download");
                    };
                }

                FS_proto.abort = function() {
                    var filesaver = this;
                    filesaver.readyState = filesaver.DONE;
                    dispatch(filesaver, "abort");
                };
                FS_proto.readyState = FS_proto.INIT = 0;
                FS_proto.WRITING = 1;
                FS_proto.DONE = 2;

                FS_proto.error =
                    FS_proto.onwritestart =
                        FS_proto.onprogress =
                            FS_proto.onwrite =
                                FS_proto.onabort =
                                    FS_proto.onerror =
                                        FS_proto.onwriteend =
                                            null;

                return saveAs;
            }(
                typeof self !== "undefined" && self
                || typeof window !== "undefined" && window
                || this.content
            ));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

    if (typeof module !== "undefined" && module.exports) {
        module.exports.saveAs = saveAs;
    } else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
        define([], function() {
            return saveAs;
        });
    }

    var saveTextAs = window.saveTextAs
        || (function (textContent, fileName, charset) {
            fileName = fileName || 'download.txt';
            charset = charset || 'utf-8';
            textContent = (textContent || '').replace(/\r?\n/g, "\r\n");
            if (saveAs && Blob) {
                var blob = new Blob([textContent], { type: "text/plain;charset=" + charset });
                saveAs(blob, fileName);
                return true;
            } else {//IE9-
                var saveTxtWindow = window.frames.saveTxtWindow;
                if (!saveTxtWindow) {
                    saveTxtWindow = document.createElement('iframe');
                    saveTxtWindow.id = 'saveTxtWindow';
                    saveTxtWindow.style.display = 'none';
                    document.body.insertBefore(saveTxtWindow, null);
                    saveTxtWindow = window.frames.saveTxtWindow;
                    if (!saveTxtWindow) {
                        saveTxtWindow = File.popup || window.open('', '_temp', 'width=100,height=100');
                        if (!saveTxtWindow) {
                            //window.alert('Sorry, download file could not be created.');
                            return false;
                        }
                    }
                }

                var doc = saveTxtWindow.document;
                doc.open('text/html', 'replace');
                doc.charset = charset;
                // if the textContent is a full html page then we need to update the entire document not only the body
                doc.write(textContent);
                doc.close();

                var retValue = doc.execCommand('SaveAs', null, fileName);
                saveTxtWindow.close();
                return retValue;
            }
        });

    File.saveAs = function(content, filename, charset, mimeType){
        var deferred;

        if(this.requiresPopup()){
            return this.downloadBinaryAs(content, filename, charset || 'UTF-8', mimeType || 'text/plain');
        }else{
            deferred = new Ext.Deferred();

            if(saveTextAs(content, filename, charset)) {
                deferred.resolve();
            }else{
                deferred.reject();
            }
            return deferred.promise;
        }
    };

    if(saveAs && Blob){
        File.saveBlobAs = function(textContent, fileName, charset, mimeType){
            var deferred = new Ext.Deferred();

            var uint8 = new Uint8Array(textContent.length),
                len = uint8.length,
                bType = {type: mimeType || 'application/octet-stream'},
                blob, i;

            for (i = 0; i < len; i++) {
                uint8[i] = textContent.charCodeAt(i);
            }

            blob = new Blob([uint8], bType);
            saveAs(blob, fileName);
            deferred.resolve();
            return deferred.promise;
        };
    }
});

