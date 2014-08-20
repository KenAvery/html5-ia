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

    };

    var init = function() {
        new SuperEditor();
    };

    window.addEventListener('load', init, false);
})();
