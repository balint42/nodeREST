// jQuery helper to search by dynamically updated data attributes
$.fn.findByData = function(attr, val) {
  return this.filter(
    function() { return $(this).data(attr) == val; }
  );
}
// window.onload waits until all JS loaded, document.ready does not
window.onload = () => {
  setUiState(false);
  const tokens = Object.create(Object.prototype, {
    access: {
      get: function() { return this.__a; },
      set: function(val) {
        this.__a = val;
        setUiState(val && this.__r);
      }
    },
    refresh: {
      get: function() { return this.__r; },
      set: function(val) {
        this.__r = val;
        setUiState(val && this.__a);
      }
    }
  });
  function setUiState(enabled) {
    if (enabled) {
      ['#menuAdd', '#menuRefresh'].forEach(function(id) {
        $(id + ' .icon').removeClass('disabled');
        $(id).css('pointerEvents', 'auto');
      });
    } else {
      ['#menuAdd', '#menuRefresh'].forEach(function(id) {
        $(id + ' .icon').addClass('disabled');
        $(id).css('pointerEvents', 'none');
      });
    }
  }
  function createExpense(params) {
    // create new item with jQuery superpowers!
    const res = $(
      '<div class="item" ' +
        'data-id="' + params.id + '" ' +
        'data-amount="' + params.amount + '"' +
        'data-description="' + params.description + '"' +
        'data-comment="' + params.comment + '"' +
        'data-date="' + params.date + '"' +
        'data-time="' + params.time + '"' +
      '>' +
        '<div class="left floated content">' +
          '<i class="edit link icon"></i>' +
        '</div>' +
        '<div class="left floated content">' +
          '<i class="remove link icon"></i>' +
        '</div>' +
        '<i class="big dollar icon"></i>' +
        '<div class="content">' +
          '<a class="header">' + params.date + ' @ ' + params.time + '</a>' +
          '<a class="header">' + params.description + ' — ' + params.amount + ' $</a>' +
          '<div class="description">' + params.comment + '</div>' +
          '<div class="description">' + params.user.email + '</div>' +
        '</div>' +
      '</div>'
    );
    $(res).find('.remove.icon').on('click', removeExpense);
    $(res).find('.edit.icon').on('click', function() {
      const item = $(this).closest('.item');
      $('#expensePatch').data('id', item.data('id'));
      $('#expensePatch').find('input[name=amount]').val(item.data('amount'));
      $('#expensePatch').find('input[name=description]').val(item.data('description'));
      $('#expensePatch').find('input[name=comment]').val(item.data('comment'));
      $('#expensePatch').find('input[name=date]').val(item.data('date'));
      $('#expensePatch').find('input[name=time]').val(item.data('time'));
      $('#expensePatch').modal('show');
    });
    return res;
  }
  function appendMessage(params) {
    $(params.parent).addClass(params.type);
    $(params.parent).append(
      $(
        '<div class="ui ' + params.type + ' message">' +
          '<i class="close icon"></i>' +
          '<div class="header">' + params.type + '!</div>' +
          '<p>' + params.message + '</p>' +
        '</div>'
      )
      .on('click', function() {
        $(this)
          .closest('.message')
          .fadeOut();
      })
    );
  }
  function updateToken(cb) {
    $.ajax({
        url: './v1/auth',
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + tokens.refresh },
      })
      .done(function(res) {
        if (res.accessToken) tokens.access = res.accessToken;
        cb();
      })
      .fail(function(res) {
        cb();
      });
  }
  function refreshExpenses() {
    const target = $('#menuRefresh');
    $.ajax({
        url: './v1/expenses',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
      })
      .done(function(res) {
        if (Array.isArray(res)) {
          $('.ui.list').children().remove();
          res.forEach(expense => {
            $('.ui.list').append(createExpense(expense));
          });
        }
      })
      .fail(function(res) {
        if (res.responseText === 'Unauthorized') {
          updateToken(function() {
            $(target).click();
          });
        };
      });
  }
  function removeExpense() {
    const target = this;
    const id = $(this).closest('.item').data('id');
    $.ajax({
        url: './v1/expenses/' + id,
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
        dataType: 'text',
      })
      .done(function(res, textStatus) {
        $(target).closest('.item').remove();
      })
      .fail(function(res, textStatus) {
        if (res.responseText === 'Unauthorized') {
          updateToken(function() {
            $(target).click();
          });
        };
      });
  }
  // click menu icons
  $('#menuSignup').on('click', function() { $('#signup').modal('show'); });
  $('#menuSignin').on('click', function() { $('#signin').modal('show'); });
  $('#menuAdd').on('click', function() { $('#expensePost').modal('show'); });
  $('#menuRefresh').on('click', refreshExpenses);
  // define API endpoints
  $.fn.api.settings.api = {
    'users': '/v1/users',
    'auth': '/v1/auth',
    'expenses': '/v1/expenses',
    'expensesId': '/v1/expenses/{id}',
  };
  // custom form validation rules
  $.fn.form.settings.rules.validDate = function(value) {
    try { return moment(value).isValid(); }
    catch(e) { return false; }
  };
  $.fn.form.settings.rules.validTime = function(value) {
    try { return moment('2017-01-01T' + value + 'Z').isValid(); }
    catch(e) { return false; }
  };
  // signup api settings
  $('#signup .ui.submit.button').api({
    action : 'users',
    method : 'POST',
    onSuccess: function(res) {
      $('#signup .ui.form .message').remove();
      appendMessage({
        message: 'success signing up, sign in using your chosen credentials',
        type: 'success',
        parent: $('#signup .ui.form'),
      });
    },
    onFailure: function(res) {
      $('#signup .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message,
        type: 'error',
        parent: $('#signup .ui.form'),
      });
    },
    beforeSend: function(settings) {
      const pw = $('#signup .ui.form input[name=password]').val();
      settings.data = {
        email: $('#signup .ui.form input[name=email]').val(),
        password: pw ? CryptoJS.MD5(pw).toString() : pw,
      }
      return settings;
    }
  });
  // signin api settings
  $('#signin .ui.submit.button').api({
    action : 'auth',
    method : 'POST',
    onSuccess: function(res) {
      tokens.access = res.accessToken;
      tokens.refresh = res.refreshToken;
      $('#signin .ui.form .message').remove();
      appendMessage({
        message: 'success signing in',
        type: 'success',
        parent: $('#signin .ui.form'),
      });
      refreshExpenses();
    },
    onFailure: function(res) {
      $('#signin .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message,
        type: 'error',
        parent: $('#signin .ui.form'),
      });
    },
    beforeSend: function(settings) {
      const pw = $('#signin .ui.form input[name=password]').val();
      settings.data = {
        email: $('#signin .ui.form input[name=email]').val(),
        password: pw ? CryptoJS.MD5(pw).toString() : pw,
      }
      return settings;
    }
  });
  // create expense post api settings
  $('#expensePost .ui.submit.button').api({
    action : 'expenses',
    method : 'POST',
    onSuccess: function(res) {
      $('#expensePost .ui.form .message').remove();
      appendMessage({
        message: 'success!',
        type: 'success',
        parent: $('#expensePost .ui.form'),
      });
      refreshExpenses();
    },
    onFailure: function(res) {
      if (res === 'Unauthorized') {
        const target = this;
        updateToken(function() {
          $(target).click();
        });
      };
      $('#expensePost .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message || res,
        type: 'error',
        parent: $('#expensePost .ui.form'),
      });
    },
    beforeSend: function(settings) {
      settings.data = {
        amount: $('#expensePost .ui.form input[name=amount]').val(),
        description: $('#expensePost .ui.form input[name=description]').val(),
        comment: $('#expensePost .ui.form input[name=comment]').val(),
        date: $('#expensePost .ui.form input[name=date]').val(),
        time: $('#expensePost .ui.form input[name=time]').val(),
      }
      return settings;
    },
    beforeXHR: function(xhr) {
      xhr.setRequestHeader ('Authorization', 'Bearer ' + tokens.access);
    }
  });
  // create expense patch api settings
  $('#expensePatch .ui.submit.button').api({
    action : 'expensesId',
    method : 'PATCH',
    onSuccess: function(res) {
      $('#expensePatch .ui.form .message').remove();
      appendMessage({
        message: 'success!',
        type: 'success',
        parent: $('#expensePatch .ui.form'),
      });
      refreshExpenses();
    },
    onFailure: function(res) {
      if (res === 'Unauthorized') {
        const target = this;
        updateToken(function() {
          $(target).click();
        });
      };
      $('#expensePatch .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message || res,
        type: 'error',
        parent: $('#expensePatch .ui.form'),
      });
    },
    beforeSend: function(settings) {
      settings.data = {
        amount: $('#expensePatch .ui.form input[name=amount]').val(),
        description: $('#expensePatch .ui.form input[name=description]').val(),
        comment: $('#expensePatch .ui.form input[name=comment]').val(),
        date: $('#expensePatch .ui.form input[name=date]').val(),
        time: $('#expensePatch .ui.form input[name=time]').val(),
      };
      settings.urlData = { id: $('#expensePatch').data('id') };
      return settings;
    },
    beforeXHR: function(xhr) {
      xhr.setRequestHeader ('Authorization', 'Bearer ' + tokens.access);
    }
  });
  // signup form validation
  $('#signup .ui.form').form({
    fields: {
      email: ['email', 'empty'],
      password: ['minLength[8]', 'empty'],
    }
  });
  // signin form validation
  $('#signin .ui.form').form({
    fields: {
      email: ['email', 'empty'],
      password: ['minLength[8]', 'empty'],
    }
  });
  // expense form validation
  $('#expensePost .ui.form', '#expensePatch .ui.form').form({
    fields: {
      amount: ['number', 'empty'],
      description: ['minLength[2]', 'empty'],
      date: ['validDate', 'empty'],
      time: ['validTime', 'empty'],
    }
  });
};
