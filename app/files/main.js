// jQuery helper to search by dynamically updated data attributes
$.fn.findByData = function(attr, val) {
  return this.filter(
    function() { return $(this).data(attr) == val; }
  );
}
// window.onload waits until all JS loaded, document.ready does not
window.onload = () => {
  setUiState(false);
  var roleNames = ['', 'user', 'manager', 'admin'];
  var tokens = Object.create(Object.prototype, {
    access: {
      get: function() { return this.__a; },
      set: function(val) {
        this.__a = val;
        setUiState(val && this.__r);
        localStorage.setItem('tokens', JSON.stringify(tokens));
      }
    },
    refresh: {
      get: function() { return this.__r; },
      set: function(val) {
        this.__r = val;
        setUiState(val && this.__a);
        localStorage.setItem('tokens', JSON.stringify(tokens));
      }
    },
    role: {
      get: function() { return this.__ro; },
      set: function(val) {
        this.__ro = parseInt(val);
        setUiState(this.__ro);
        localStorage.setItem('tokens', JSON.stringify(tokens));
      }
    },
    email: {
      get: function() { return this.__em; },
      set: function(val) {
        this.__em = val;
        setUiState(this.__ro);
        localStorage.setItem('tokens', JSON.stringify(tokens));
      }
    },
  });
  var storedTokens = JSON.parse(localStorage.getItem('tokens'));
  if (storedTokens) {
    tokens.access = storedTokens.__a;
    tokens.refresh = storedTokens.__r;
    tokens.role = storedTokens.__ro;
    tokens.email = storedTokens.__em;
  }
  function setUiState(state) {
    $('#currentUser').text('');
    if (state) {
      $('#currentUser').append(tokens ? tokens.email + ' | ' + roleNames[tokens.role] : '');
      ['#menuAdd', '#menuRefresh', '#menuShowStats', '#menuSignout'].forEach(function(id) {
        $(id + ' .icon').removeClass('disabled');
        $(id).css('pointerEvents', 'auto');
      });
    } else {
      ['#menuAdd', '#menuRefresh', '#menuShowStats', '#menuSignout'].forEach(function(id) {
        $(id + ' .icon').addClass('disabled');
        $(id).css('pointerEvents', 'none');
        $('.ui.list').children().remove();
        $('.ui.grid').children().remove();
        $('.ui.grid').children().remove();
      });
    }
    if (state > 1) {
      ['#menuRefreshUsers'].forEach(function(id) {
        $(id + ' .icon').removeClass('disabled');
        $(id).css('pointerEvents', 'auto');
      });
    } else {
      ['#menuRefreshUsers'].forEach(function(id) {
        $(id + ' .icon').addClass('disabled');
        $(id).css('pointerEvents', 'none');
      });
    }
  }
  function createExpense(params) {
    // create new item with jQuery superpowers!
    var res = $(
      '<div class="item" ' +
        'data-id="' + params.id + '" ' +
        'data-amount="' + parseFloat(params.amount).toLocaleString() + '"' +
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
          '<div class="description">' + (params.user.email || 'deleted user') + '</div>' +
        '</div>' +
      '</div>'
    );
    $(res).find('.remove.icon').on('click', removeExpense);
    $(res).find('.edit.icon').on('click', function() {
      var item = $(this).closest('.item');
      $('#expensePatch').data('id', item.data('id'));
      $('#expensePatch').find('input[name=amount]').val(item.data('amount'));
      $('#expensePatch').find('input[name=description]').val(item.data('description'));
      $('#expensePatch').find('input[name=comment]').val(item.data('comment'));
      $('#expensePatch').find('input[name=date]').val(item.data('date'));
      $('#expensePatch').find('input[name=time]').val(item.data('time'));
      showModal('#expensePatch');
   });
   return res;
  }
  function createUser(params) {
    // create new item with jQuery superpowers!
    var res = $(
      '<div class="item" ' +
        'data-id="' + params.id + '" ' +
        'data-email="' + params.email + '"' +
        'data-role="' + roleNames[params.role] + '"' +
      '>' +
        '<div class="left floated content">' +
          '<i class="edit link icon"></i>' +
        '</div>' +
        '<div class="left floated content">' +
          '<i class="remove link icon"></i>' +
        '</div>' +
        '<i class="big user icon"></i>' +
        '<div class="content">' +
          '<a class="header">' + params.email + '</a>' +
          '<a class="header">' + roleNames[params.role] + '</a>' +
        '</div>' +
      '</div>'
    );
    $(res).find('.remove.icon').on('click', removeUser);
    $(res).find('.edit.icon').on('click', function() {
      var item = $(this).closest('.item');
      $('#userPatch').data('id', item.data('id'));
      $('#userPatch').find('input[name=email]').val(item.data('email'));
      $('#userPatch').find('input[name=role]').val(item.data('role'));
      showModal('#userPatch');
    });
    return res;
  }
  function createStats() {
    var years = {};
    $('.ui.list .item').each(function(idx, item) {
      var expense = $(item).data();
      expense.amount = parseFloat(expense.amount.toString().replace(',', '.'));
      var year = moment(expense.date + 'T' + expense.time + 'Z').year();
      var week = moment(expense.date + 'T' + expense.time + 'Z').week();
      var day = moment(expense.date + 'T' + expense.time + 'Z').day();
      if (! years[year]) years[year] = { weeks: {} };
      if (! years[year].weeks[week]) years[year].weeks[week] = { amount: 0, days: {} };
      if (! years[year].weeks[week].days[day]) years[year].weeks[week].days[day] = { amount: 0, count: 0 };
      years[year].weeks[week].amount += expense.amount;
      years[year].weeks[week].count++;
      years[year].weeks[week].days[day].amount += expense.amount;
      years[year].weeks[week].days[day].count++;
    });
    var gridItems = $.map(years, function(yearObj, year) {
      var items = [$('<div class="sixteen wide column">' + year + '</div>')];
      var weekItems = $.map(yearObj.weeks, function(weekObj, week) {
        // averages of each day
        var dayAvgs = $.map(weekObj.days, function(dayObj, day) {
          return dayObj.amount / dayObj.count;
        });
        // average of day averages
        var dayAvgsTotal = 0;
        dayAvgs.forEach(function(dayAvg) {
          dayAvgsTotal += dayAvg;
        });
        var dailyAvg = Math.round(dayAvgsTotal / dayAvgs.length * 100) / 100;
        var weekTotal = Math.round(weekObj.amount * 100) / 100;
        // create grid item
        var color = [
          'teal', 'red', 'orange', 'yellow', 'olive', 'green', 'blue',
          'violet', 'purple', 'pink', 'brown', 'brown', 'black'
        ][Math.round(Math.random() * 12)];
        var i = $(
          '<div class="' + color + ' column">' +
            '<h2>week' + week + '</h2>' +
            '<h3>total &nbsp;&nbsp;&nbsp;' + weekTotal + '</h3>' +
            '<h3>daily Ø ' + dailyAvg + '</h3>' +
          '</div>'
        );
        return i;
      });
      items = items.concat(weekItems);
      return items;
    });
    return $.map(gridItems, function(v) { return v; });
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
        if (res.role) tokens.role = res.role;
        cb();
      })
      .fail(function(res) {
        cb();
      });
  }
  function refreshExpenses() {
    var target = $('#menuRefresh');
    $('#filters1 .ui.form').submit();
    $('#filters2 .ui.form').submit();
    errorCount = $('#filters1 .ui.error div').length + $('#filters2 .ui.error div').length;
    if(errorCount !== 0) return;
    updateToken(function() {
      $.ajax({
        url: './v1/expenses',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
        data: {
          minDate: $('#filters1 .ui.form input[name=minDate]').val(),
          maxDate: $('#filters1 .ui.form input[name=maxDate]').val(),
          minTime: $('#filters1 .ui.form input[name=minTime]').val(),
          maxTime: $('#filters1 .ui.form input[name=maxTime]').val(),
          minAmount: $('#filters2 .ui.form input[name=minAmount]').val(),
          maxAmount: $('#filters2 .ui.form input[name=maxAmount]').val(),
          text: $('#filters2 .ui.form input[name=text]').val(),
        },
      })
      .done(function(res) {
        if (Array.isArray(res)) {
          $('.ui.list').children().remove();
          $('.ui.grid').children().remove();
          res.forEach(expense => {
            $('.ui.list').append(createExpense(expense));
          });
        }
      })
      .fail(function(res) {});
    });
  }
  function refreshUsers() {
    var target = $('#menuRefreshUsers');
    updateToken(function() {
      $.ajax({
        url: './v1/users',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
        data: {},
      })
      .done(function(res) {
        if (Array.isArray(res)) {
          $('.ui.list').children().remove();
          $('.ui.grid').children().remove();
          res.forEach(user => {
            $('.ui.list').append(createUser(user));
          });
        }
      })
      .fail(function(res) {});
    });
  }
  function showStats() {
    if ($('.ui.list *').length === 0) return;
    $('.ui.grid').children().remove();
    $('.ui.grid').append(createStats());
    $('.ui.list').children().remove();
  }
  function removeExpense() {
    var target = this;
    updateToken(function() {
      var id = $(this).closest('.item').data('id');
      $.ajax({
        url: './v1/expenses/' + id,
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
        dataType: 'text',
      })
      .done(function(res, textStatus) {
        $(target).closest('.item').remove();
      })
      .fail(function(res, textStatus) {});
    });
  }
  function removeUser() {
    var target = this;
    var id = $(this).closest('.item').data('id');
    updateToken(function() {
      $.ajax({
        url: './v1/users/' + id,
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + tokens.access },
        dataType: 'text',
      })
      .done(function(res, textStatus) {
        $(target).closest('.item').remove();
      })
      .fail(function(res, textStatus) {});
    });
  }
  function showModal(id) {
    $(id + ' .ui.form .message').remove();
    $(id).modal('show');
  }
  // click menu icons
  $('#menuSignup').on('click', function() { showModal('#signup'); });
  $('#menuSignin').on('click', function() { showModal('#signin'); });
  $('#menuSignout').on('click', function() {
    tokens.refresh = null;
    tokens.access = null;
    tokens.role = null;
    tokens.email = null;
    localStorage.removeItem('tokens');
  });
  $('#menuAdd').on('click', function() { showModal('#expensePost'); });
  $('#menuRefresh').on('click', refreshExpenses);
  $('#menuRefreshUsers').on('click', refreshUsers);
  $('#menuShowStats').on('click', showStats);
  // define API endpoints
  $.fn.api.settings.api = {
    'users': '/v1/users',
    'auth': '/v1/auth',
    'expenses': '/v1/expenses',
    'expensesId': '/v1/expenses/{id}',
    'usersId': '/v1/users/{id}',
  };
  // custom form validation rules
  $.fn.form.settings.rules.validDate = function(value) {
    try { return moment(value || undefined).isValid(); }
    catch(e) { return false; }
  };
  $.fn.form.settings.rules.validTime = function(value) {
    try { return moment(value ? '2017-01-01T' + value + 'Z' : undefined).isValid(); }
    catch(e) { return false; }
  };
  $.fn.form.settings.rules.validMinDate = function(value) {
    // if min time has value, require min date value too
    return $('input[name=minTime]').val() ? !! value : true;
  };
  $.fn.form.settings.rules.validMaxDate = function(value) {
    // if max time has value, require max date value too
    return $('input[name=maxTime]').val() ? !! value : true;
  };
  $.fn.form.settings.rules.validRole = function(value) {
    return roleNames.indexOf(value) > 0;
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
      var pw = $('#signup .ui.form input[name=password]').val();
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
      tokens.role = res.role;
      tokens.email = this._email;
      $('#signin .ui.form .message').remove();
      appendMessage({
        message: 'success signing in',
        type: 'success',
        parent: $('#signin .ui.form'),
      });
      refreshExpenses();
      $('#signin').modal('hide');
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
      var pw = $('#signin .ui.form input[name=password]').val();
      this._email = $('#signin .ui.form input[name=email]').val();
      settings.data = {
        email: this._email,
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
        var target = this;
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
  // update expense patch api settings
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
        var target = this;
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
  // update user patch api settings
  $('#userPatch .ui.submit.button').api({
    action : 'usersId',
    method : 'PATCH',
    onSuccess: function(res) {
      $('#userPatch .ui.form .message').remove();
      appendMessage({
        message: 'success!',
        type: 'success',
        parent: $('#userPatch .ui.form'),
      });
      refreshUsers();
    },
    onFailure: function(res) {
      if (res === 'Unauthorized') {
        var target = this;
        updateToken(function() {
          $(target).click();
        });
      };
      $('#userPatch .ui.form .message:has(.icon.close)').remove();
      appendMessage({
        message: res.message || res || 'Unauthorized',
        type: 'error',
        parent: $('#userPatch .ui.form'),
      });
    },
    beforeSend: function(settings) {
      var roleNumber = roleNames.indexOf($('#userPatch .ui.form input[name=role]').val());
      settings.data = {
        email: $('#userPatch .ui.form input[name=email]').val(),
        role: roleNumber,
      };
      settings.urlData = { id: $('#userPatch').data('id') };
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
  // userPatch form validation
  $('#userPatch .ui.form').form({
    fields: {
      email: ['email', 'empty'],
      role: ['validRole', 'empty'],
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
  // filters1 form validation
  $('#filters1 .ui.form').form({
    fields: {
      minDate: ['validDate', 'validMinDate'],
      maxDate: ['validDate', 'validMaxDate'],
      minTime: ['validTime'],
      maxTime: ['validTime'],
    }
  });
  // filters2 form validation
  $('#filters2 .ui.form').form({
    fields: {
      minAmount: ['number'],
      maxAmount: ['number'],
    }
  });
};
