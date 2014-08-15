(function() {
    // This is the app2.4.2.js with out much of the older browser code
    var init = function() {
        var orderForm = document.forms.order;
        var saveBtn = document.getElementById('saveOrder');
        var saveBtnClicked = false;

        var saveForm = function() {

            if (!('formAction' in document.createElement('input'))) {
                var formAction = saveBtn.getAttribute('formaction');
                orderForm.setAttribute('action', formAction);
            }
            saveBtnClicked = true;
        };
        saveBtn.addEventListener('click', saveForm, false);

        var qtyFields = orderForm.quantity;
        var totalFields = document.getElementsByClassName('item_total');
        var orderTotalField = document.getElementById('order_total');

        var formatMoney = function(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        var calculateTotals = function() {
            var i = 0;
            var ln = qtyFields.length;
            var itemQty = 0;
            var itemPrice = 0.00;
            var itemTotal = 0.00;
            var itemTotalMoney = '$0.00';
            var orderTotal = 0.00;
            var orderTotalMoney = '$0.00';

            for (; i < ln; i++) {
                // Test for existence of valueAsNumber property.
                // The !! is used to cast the property valueAsNumber to a Boolean type
                // The first ! negates the truthness of the property and converts it to a Boolean
                // The second ! converts the Boolean to its original truth state
                if (!!qtyFields[i].valueAsNumber) {
                    // Use HTML5 valueAsNumber
                    itemQty = qtyFields[i].valueAsNumber || 0;
                } else {
                    // Browser does not support valueAsNumber fall back older non-HTML5 method
                    itemQty = parseFloat(qtyFields[i].value) || 0;
                }

                // Check to see if Browser supports dataset is supported HTML5 data-*
                if (!!qtyFields[i].dataset) {
                    itemPrice = parseFloat(qtyFields[i].dataset.price);
                } else {
                    // If not, fall back to older method
                    itemPrice = parseFloat(qtyFields[i].getAttribute('data-price'));
                }

                // Update Totals
                itemTotal = itemQty * itemPrice;
                itemTotalMoney = '$' + formatMoney(itemTotal.toFixed(2));
                orderTotal += itemTotal;
                orderTotalMoney = '$' + formatMoney(orderTotal.toFixed(2));

                // Check if Browser supports HTML5 value
                if (!!totalFields[i].value) {
                    totalFields[i].value = itemTotalMoney;
                    orderTotalField.value = orderTotalMoney;
                } else {
                    // If not, fall back to older method
                    totalFields[i].innerHTML = itemTotalMoney;
                    orderTotalField.innerHTML = orderTotalMoney;
                }
            }
        };
        calculateTotals();

        var qtyListeners = function() {
            var i = 0;
            var ln = qtyFields.length;

            for (; i < ln; i++) {
                qtyFields[i].addEventListener('input', calculateTotals, false);
                qtyFields[i].addEventListener('keyup', calculateTotals, false);
            }
        };
        qtyListeners();

        var doCustomValidity = function(field, msg) {
            // Check for browser support of HTTP5 setCustomValidity method
            if ('setCustomValidity' in field) {
                field.setCustomValidity(msg);
            } else {
                field.validationMessage = msg;
            }
        };

        var validateForm = function() {
            doCustomValidity(orderForm.name, '');
            doCustomValidity(orderForm.password, '');
            doCustomValidity(orderForm.confirm_password, '');
            doCustomValidity(orderForm.card_name, '');

            // This is added for older browsers
            if (!Modernizr.inputtypes.month || !Modernizr.input.pattern) {
                fallbackValidation();
            }

            if (orderForm.name.value.length < 4) {
                doCustomValidity(orderForm.name, 'Full name must be at least 4 characters long');
            }

            if (orderForm.password.value.length < 8) {
                doCustomValidity(orderForm.password, 'Password must be at least 8 characters long');
            }

            if (orderForm.password.value != orderForm.confirm_password.value) {
                doCustomValidity(orderForm.confirm_password, 'Confirm password must match');
            }

            if (orderForm.card_name.value.length < 4) {
                doCustomValidity(orderForm.card_name, 'Name on card must be at least 4 characters long');
            }
        };
        orderForm.addEventListener('input', validateForm, false);
        orderForm.addEventListener('keyup', validateForm, false);

        var styleInvalidForm = function() {
            orderForm.className = 'invalid';
        };
        orderForm.addEventListener('invalid', styleInvalidForm, true);

        // This should add the date setter to older browsers
        Modernizer.load({
            test : Modernizer.inputtypes.month,
            nope : 'monthpicker.js'
        });

        // Submit validation for older browsers
        var getFielsLabel = function(field) {
            if ('labels' in field && field.label.length > 0) {
                return field.label[0].innerText;
            }

            if (field.parentNode && field.parentNode.tagName.toLowerCase == 'label') {
                return field.parentNode.innerText;
            }

            return '';
        };

        // Submit validation for older browsers
        var submitForm = function(e) {
            if (!saverBtnClicked) {
                validateForm();
            }

            var i = 0;
            var ln = orderForm.length;
            var field;
            var errors = [];
            var errorFields = [];
            var errorMsg = '';

            for (; i < ln; i++) {
                field = orderForm[i];
                if (!!field.validationMessage && field.validationMessage.length > 0 || (!!field.checkValidity && !field.checkValidity())) {
                    errors.push(getFieldLabel(field) + ': ' + field.validationMessage);
                    errorFields.push(field);
                }

                if (errors.length > 0) {
                    e.prventDefault();

                    errorMsg = errors.join('\n');

                    alert('Please fix the following errors:\n' + errorMsg, 'Error');
                    orderForm.className = 'invalid';
                    errorFields[0].focus();
                }
            }
        };
        orderForm.addEventListener('submit', submitForm, false);

        // Submit validation for older browsers
        var fallbackValidation = function() {
            var i = 0, ln = orderForm.length, field;
            for (; i < ln; i++) {
                field = orderForm[i];
                doCustomValidity(field, '');
                if (field.hasAttribute('pattern')) {
                    var pattern = new RegExp(field.getAttribute('pattern').toString());
                    if (!pattern.test(field.value)) {
                        var msg = 'Please match the requested format.';
                        if (field.hasAttribute('title') && field.getAttribute('title').length > 0) {
                            msg += ' ' + field.getAttribute('title');
                        }
                        doCustomValidity(field, msg);
                    }
                }
                if (field.hasAttribute('type') && field.getAttribute('type').toLowerCase() === 'email') {
                    var pattern = new RegExp(/\S+@\S+\.\S+/);
                    if (!pattern.test(field.value)) {
                        doCustomValidity(field, 'Please enter an email address.');
                    }
                }
                if (field.hasAttribute('required') && field.value.length < 1) {
                    doCustomValidity(field, 'Please fill out this field.');
                }
            }
        };

    };
    window.addEventListener('load', init, false);
})();
