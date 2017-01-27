function createExpense(params) {
  // create new item with jQuery superpowers!
  return $(
    '<div class="item">' +
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
          $('.ui.list .remove.icon').on('click', removeExpense);
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
    $.ajax({
        url: './v1/expenses/',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
      })
      .done(function(res) {
        if (Array.isArray(res)) {
          $('.ui.list').children().remove();
          res.forEach(expense => {
            $('.ui.list').append(createExpense(expense));
          });
          $('.ui.list .remove.icon').on('click', removeExpense);
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
  // click menu icons
  $('#menuSignup').on('click', function() { $('#signup').modal('show'); });
  $('#menuSignin').on('click', function() { $('#signin').modal('show'); });
  $('#menuAdd').on('click', function() { $('#expense').modal('show'); });
  $('#menuRefresh').on('click', refreshExpenses);
  // define API endpoints
  $.fn.api.settings.api = {
    'users': '/v1/users',
    'auth': '/v1/auth',
    'expenses': '/v1/expenses',
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
  // create expense api settings
  $('#expense .ui.submit.button').api({
    action : 'expenses',
    method : 'POST',
    onSuccess: function(res) {
      $('#expense .ui.form .message').remove();
      appendMessage({
        message: 'success!',
        type: 'success',
        parent: $('#expense .ui.form'),
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
      $('#expense .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message || res,
        type: 'error',
        parent: $('#expense .ui.form'),
      });
    },
    beforeSend: function(settings) {
      settings.data = {
        amount: $('#expense .ui.form input[name=amount]').val(),
        description: $('#expense .ui.form input[name=description]').val(),
        comment: $('#expense .ui.form input[name=comment]').val(),
        date: $('#expense .ui.form input[name=date]').val(),
        time: $('#expense .ui.form input[name=time]').val(),
      }
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
  $('#expense .ui.form').form({
    fields: {
      amount: ['number', 'empty'],
      description: ['minLength[2]', 'empty'],
      date: ['validDate', 'empty'],
      time: ['validTime', 'empty'],
    }
  });
};
