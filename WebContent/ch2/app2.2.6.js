(function() {
  var  init = function() {
    var orderForm = document.forms.order,
        saveBtn = document.getElementById('saveOrder'),
        saveBtnClicked = false;

    var saveForm = function() {

      if(!('formAction' in document.createElement('input'))) {
        var formAction = saveBtn.getAttribute('formaction');
        orderForm.setAttribute('action',formAction);
      }
      saveBtnClicked = true;
    };
    saveBtn.addEventListener('click',saveForm, false);

  };
  window.addEventListener('load',init, false);
}) ();
