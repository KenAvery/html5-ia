(function() {
    // This constructor function is where the rest of the app's code should be inserted
    var SuperEditor = function() {
        // These variables will store the current view and filename (if in the File Editor
        // view) and a marker to indicate if the document has been modified (isDirty)
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
        // If the user tries to close the window or navigate to another page, you'll check
        // to see if they've made unsaved changes and warn them first if necessary.
        window.addEventListener('beforeunload', checkDirty, false);

        // The jump event handler uses hashes in the URL to switch between the two views
        var jump = function(e) {
            var hash = location.hash;
            // If the URL hash contains a forward slash, it should show the File
            // Editor view for the file after the slash (if it exists).
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
            // Use the class attribute on the <body> element to indicate which is the
            // current view - the CSS will take care of showing/hiding the views as necessary.
            document.body.className = view;
        };
        jump();
        // The jump function is called on page load and whenever the URL hash changes.
        window.addEventListener('hashchange', jump, false);

        var editVisualButton = document.getElementById('edit_visual');
        var visualView = document.getElementById('file_contents_visual');
        var visualEditor = document.getElementById('file_contents_visual_editor');
        var visualEditorDoc = visualEditor.contentDocument;
        var editHtmlButton = document.getElementById('edit_html');
        var htmlView = document.getElementById('file_contents_html');
        var htmlEditor = document.getElementById('file_contents_html_editor');

        // Enable editing of the visual editor iframe by switching on its designMode property.
        visualEditorDoc.designMode = 'on';

        // Mark the file as dirty whenever the user makes changed to the either editor
        visualEditorDoc.addEventListener('keyup', markDirty, false);
        htmlEditor.addEventListener('keyup', markDirty, false);

        // This function updated the visual editor content, Every execution of updateVisualEditor
        // constructs a new document, so you must attach a new keyup event listener.
        var updateVisualEditor = function(content) {
            visualEditorDoc.open();
            visualEditorDoc.write(content);
            visualEditorDoc.close();
            visualEditorDoc.addEventListener('keyup', markDirty, false);
        };

        // This function updates the HTML editor contents
        var updateHtmlEditor = function(content) {
            htmlEditor.value = content;
        };

        // This event handler toggles between the visual and HTML editors, XMLSerializer
        // object is used to retrieve the HTML content of the iframe element
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

        // RichTextAction is the event handler for all buttons on the visual editor toolbar. When a user
        // clicks a toobar button, the event handler determines which button the user clicked.
        var richTextAction = function(e) {
            var command;
            var node = (e.target.nodeName === "BUTTON") ? e.target : e.target.parentNode;

            // The dataset object offers convenient access to the HTML5 data-* attributes
            // If the browser doesn't support this, the app falls back to the getAttribute method.
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
                // Check to see if the user's browser supports geolocation
                if (navigator.geolocation) {
                    node.innerHTML = 'Loading';
                    // The getCurrentPosition method will trigger the browser to ask the user for access to the user's location.
                    // If permission is granted, getCurrentPosition executes a callback function, passing the user's location
                    // in the form of a Position object.
                    navigator.geolocation.getCurrentPosition(function(pos) {
                        var coords = pos.coords.latitude + ',' + pos.coords.longitude;
                        var img = 'http://maps.googleapis.com/maps/api/staticmap?markers=' + coords + '&zoom=11&size=200x200&sensor=false';
                        // Use execCommand to insert a static Google Maps Image of the user's location.
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

        // Because this app will require a customized UI, showUI will be set to false. The third argument, value,
        // is passed a prompt method (of the window object). It contains a string prompting the user for and input
        // value and another string containing a default input value.

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
            storageInfo.queryUsageAndQuota(checkQuota, qmError);

            var getFS = function(quota) {
                // This requestFileSystem method is used to get the filesystem object.
                requestFileSystem(stType, quota, displayFileSystem, fsError);
            };

            var displayFileSystem = function(fs) {
                fileSystem = fs;
                // You'll implement updateBrowserFileList and displayBrowserFileList in a later section.
                // These functions will retrieve and display files in the app's filesystem.
                updateBrowserFilesList();

                if (view === 'editor') {
                    // You'll implement loadFile in a later section. If the editor
                    // view is the current view, then load the file into the editor
                    loadFile(fileName);
                }
            };

            var displayBrowserFileList = function(files) {
                fileListEl.innerHTML = '';
                // Update the file counter with the number of files in the filesystem
                document.getElementById('file_count').innerHTML = files.length;

                if (files.length > 0) {
                    // Iterate over each file in the filesystem using the forEach array function
                    files.forEach(function(file, i) {
                        // Draggable will be discussed in a later section on drag-and-drop interactivity
                        var li = '<li id="li_' + i + '" draggable="true">' + file.name + '<div><button id="view_' + i + '">View</button>' + '<button class="green" id="edit_' + i + '">Edit</button>' + '<button class="red" id="del_' + i + '">Delete</button>' + '</div></li>';
                        fileListEl.insertAdjacentHTML('beforeend', li);

                        var listItem = document.getElementById('li_' + i);
                        var viewBtn = document.getElementById('view_' + i);
                        var editBtn = document.getElementById('edit_' + i);
                        var deleteBtn = document.getElementById('del_' + i);

                        var doDrag = function(e) {
                            dragFile(file, e);
                        };
                        var doView = function() {
                            viewFile(file);
                        };
                        var doEdit = function() {
                            editFile(file);
                        };
                        var doDelete = function() {
                            deleteFile(file);
                        };

                        // Attach handlers to the View, Edit and Delete buttons and the list item itself
                        viewBtn.addEventListener('click', doView, false);
                        editBtn.addEventListener('click', doEdit, false);
                        deleteBtn.addEventListener('click', doDelete, false);
                        listItem.addEventListener('dragstart', doDrag, false);
                    });
                } else {
                    // If there are no files, show an empty list message.
                    fileListEl.innerHTML = '<li class="empty">No files to display</li>';
                }
            };

            var updateBrowserFilesList = function(files) {
                fileListEl.innerHTML = '';
                // Update the file counter with the number of files in the filesystem
                document.getElementById('file_count').innerHTML = files.length;

                if (files.length > 0) {
                    // Iterate over each file in the filesystem using the forEach array function
                    files.forEach(function(file, i) {
                        // Draggable will be discussed in a later section on drag-and-drop interactivity
                        var li = '<li id="li_' + i + '" draggable="true">' + file.name + '<div><button id="view_' + i + '">View</button>' + '<button class="green" id="edit_' + i + '">Edit</button>' + '<button class="red" id="del_' + i + '">Delete</button>' + '</div></li>';
                        fileListEl.insertAdjacentHTML('beforeend', li);

                        var listItem = document.getElementById('li_' + i);
                        var viewBtn = document.getElementById('view_' + i);
                        var editBtn = document.getElementById('edit_' + i);
                        var deleteBtn = document.getElementById('del_' + i);

                        var doDrag = function(e) {
                            dragFile(file, e);
                        };
                        var doView = function() {
                            viewFile(file);
                        };
                        var doEdit = function() {
                            editFile(file);
                        };
                        var doDelete = function() {
                            deleteFile(file);
                        };

                        // Attach handlers to the View, Edit and Delete buttons and the list item itself
                        viewBtn.addEventListener('click', doView, false);
                        editBtn.addEventListener('click', doEdit, false);
                        deleteBtn.addEventListener('click', doDelete, false);
                        listItem.addEventListener('dragstart', doDrag, false);
                    });
                } else {
                    // If there are no files, show an empty list message.
                    fileListEl.innerHTML = '<li class="empty">No files to display</li>';
                }
            };

            var updateBrowserFilesList = function() {
                // Create a directory reader. Later in the listing, you'll use it to get the complete list of files.
                var dirReader = fileSystem.root.createReader();
                var files = [];

                // The directory listing is read in one set of files at a time, so you'll use a
                // recursive function to keep reading until all files have been retrieved.
                var readFileList = function() {
                    dirReader.readEntries(function(fileSet) {
                        if (!fileSet.length) {
                            // When the end of the directory is reached, call the displayBrowserFileList
                            // function, passing the alphabetically stored files array as an argument
                            displayBrowserFileList(files.sort());
                        } else {
                            for (var i = 0, len = fileSet.length; i < len; i++) {
                                // If you're not at the end of the directory, push the files read into
                                // the files array and recursively call the readFileList function again.
                                files.push(fileSet[i]);
                            }
                            readFileList();
                        }
                    }, fsError);
                };
                readFileList();
            };

            // The getFile method takes four arguments:
            // (1) relative or absolute path to filename
            // (2) options object ({create: boolean, exclusive: boolean} - both default to false)
            // (3) success callback function
            // (4) error callback function
            // If a FileEntry is found, getFile passes the selected FileEntry to the fileEntry argument
            // of the success callback function. See table 3.1 for a list of possible options arguments
            // and their effect on getFile behavior.
            var loadFile = function(name) {
                fileSystem.root.getFile(name, {}, function(fileEntry) {
                    currentFile = fileEntry;
                    // This file method of the File System API is used to retrieve the file
                    // from the fileEntry and pass the file to the callback function.
                    fileEntry.file(function(file) {
                        var reader = new FileReader();
                        reader.onloadend = function(e) {
                            updateVisualEditor(this.result);
                            updateHtmlEditor(this.result);
                        };
                        // With a new FileReader created and its onloadend event defined, call
                        // readAsText to read the file and load it into reader's results attribute.
                        reader.readAsText(file);
                    }, fsError);
                }, fsError);
            };

            var viewFile = function(file) {
                // The toURL method makes it a breeze to view the contents of a file,
                // because you can simply launch it in a new browser window.
                window.open(file.toURL(), 'SuperEditorPreview', 'width=800, height=600');
            };

            // To edit the file, you load the file into the visual and HTML editors
            // and make the File Editor view active by changing the URL hash.
            var editFile = function(file) {
                loadFile(file.name);
                location.href = '#editor/' + file.name;
            };

            var deleteFile = function(file) {
                var deleteSuccess = function() {
                    alert('File ' + file.name + ' deleted successfully', 'File deleted');
                    updateBrowserFilesList();
                };

                if (confirm('File will be deleted. Are you sure?', 'Confirm delete')) {
                    // When the remove function has completed, it will execute the deleteSuccess callback function,
                    // which calls the updateBrowserFileList function to ensure the listing is updated.
                    file.remove(deleteSuccess, fsError);
                }
            };

            var createFile = function(field) {
                // The config object is passed to the getFile method, telling getFile to create
                // a FileEntry, but only if a FileEntry with that name doesn't exist.
                var config = {
                    create : true,
                    exclusive : true
                };

                var createSuccess = function(file) {
                    alert('File ' + file.name + ' created successfully', 'File created');
                    updateBrowserFilesList();
                    field.value = '';
                };

                fileSystem.root.getFile(field.value, config, createSuccess, fsError);
            };

            var createFormSubmit = function(e) {
                e.preventDefault();
                var name = document.forms.create.name;

                if (name.value.length > 0) {
                    var len = name.value.length;

                    if (name.value.substring(len - 5, len) === '.html') {
                        createFile(name);
                    } else {
                        alert('Only extension .html allowed', 'Create Error');
                    }
                } else {
                    alert('You must enter a file name', 'Create Error');
                }
            };

            document.forms.create.addEventListener('submit', createFormSubmit, false);
        } else {
            alert('File System API not supported', 'Unsupported');
        }

        var importFiles = function(files) {
            var count = 0;
            var validCount = 0;

            // If all of the files have been checked, show how many were
            // imported and how many failed and update the file list.
            var checkCount = function() {
                count++;

                if (count === files.length) {
                    var errorCount = count - validCount;
                    alert(validCount + ' file(s) imported' + errorCount + 'error(s) encountered.', 'Import complete');
                    updateBrowserFilesList();
                }
            };

            // Loop through the files the user has selected and attempt to create them in the app's filesystem.
            for (var i = 0, len = files.length; i < len; i++) {
                var file = files[i];

                // Because this for loop may execute a callback function that uses a file object, f, defined by the loop,
                // and because an iteration of the loop may finish before the callback has fired, a closure was implemented
                // to preserve the file object state.
                (function(f) {
                    var config = {
                        create : true,
                        exclusive : true
                    };

                    if (f.type == 'text/html') {
                        fileSystem.root.getFile(f.name, config, function(theFileEntry) {
                            theFileEntry.createWriter(function(fw) {
                                fw.write(f);
                                validCount++;
                                checkCount();
                            }, function(e) {
                                checkCount();
                            });
                        }, function(e) {
                            checkCount();
                        });
                    } else {
                        checkCount();
                    }
                })(file);
            }

        };

        var importFormSubmit = function(e) {
            e.preventDefault();

            // Read the files from the file's <import> element and call the
            // importFiles function if at least one file has been selected.
            var files = document.forms.import.files.files;

            if (files.length > 0) {
                importFiles(files);
            } else {
                alert('No file(s) selected', 'Import Error');
            }
        };
        document.forms.import.addEventListener('submit', importFormSubmit, false);

        var saveFile = function (callback) {
          // Check if the currently displayed view is the visual or HTML editor
          var currentView = function () {
            if (htmlView.style.display === 'block') {
                return 'html';
            }  else {
                return 'editor';
            }
          };

          var content;

          // Get the contents of the relevant editor
          if (currentView() === 'editor') {
              var x = new XMLSerializer ();

              content = x.serializeToString (visualEditorDoc);
          }  else {
              content = htmlEditor.value;
          }

          currentFile.createWriter (function (fw) {
              // When the file writer, fw, finishes resetting the file's length to zero, fw
              // triggers the onwriteend event handler. This event handler redefines fw's
              // onwriteend event handler and then saves the file by calling write
             fw.onwriteend = function (e) {
                 // When file writer, fw, has finished writing the currentfile, fw triggers
                 // the event handler for onwriteend. Callback refers to the callback
                 // function passed to the saveFile function.
               fw.onwriteend = function (e) {
                   if (typeof callback === 'function') {
                       callback (currentFile);
                   } else {
                       alert ('File saved successfully', 'File saved');
                   }
                   isDirty = false;
               };

               // Use a Blob to construct a blob object from content,
               // a string-based representation of the editor's content.
               var blob = new Blob ([content], {text: 'text/html', endings: 'native'});

               // Use the endings parameter to specify what type of end-of-line marker should be used.
               // A value of native instructs a Blob constructor to use an end-of-line marker
               // native to the browser's underlying OS.
               fw.write (blob);
             };

             fw.onerror = fsError;

             // Before saving data with file writer, fw, use truncate (0) to ensure its length attribute is
             // is set to zero. Otherwise, when the application saves a file that's shorter than its
             // previous version, the length attribute will be unchanged. As a result, you'd see old
             // text filling in the gap between the new shorter file and its previous longer version.
             fw.truncate (0);
          }, fsError);
        };

        var previewFile = function () {
            // SaveFile has been passed a callback function, viewFile. It's called when
            // saveFile has finished writing the editor contents to currentFile.
          saveFile (viewFile);
        };

        var saveBtn = document.getElementById ('file_save');
        var previewBtn = document.getElementById ('file_preview');

        saveBtn.addEventListener ('click', saveFile, false);
        previewBtn.addEventListener ('click', previewFile, false);

        // Designate the drop zone for files as the element with the ID filedrop.
        var fileDropZone = document.getElementById ('filedrop');

        // When files are dropped into the browser window, the default browser behavior is to load the files and
        // navigate away from the app, so you need to cancel this default behavior. First, invoke stopPropagation
        // to prevent the drop event from bubbling up to any ancestor elements of fileDropZone. Second, invoke
        // perventDefault to stop the browser from calling the default event handler attached to fileDropZone.
        var importByDrop = function (e) {
            e.stopPropagation ();
            e.preventDefault ();

            // If the user is dragging files, these will reside in the dataTransfer object. To load them
            // into the app, pass them to the importFiles function (define in listing 3.15).
            var files = e.dataTransfer.files;

            if (files.length > 0) {
                importFiles (files);
            }
        };

        var importDragOver = function (e) {
          e.preventDefault ();
          // because you want the import file(s) to be copied when they're dropped into the zone, set the dragover
          // event properties, effectAllowed and dropEffect, to copy. When the user drags the file over the drop
          // zone, the file image(s) will change to indicate a pending copy operation.
          e.dataTransfer.effectAllowed = 'copy';

          e.dataTransfer.dropEffect = 'copy';
          return false;
        };

        fileDropZone.addEventListener ('drop', importByDrop, false);
        fileDropZone.addEventListener ('dragover', importDragOver, false);

    };

    var init = function() {
        new SuperEditor();
    };

    window.addEventListener('load', init, false);
})();
