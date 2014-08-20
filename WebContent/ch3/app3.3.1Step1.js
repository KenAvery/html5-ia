(function() {
    var SuperEditor = function() {
        var view;
        var fileName;
        var isDirty = false;
        var unsavedMsg = 'Unsaved changes will be lost. Are you sure?';
        var unsavedTitle = 'Discard changes';

        var markDirty = function() {
            isDirty = true;
        };

        var markClean = function() {
            isDirty = false;
        };

        var checkDirty = function() {
            if (isDirty) {
                return unsavedMsg;
            }
        };
        window.addEventListener('beforeunload', checkDirty, false);

        var jump = function(e) {
            var hash = location.hash;
            if (hash.indexOf('/') > -1) {
                var parts = hash.split('/'), fileNameEl = document.getElementById('file_name');
                view = parts[0].substring(1) + '-view';
                fileName = parts[1];
                fileNameEl.innerHTML = fileName;
            } else {
                if (!isDirty || confirm(unsavedMsg, unsavedTitle)) {
                    markClean();
                    view = 'browser-view';
                    if (hash != '#list') {
                        location.hash = '#list';
                    }
                } else {
                    location.href = e.oldURL;
                }
            }
            document.body.className = view;
        };
        jump();
        window.addEventListener('hashchange', jump, false);

        var editVisualButton = document.getElementById('edit_visual');
        var visualView = document.getElementById('file_contents_visual');
        var visualEditor = document.getElementById('file_contents_visual_editor');
        var visualEditorDoc = visualEditor.contentDocument;
        var editHtmlButton = document.getElementById('edit_html');
        var htmlView = document.getElementById('file_contents_html');
        var htmlEditor = document.getElementById('file_contents_html_editor');

        visualEditorDoc.designMode = 'on';

        visualEditorDoc.addEventListener('keyup', markDirty, false);
        htmlEditor.addEventListener('keyup', markDirty, false);

        var updateVisualEditor = function(content) {
            visualEditorDoc.open();
            visualEditorDoc.write(content);
            visualEditorDoc.close();
            visualEditorDoc.addEventListener('keyup', markDirty, false);
        };
        var updateHtmlEditor = function(content) {
            htmlEditor.value = content;
        };
        var toggleActiveView = function() {
            if (htmlView.style.display == 'block') {
                editVisualButton.className = 'split_left active';
                visualView.style.display = 'block';
                editHtmlButton.className = 'split_right';
                htmlView.style.display = 'none';
                updateVisualEditor(htmlEditor.value);
            } else {
                editHtmlButton.className = 'split_right active';
                htmlView.style.display = 'block';
                editVisualButton.className = 'split_left';
                visualView.style.display = 'none';

                var x = new XMLSerializer();
                var content = x.serializeToString(visualEditorDoc);
                updateHtmlEditor(content);
            }
        };
        editVisualButton.addEventListener('click', toggleActiveView, false);
        editHtmlButton.addEventListener('click', toggleActiveView, false);

        var visualEditorToolbar = document.getElementById('file_contents_visual_toolbar');
        var richTextAction = function(e) {
            var command;
            var node = (e.target.nodeName === "BUTTON") ? e.target : e.target.parentNode;

            if (node.dataset) {
                command = node.dataset.command;
            } else {
                command = node.getAttribute('data-command');
            }

            var doPopupCommand = function(command, promptText, promptDefault) {
                visualEditorDoc.execCommand(command, false, prompt(promptText, promptDefault));
            };

            if (command === 'createLink') {
                doPopupCommand(command, 'Enter link URL:', 'http://www.example.com');
            } else if (command === 'insertImage') {
                doPopupCommand(command, 'Enter image URL:', 'http://www.example.com/image.png');
            } else if (command === 'insertMap') {
                if (navigator.geolocation) {
                    node.innerHTML = 'Loading';
                    navigator.geolocation.getCurrentPosition(function(pos) {
                        var coords = pos.coords.latitude + ',' + pos.coords.longitude;
                        var img = 'http://maps.googleapis.com/maps/api/staticmap?markers=' + coords + '&zoom=11&size=200x200&sensor=false';
                        visualEditorDoc.execCommand('insertImage', false, img);
                        node.innerHTML = 'Location Map';
                    });
                } else {
                    alert('Geolocation not available', 'No geolocation data');
                }
            } else {
                visualEditorDoc.execCommand(command);
            }
        };
        visualEditorToolbar.addEventListener('click', richTextAction, false);

        // For convenience, point the filesystem objects to possible vendor prefixes.
        // If the browser doesn't support these objects, the objects will have a false value.
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem || window.mozRequestFileSystem || window.msRequestFileSystem || false;
        window.storageInfo = navigator.persistentStorage || navigator.webkitPersistentStorage || navigator.mozPersistentStorage || navigator.msPersistentStorage || false;

        // Define basic variables for use in the app: storage type and size, filesystem object,
        // the file file list element, and the currently selected file (when editing)
        var stType = window.PERSISTENT || 1;
        var stSize = (5 * 1024 * 1024);
        var fileSystem;
        var fileListEl = document.getElementById('files');
        var currentFile;

        // Standard error function for all File System API method calls.
        var fsError = function(e) {
            if (e.code === 9) {
                alert('File name already exists', 'File System Error');
            } else {
                alert('An unexpected error occured. Error code: ' + e.code);
            }
        };

        // Standard error function for all Quota Management API method calls
        var qmError = function(e) {
            if (e.code === 22) {
                alert('Quota exceeded.', 'Quota Management Error');
            } else {
                alert('An unexpected error occurred. Error code: ' + e.code);
            }
        };

        // Check to see if the browser supports the File System API and the Quota Management API (also known as StorageInfo)
        if (requestFileSystem && storageInfo) {
            var checkQuota = function(currentUsage, quota) {
                if (quota === 0) {
                    // Because this app has a persistent filesystem, the request for quota will trigger
                    // a message asking the user's permission to access the browser's filesystem
                    storageInfo.requestQuota(stType, stSize, getFS, qmError);
                } else {
                    getFS(quota);
                }
            };
            // If queryUsageAndQuota successfully executes, it passes usage and quota info to the callback function,
            // checkQuota; otherwise, qmError is called. CheckQuota determines if sufficient quota exists to store
            // files; if not, then it needs to request a larger quota.
            storageInfo.queryUsageAndQuota(stType, checkQuota, qmError);

            var getFS = function(quota) {
                // This requestFileSystem method is used to get the filesystem object.
                requestFileSystem(stType, quota, displayFileSystem, isError);
            };

            var displayFileSystem = function(fs) {
                fileSystem = fs;
                // You'll implement updateBrowserFileList and displayBrowserFileList in a later section.
                // These functions will retrieve and display files in the app's filesystem.
                updateBrowserFileList();

                if (view === 'editor') {
                    // You'll implement loadFile in a later section. If the editor
                    // view is the current view, then load the file into the editor
                    loadFile(fileName);
                }
            };
        } else {
            alert('File System API not supported', 'Unsupported');
        }

    };

    var init = function() {
        new SuperEditor();
    };

    window.addEventListener('load', init, false);
})();
