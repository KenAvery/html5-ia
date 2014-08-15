(function() {
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

    };
    window.addEventListener('load', init, false);
})();