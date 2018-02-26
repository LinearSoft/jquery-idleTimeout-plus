/**
 * Written by: Jason Abraham (CrashSensei)
 * Email: jason@linearsoft.com
 * License: GPLv3 (https://www.gnu.org/licenses/gpl-3.0-standalone.html)
 *
 * Configurable idle (no activity) timer and logout redirect for jQuery.
 * Supports both jQueryUI dialogs or Bootstrap modals
 * Works across multiple windows, tabs from the same domain.
 * Additional support for iFrames (not extensively tested) /* --strip_iframe-- */ /*
 *
 * Initially forked from Jill Elaine's jquery-idleTimeout
 * Bootstrap code and other code influenced by bootstrap-session-timeout by orangehill
 *
 * Dependencies: JQuery v1.7+,
 *      Multi-window support requires JQuery Storage API
 *      Dialogs require either jQueryUI or Bootstrap
 *
 * version 0.10.0
 **/

(function(root, factory) {
  /** @namespace define.amd */
  /** @namespace root.jQuery */
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    root.IdleTimeoutPlus = factory(root.jQuery);
  }
}(this, function($) {
  console.log('jitp: library load');

  //#########################################################################
  //###  Config & Vars
  //#########################################################################
  var config = {
    // Idle settings
    idleTimeLimit:      1200,                             // 'No activity' time limit in seconds. 1200 = 20 Minutes
    idleCallback:       false,                            // Called when the idleTimer is started (you can use this to close your custom warn/lock screens if needed)
    idleCheckHeartbeat: 2,                                // Frequency to check for idle timeouts in seconds
    bootstrap:          false,                            // Use bootstrap framework instead of jQuery
    activityEvents:     'click keypress scroll wheel mousewheel mousemove touchmove',  // configure which activity events to detect separate each event with a space, set to false for none

    // Warning settings
    warnEnabled:          true,                               // set to false to skip warning period
    warnTimeLimit:        180,                                // 3 Minutes
    warnCallback:         false,                              // Called when warning timer starts (wait dialog will only be shown if this returns true)
    warnContentCallback:  false,                              // Called for content of warning dialog box (SEE DOCUMENTATION!)
    warnTitle:            'Session Timeout',                  // setting to null will remove the title bar
    warnMessage:          'Your session is about to expire!',
    warnStayAliveButton:  'Stay Connected',
    warnLogoutButton:     'Logout',                           // Set to null to disable
    warnCountdownMessage: 'Time remaining: {timer}',          // Set to null to disable see doc on how to set
    warnCountdownBar:     false,

    // Auto-Url settings              (NOTE: if a callback is defined auto url redirection will only occur if the callback returns true)
    redirectUrl:        '/timed-out', // URL if no action is taken after the warning/lock screen timeout
    logoutUrl:          '/logout',    // URL if the user clicks "Logout" on the warning/lock screen
    logoutAutoUrl:      'null',       // URL for secondary tabs that received an automatic logout trigger (to help avoid race conditions)
    redirectCallback:   false,
    logoutCallback:     false,
    logoutAutoCallback: false,

    // Session keep alive settings
    keepAliveInterval: 600,                   // ping the server at this interval in seconds. 600 = 10 Minutes. Set to false to disable pings
    keepAliveUrl:      window.location.href,  // set URL to ping - does not apply if keepAliveInterval: false
    keepAliveAjaxType: 'GET',
    keepAliveAjaxData: '',

    // Lock Screen settings
    lockEnabled:          false,                      // Set to true to enable lock screen before redirecting
    lockTimeLimit:        7200,                       // 2 hrs
    lockHaltKeepAlive:    true,                       // Stop the keepAlive functionality during the lock screen timeout
    lockCallback:         false,                      // Called when lock screen timer starts (lock screen will only be shown if this returns true)
    lockContentCallback:  false,                      // Called for content of lock screen (SEE DOCUMENTATION!)
    lockPassCallback:     false,                      // Required if using any of the internal lock screen functions (This accepts one param)
    lockTitle:            null,                       // Lock title null=no title
    lockUsername:         'System User',              // Set to current user name (otherwise the internal lock screen will look crappy)
    lockMessage:          'Enter your password to unlock the screen',
    lockUnlockButton:     'UnLock',
    lockLogoutButton:     'Not {username} ?',         // This is actually an href link
    lockCountdownMessage: 'Auto-logout in: {timer}',
    lockBlockUiConfig:    {},                         // Customize the blockUI options
    lockLoadActive:       false,                      // If true the lock screen is automatically started

    // Extensions
    iframesSupport:     false,  // Enable iframe support (also requires multiWindow support to work) /* --strip_iframe-- */
    multiWindowSupport: false   // Requires jquery-storage-api
  };

  /* --strip_testing_begin-- */
  var testingConfig = {
    idleTimeLimit:     30,
    warnTimeLimit:     30,
    lockTimeLimit:     60,
    keepAliveInterval: 10,
    activityEvents:    'click keypress scroll wheel mousewheel'   // Remove mousemove
  };
  /* --strip_testing_end-- */

  var bodyElm = $('body'); // Store for jQuery optimization
  var dataStore = null;

  //#########################################################################
  // ###  Public API Functions
  //#########################################################################
  var api = {}; //Create return object

  /**
   * Starts the timers and initializes the config
   *
   * @param {object} userConfig - User config object
   * @return {boolean} - Returns true if successfully initialized
   */
  api.start = function(userConfig) {
    console.log('jitp: init called');
    //--Merge default and user configs
    config = $.extend(config, userConfig);
    config = $.extend(config, testingConfig, userConfig); /* --strip_testing-- */

    if (config.logoutAutoUrl === null) config.logoutAutoUrl = config.logoutUrl;
    //--Convert secs to millisecs
    config.idleTimeLimit *= 1000;
    config.idleCheckHeartbeat *= 1000;
    config.warnTimeLimit *= 1000;
    config.lockTimeLimit *= 1000;
    config.keepAliveInterval *= 1000;

    //--Validate config options
    if (config.multiWindowSupport) {
      if (!$.localStorage) {
        console.error('jitp: Multi-Window support requested but JQuery Storage API is unavailable.');
        return false;
      }
    }
    if ((config.warnEnabled && config.warnCallback === false) ||
      (config.lockEnabled && config.lockCallback === false)) {
      if (config.bootstrap) {
        if (typeof $.fn.modal === 'undefined') {
          console.error('jitp: Bootstrap library is unavailable');
          return false;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (typeof $.ui === 'undefined') {
          console.error('jitp: jQueryUI library is unavailable');
          return false;
        }
      }
    }
    if (config.lockEnabled && !config.multiWindowSupport) {
      console.error('jitp: Lock screen requested but multi-window support is not enabled.');
      return false;
    }
    if (config.lockEnabled && config.lockCallback === false) {
      if (typeof $.blockUI === 'undefined') {
        console.error('jitp: Lock screen requested but blockUI library is unavailable.');
        return false;
      }
      if (config.lockPassCallback === false) {
        console.error('jitp: Lock screen requested but lockPassCallback function is not set.');
        return false;
      }
    }
    /* --strip_iframe_begin-- */
    if (config.iframesSupport && !config.multiWindowSupport) {
      console.error('jitp: IFrame support requested but Multi-Window support disabled.');
      return false;
    }
    /* --strip_iframe_end-- */

    initDataStore();

    //--Check if we are already in lockdown
    if (config.lockEnabled && (config.lockLoadActive || loadData('lockStartTime', -1) > 0)) {
      initSubLock();
    } else {
      //--Initialize and start idle timer
      storeData('logoutTriggered', false);
      storeData('warningStartTime', -1);
      storeData('lockStartTime', -1);
      storeData('lastActivity', $.now());
      startIdleTimer();
      if (config.keepAliveInterval) {
        startKeepSessionAlive();
      }
    }

    if (config.keepAliveInterval) {
      startKeepSessionAlive();
    }
    /* --strip_iframe_begin-- */
    storeActivityEvents();
    dialogListener();
    /* --strip_iframe_end-- */
    activityDetector();
    checkForIframes();  /* --strip_iframe-- */

    return true;
  };

  /**
   * @name cleanUpLockScreen
   * @description Call this on your login screen to avert a lock screen bug
   */
  api.cleanUpLockScreen = function() {
    console.log('manual cleanUpLockScreen');
    initDataStore();
    if ($.localStorage) dataStore.set('lockStartTime', -99); //Because settings are not initialized bypass storeData
  };

  /**
   * @name logout
   * @description Call this to cause a logout of all windows
   */
  api.logout = function() {
    console.log('manual logout');
    handleLogout();
  };

  /**
   * @name displayWarning
   * @description Displays the warning dialog (meant to be used by your warnCallback function)
   */
  api.displayWarning = function() {
    console.log('displayWarning called');
    openWarningDialog();
  };

  /**
   * @name displayLockScreen
   * @description Displays the lock screen (meant to be used by your lockCallback function)
   */
  api.displayLockScreen = function() {
    console.log('displayLockScreen called');
    openLockScreen();
  };

  /**
   * @name initLockScreen
   * @description Initiates the full lock screen procedure (use this if you wish to lock immediately)
   */
  api.initLockScreen = function() {
    console.log('displayLockScreen called');
    stopIdleTimer();
    stopWarningTimer();
    initLock();
  };

  /**
   * @name setIdleTimeLimit
   * @param {number} seconds - New value for idleTimeLimit
   * @description Updates the idleTimeLimit config value & calls api.rollback
   */
  api.setIdleTimeLimit = function(seconds) {
    console.log('setIdleTimeLimit called');
    if (typeof seconds === 'number') {
      console.log('Updating idleTimeLimit from ' + config.idleTimeLimit / 1000 + ' to ' + seconds);
      config.idleTimeLimit = seconds * 1000;
      api.rollback();
    }
  };

  /**
   * @name setWarnTimeLimit
   * @param {number} seconds - New value for warnTimeLimit
   * @description Updates the warnTimeLimit config value & calls api.rollback
   */
  api.setWarnTimeLimit = function(seconds) {
    console.log('setWarnTimeLimit called');
    if (typeof seconds === 'number') {
      console.log('Updating warnTimeLimit from ' + config.warnTimeLimit / 1000 + ' to ' + seconds);
      config.warnTimeLimit = seconds * 1000;
      api.rollback();
    }
  };

  /**
   * @name setLockTimeLimit
   * @param {number} seconds - New value for lockTimeLimit
   * @description Updates the lockTimeLimit config value & calls api.rollback
   */
  api.setLockTimeLimit = function(seconds) {
    console.log('setLockTimeLimit called');
    if (typeof seconds === 'number') {
      console.log('Updating lockTimeLimit from ' + config.lockTimeLimit / 1000 + ' to ' + seconds);
      config.lockTimeLimit = seconds * 1000;
      api.rollback();
    }
  };

  /**
   * Clears warning/lock timers and reverts back to idleTimeout
   */
  api.rollback = function() {
    console.log('rollback called');
    rollbackLock();
    rollbackWarning();
  };
  /* --strip_iframe_begin-- */
  /**
   *  trigger a recheck for iframes
   *  use this after an iframe is inserted into the document
   */
  api.iframeRecheck = function() {
    console.log('iframeRecheck called');
    checkForIframes();
  };
  /* --strip_iframe_end-- */

  //#########################################################################
  //## Private Functions
  //#########################################################################

  function initDataStore() {
    console.log('start initDataStore');
    if (dataStore !== null) return;
    if ($.localStorage) dataStore = ($.initNamespaceStorage('jqueryIdleTimeoutPlus')).localStorage;
    else dataStore = {};
  }

  function storeData(key, value) {
    if (config.multiWindowSupport) {
      dataStore.set(key, value);
    } else {
      dataStore[key] = value;
    }
  }

  function loadData(key, defaultValue) {
    defaultValue = typeof defaultValue === 'undefined' ? null : defaultValue;
    if (config.multiWindowSupport) {
      if (dataStore.isSet(key)) return dataStore.get(key);
    } else {
      // eslint-disable-next-line no-lonely-if
      if (key in dataStore) return dataStore[key];
    }
    return defaultValue;
  }

  // -------------------------- Idle Monitoring --------------------------//
  var idleTimer;
  var mousePosition = [-1, -1];

  function initIdle() {
    console.log('start initIdle');
    storeData('warningStartTime', -1);
    storeData('lockStartTime', -1);
    startIdleTimer();
    if (config.idleCallback !== false) config.idleCallback(config);
  }

  function startIdleTimer() {
    console.log('start startIdleTimer');
    stopIdleTimer();
    storeData('lastActivity', $.now());
    idleTimer = setInterval(checkIdleTimeout, config.idleCheckHeartbeat);
  }

  function stopIdleTimer() {
    console.log('start stopIdleTimer');
    clearInterval(idleTimer);
  }

  function checkIdleTimeout() {
    // Note: lastActivity stops being updated once the warning/lock period starts
    var idleTimeoutTime = (loadData('lastActivity', $.now()) + config.idleTimeLimit);

    //Check to see if other windows/tabs have had a critical event
    if (loadData('logoutTriggered') === true) {
      console.log('alternate document logout detected');
      return handleLogoutTrigger();
    }
    //Check to see to see if lock initiated
    if (loadData('lockStartTime', -1) !== -1) {
      stopIdleTimer();
      return initSubLock();
    }

    if ($.now() >= idleTimeoutTime) {
      console.log('inactivity has exceeded the idleTimeLimit');
      stopIdleTimer();
      if (!config.warnEnabled) { // warning dialog is disabled
        console.log('warning dialog disabled');
        if (config.lockEnabled) return initLock();
        return handleRedirect(); // immediately redirect user when user is idle for idleTimeLimit
      }
      return initWarning();
    }
  }

  function activityDetector() {
    $(document).on(config.activityEvents, function(e) {
      if (e.type === 'mousemove') {
        // Solves mousemove even when mouse not moving issue on Chrome:
        // https://code.google.com/p/chromium/issues/detail?id=241476
        if (e.clientX === mousePosition[0] && e.clientY === mousePosition[1]) {
          return;
        }
        mousePosition[0] = e.clientX;
        mousePosition[1] = e.clientY;
      }
      if (loadData('warningStartTime', -1) === -1 && loadData('lockStartTime', -1) === -1) {
        console.log('activity detected');
        startIdleTimer();
      }
      // eslint-disable-next-line brace-style
      else console.log('warning/lockscreen active: activity ignored'); /* --strip_testing-- */
    });
  }

  // -------------------------- Session Keep Alive --------------------------//
  var keepAliveInterval;

  function startKeepSessionAlive() {
    console.log('start startKeepSessionAlive');
    stopKeepSessionAlive();
    keepAliveInterval = setInterval(function() {
      console.log('sending ping to keepAliveUrl');
      $.ajax({
        type: config.keepAliveAjaxType,
        url:  config.keepAliveUrl,
        data: config.keepAliveAjaxData
      });
    }, config.keepAliveInterval);
  }

  function stopKeepSessionAlive() {
    console.log('stop keep session alive');
    clearInterval(keepAliveInterval);
  }

  // -------------------------- Warning Functions --------------------------//

  var warningTimer;
  var warningDialogEnabled = true;
  var warningDialogActive = false;
  var warningDialogElm = null;
  var warningCountdownElm = null;
  var warningCountdownBarElm = null;

  function initWarning() {
    console.log('initWarning called');
    startWarningTimer();
    if (config.warnCallback !== false) warningDialogEnabled = config.warnCallback(config);
    openWarningDialog();
  }

  function rollbackWarning() {
    console.log('rollbackWarning called');
    stopWarningTimer();
    closeWarningDialog();
    storeData('warningStartTime', -1);
    initIdle();
  }

  function startWarningTimer() {
    console.log('startWarningTimer called');
    storeData('warningStartTime', $.now());
    warningTimer = setInterval(checkWarningTimeout, 500);
  }

  function stopWarningTimer() {
    console.log('stopWarningTimer called');
    clearInterval(warningTimer);
  }

  function checkWarningTimeout() {
    //Check to see if other windows/tabs have had a critical event
    if (loadData('logoutTriggered') === true) {
      console.log('alternate window logout detected');
      stopWarningTimer();
      return handleLogoutTrigger();
    }
    //Has the warning been cleared (possibly by another tab/window)
    if (loadData('warningStartTime', -1) === -1) {
      console.log('warningClear trigger');
      return rollbackWarning();
    }
    //Check if timeout exceeded
    var warningTimeout = (loadData('warningStartTime') + config.warnTimeLimit) - 1;
    if ($.now() >= warningTimeout) {
      stopWarningTimer();
      if (config.lockEnabled) {
        //warningStart is not set to -1 to avoid having other tabs/windows do a rollback
        closeWarningDialog();
        return initLock();
      }
      return handleRedirect();
    }
    //Update dialog
    updateWarningDialog();
  }

  function openWarningDialog() {
    console.log('openWarningDialog called');
    if (!warningDialogEnabled) return;
    initializeWarningDialog();
    updateWarningDialog();
    if (config.bootstrap) {
      warningDialogElm.modal('show');
      warningDialogElm.focus();
    } else {
      warningDialogElm.dialog('open');
    }
    warningDialogActive = true;
  }

  function closeWarningDialog() {
    console.log('closeWarningDialog called');
    warningDialogActive = false;
    if (warningDialogElm === null) return;
    if (config.bootstrap) {
      warningDialogElm.modal('hide'); //Despite modal being self-closing this is used if warning is cleared on another window
      // http://stackoverflow.com/questions/11519660/twitter-bootstrap-modal-backdrop-doesnt-disappear
      bodyElm.removeClass('modal-open');
      $('div.modal-backdrop').remove();
    } else {
      warningDialogElm.dialog('close');
    }
  }

  function updateWarningDialog() {
    if (warningDialogElm === null) return;
    if (warningCountdownElm === null && warningCountdownBarElm === null) return;
    var currTime = $.now();
    var totalSecsLeft = Math.floor(((loadData('warningStartTime', currTime) + config.warnTimeLimit) - currTime) / 1000);
    if (warningCountdownElm !== null) {
      warningCountdownElm.html(time2txt(totalSecsLeft));
    }
    if (warningCountdownBarElm !== null) {
      var percentLeft = Math.floor(totalSecsLeft / (config.warnTimeLimit / 1000) * 100);
      if (config.bootstrap) {
        warningCountdownBarElm.css('width', percentLeft + '%');
      } else {
        warningCountdownBarElm.progressbar('value', percentLeft);
      }
    }
  }

  function initializeWarningDialog() {
    console.log('initializeWarningDialog called');
    if (warningDialogElm !== null) return;
    var content = '';
    if (config.warnContentCallback === false) {
      if (config.bootstrap)content = getWarningContentBootstrap();
      else content = getWarningContentJqueryUI();
    } else {
      content = config.warnContentCallback(config);
    }
    if (config.bootstrap) createWarningBootstrap(content);
    else createWarningJqueryUI(content);
  }

  function createWarningBootstrap(content) {
    console.log('createWarningBootstrap called');
    bodyElm.append(content);
    if (config.warnLogoutButton !== null) {
      $('#jitp-warn-logout').on('click', function() {
        onWarningLogoutButton();
      });
    }
    $('#jitp-warn-alive').on('click', function() {
      onStayAliveButton();
    });

    warningDialogElm = $('#jitp-warn-display');
    if (config.warnCountdownMessage !== null || config.warnCountdownBar) {
      warningCountdownElm = warningDialogElm.find('.jitp-countdown-holder');
    }

    if (config.warnCountdownBar) {
      warningCountdownBarElm = $('#jitp-warn-bar');
    }
  }

  function createWarningJqueryUI(content) {
    console.log('createWarningJquery called');
    var theButtons = [];
    if (config.warnLogoutButton !== null) {
      theButtons.push({
        text:  config.warnLogoutButton,
        click: function() {
          onWarningLogoutButton();
        }
      });
    }
    theButtons.push({
      text:  config.warnStayAliveButton,
      click: function() {
        onStayAliveButton();
      }
    });

    $(content).dialog({
      buttons:       theButtons,
      closeOnEscape: false,
      modal:         true,
      title:         config.warnTitle,
      minWidth:      320,
      autoOpen:      false,
      open:          function() {
        //hide the dialog's title bar or the upper right corner "x" close button
        if (config.warnTitle === null) $(this).closest('.ui-dialog').find('.ui-dialog-titlebar').hide();
        else $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
        $(this).parent().find('button:nth-child(2)').focus(); //Focus StayAlive button
      }
    });

    warningDialogElm = $('#jitp-warn-display');
    if (config.warnCountdownMessage !== null) {
      warningCountdownElm = warningDialogElm.find('.jitp-countdown-holder');
    }

    if (config.warnCountdownBar) {
      warningCountdownBarElm = $('#jitp-warn-bar');
      warningCountdownBarElm.progressbar({
        value: 0,
        max:   100
      });
    }
  }

  function getWarningContentBootstrap() {
    console.log('getWarningContentBootstrap called');
    var title = config.warnTitle === null ? '' :
    '<div class="modal-header"><h4 class="modal-title">' + config.warnTitle + '</h4></div>';
    var countdownMsg = config.warnCountdownMessage === null ? '' :
      '<p>' + config.warnCountdownMessage.replace(/\{timer}/g, '<span class="jitp-countdown-holder"></span>') + '</p>';
    var logoutBtn = config.warnLogoutButton === null ? '' :
      '<button id="jitp-warn-logout" type="button" class="btn btn-default">' + config.warnLogoutButton + '</button>';
    var countdownBar = config.warnCountdownBar === null ? '' :
      '<div class="progress">' +
        '<div id="jitp-warn-bar" class="progress-bar progress-bar-striped active" role="progressbar" ' +
              'style="min-width: 15px; width: 100%;">' +
          '<span class="jitp-countdown-holder"></span>' +
        '</div>' +
      '</div>';
    return (
      '<div class="modal fade" id="jitp-warn-display" data-backdrop="static" data-keyboard="false" tabindex="-1">' +
        '<div class="modal-dialog">' +
          '<div class="modal-content">' +
             title +
            '<div class="modal-body">' +
              '<p>' + config.warnMessage + '</p>' +
               countdownMsg +
               countdownBar +
            '</div>' +
            '<div class="modal-footer">' +
               logoutBtn +
              '<button id="jitp-warn-alive" type="button" class="btn btn-primary">' + config.warnStayAliveButton +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function getWarningContentJqueryUI() {
    console.log('getWarningContentJquery called');
    var countdownMsg = config.warnCountdownMessage === null ? '' :
      '<p>' + config.warnCountdownMessage.replace(/\{timer}/g, '<span class="jitp-countdown-holder"></span>') + '</p>';
    var countdownBar = config.warnCountdownBar === null ? '' :
      '<div id="jitp-warn-bar"></div>';
    return (
      '<div id="jitp-warn-display">' +
        '<p>' + config.warnMessage + '</p>' +
         countdownMsg +
         countdownBar +
      '</div>'
    );
  }

  function onWarningLogoutButton() {
    console.log('onWarningLogoutButton called');
    stopWarningTimer();
    handleLogout();
  }

  function onStayAliveButton() {
    console.log('onStayAliveButton called');
    rollbackWarning();
  }

  // -------------------------- LockScreen Functions --------------------------//
  var lockTimer;
  var lockScreenEnabled = true;
  var lockScreenActive = false;
  var lockScreenElm = null;
  var lockScreenCountdownElm = null;

  function initLock() {
    console.log('initLock called');
    if (config.lockHaltKeepAlive) stopKeepSessionAlive();
    startLockTimer();
    if (config.lockCallback !== false) lockScreenEnabled = config.lockCallback(config);
    openLockScreen();
  }

  function initSubLock() {
    console.log('initSubLock called');
    if (config.lockHaltKeepAlive) stopKeepSessionAlive();
    else if (config.keepAliveInterval) startKeepSessionAlive();
    if (loadData('lockStartTime', -1) === -1) startLockTimer();  //Missing lockStartTime
    else lockTimer = setInterval(checkLockTimeout, 500);
    openLockScreen();
  }

  function rollbackLock() {
    console.log('rollbackLock called');
    stopLockTimer();
    closeLockScreen();
    $('#jitp-lock-pass').val(''); //Don't want the password to stay in the field
    if (config.keepAliveInterval) startKeepSessionAlive();
    storeData('lockStartTime', -1);
    initIdle();
  }

  function startLockTimer() {
    console.log('startLockTimer called');
    storeData('lockStartTime', $.now());
    lockTimer = setInterval(checkLockTimeout, 500);
  }

  function stopLockTimer() {
    console.log('stopLockTimer called');
    clearInterval(lockTimer);
  }

  function checkLockTimeout() {
    //Check to see if other windows/tabs have had a critical event
    if (loadData('logoutTriggered') === true) {
      console.log('alternate document logout detected');
      stopLockTimer();
      return handleLogoutTrigger();
    }
    //Has the lock been cleared (possibly by another tab/window)
    if (loadData('lockStartTime', -1) === -1) {
      console.log('lockClear triggered');
      return rollbackLock();
    }
    //Check if timeout exceeded
    var lockTimeout = (loadData('lockStartTime') + config.lockTimeLimit) - 1;
    if ($.now() >= lockTimeout) {
      stopLockTimer();
      //Trying to prevent a race condition with regards to lockTimeLimit being set to -99 (TRY being the operative word)
      if (loadData('logoutTriggered') === true) return handleLogoutTrigger();
      return handleRedirect();
    }
    //Update dialog if open
    updateLockScreen();
  }

  function openLockScreen() {
    console.log('openLockScreen called');
    if (!lockScreenEnabled) return;
    initializeLockScreen();
    updateLockScreen();
    var blockConfig = {
      message: $('#jitp-lock-display')
    };
    blockConfig = $.extend(blockConfig, config.lockBlockUiConfig);
    $.blockUI(blockConfig);

    lockScreenActive = true;
  }

  function closeLockScreen() {
    console.log('closeLockScreen called');
    $.unblockUI();
    lockScreenActive = false;
  }

  function updateLockScreen() {
    if (lockScreenCountdownElm !== null) {
      var currTime = $.now();
      var totalSecsLeft = Math.floor(((loadData('lockStartTime', currTime) + config.lockTimeLimit) - currTime) / 1000);
      lockScreenCountdownElm.html(time2txt(totalSecsLeft));
    }
  }

  function initializeLockScreen() {
    if (lockScreenElm !== null) return;
    var content = '';
    if (config.lockContentCallback === false) {
      if (config.bootstrap) content = getLockContentBootstrap();
      else content = getLockContentJqueryUI();
    } else {
      content = config.lockContentCallback(config);
    }
    bodyElm.append(content);
    lockScreenElm = $('#jitp-lock-display');

    if (config.lockCountdownMessage !== false) {
      lockScreenCountdownElm = lockScreenElm.find('.jitp-countdown-holder');
    }

    $('#jitp-lock-logout').on('click', function() {
      onLockLogoutButton();
    });
    $('#jitp-lock-unlock').on('click', function() {
      onUnlockButton();
    });

    //noinspection JSJQueryEfficiency
    if ($('#jitp-lock-form').length) {
      $('#jitp-lock-form').submit(function() {
        onUnlockButton();
        return false;
      });
    }

    updateLockScreen();
  }

  function getLockContentBootstrap() {
    console.log('getLockContentBootstrap called');
    var title = config.lockTitle === null ? '' :
      '<div class="panel-heading"><h2 class="panel-title">' + config.lockTitle + '</h2></div>';
    var logoutMsg = config.lockLogoutButton.replace(/\{username}/g, config.lockUsername);
    var countdownMsg = config.lockCountdownMessage === null ? '' :
      '<div class="panel-footer">' +
        config.lockCountdownMessage.replace(/\{timer}/g, '<span class="jitp-countdown-holder"></span>') +
      '</div>';

    return (
      '<div id="jitp-lock-display" class="jitp-lock-back" style="display: none;">' +
        '<div class="panel panel-default jitp-lock-panel">' +
           title +
          '<div class="panel-body">' +
            '<h4>' + config.lockUsername + '</h4>' +
            '<p>' + config.lockMessage + '</p>' +
            '<div class="input-group">' +
              '<input id="jitp-lock-pass" type="password" class="form-control" placeholder="Password..." autocomplete="off"/>' +
              '<span class="input-group-btn">' +
                '<button id="jitp-lock-unlock" class="btn btn-primary" type="button">' + config.lockUnlockButton +
                '</button>' +
              '</span>' +
            '</div>' +
            '<a id="jitp-lock-logout" href="javascript:;">' + logoutMsg + '</a>' +
          '</div>' +
           countdownMsg +
        '</div>' +
      '</div>'
    );
  }

  function getLockContentJqueryUI() {
    var title = config.lockTitle === null ? '' :
      '<header>' + config.lockTitle + '</header>';
    var logoutMsg = config.lockLogoutButton.replace(/\{username}/g, config.lockUsername);
    var countdownMsg = config.lockCountdownMessage === null ? '' :
      '<footer>' + config.lockCountdownMessage.replace(/\{timer}/g, '<span class="jitp-countdown-holder"></span>') +
      '</footer>';

    return (
      '<div id="jitp-lock-display" class="jitp-lock-back" style="display: none;">' +
        '<div class="jitp-lock-panel jitp-lock-jqpanel">' +
           title +
          '<div class="jitp-lock-jqpanel-body">' +
            '<h2>' + config.lockUsername + '</h2>' +
            '<p>' + config.lockMessage + '</p>' +
            '<div>' +
              '<input id="jitp-lock-pass" type="text" class="form-control" placeholder="Password..." autocomplete="off"/>' +
            '</div>' +
            '<button id="jitp-lock-unlock" type="button">' + config.lockUnlockButton + '</button>' +
            '<a id="jitp-lock-logout" href="javascript:;">' + logoutMsg + '</a>' +
          '</div>' +
           countdownMsg +
        '</div>' +
      '</div>'
    );
  }

  function onLockLogoutButton() {
    stopLockTimer();
    handleLogout();
  }

  function onUnlockButton() {
    console.log('onUnlockButton called');
    config.lockPassCallback($('#jitp-lock-pass').val());
  }

  // -------------------------- Logout & Redirect --------------------------//

  function stopIt() {
    stopKeepSessionAlive();
    stopIdleTimer();
    stopWarningTimer();
    stopLockTimer();
  }

  function handleLogout() {
    console.log('handleLogout called');
    stopIt();
    storeData('logoutTriggered', true);
    if (typeof config.logoutCallback === 'function') {
      if (!config.logoutCallback(config)) return; //Redirect only done on true return
    }
    window.location.replace(config.logoutUrl);
  }

  function handleLogoutTrigger() {
    console.log('handleLogoutTrigger called');
    stopIt();
    if (typeof config.logoutAutoCallback === 'function') {
      if (!config.logoutAutoCallback(config)) return;
    }
    window.location.replace(config.logoutAutoUrl);
  }

  function handleRedirect() {
    console.log('handleRedirect called');
    stopIt();
    if (!config.multiWindowSupport) return handleRedirectAction();
    //Another attempt to avoid race conditions
    setTimeout(handleRedirectAction, getRandomInt(100, 500));
  }

  function handleRedirectAction() {
    //Check logoutTriggered flag
    if (loadData('logoutTriggered', false)) return handleLogoutTrigger();
    storeData('logoutTriggered', true);
    if (typeof config.redirectCallback === 'function') {
      if (!config.redirectCallback(config)) return;
    }
    window.location.replace(config.redirectUrl);
  }

  /* --strip_iframe_begin-- */
  // -------------------------- IFrames Code --------------------------//

  // WORK AROUND - save config.activityEvents value to interWindow storage for use in function: attachEventIframe
  function storeActivityEvents() {
    console.log('store configuration activityEvents ' + config.activityEvents + '.');
    storeData('activityEvents', config.activityEvents);
  }

  // Recheck for iframes when a dialog is opened
  function dialogListener() {
    $(document).on('dialogopen shown.bs.modal', function() {
      console.log('start dialog/modal open');
      if (!warningDialogActive && !lockScreenActive) {
        console.log('a dialog other than warning/lockscreen dialog opened. Recheck for iframes.');
        checkForIframes();
      }
      // eslint-disable-next-line brace-style
      else console.log('warning dialog opened. No recheck for iframes.');  /* --strip_testing-- */
    });
  }

  function checkForIframes() {
    console.log('start checkForIframes');
    // document must be in readyState 'complete' before checking for iframes - $(document).ready() is not good enough!
    var docReadyInterval;

    var docReadyCheck = function() {
      if (document.readyState === "complete") {
        clearInterval(docReadyInterval);
        includeIframes();
      }
    };
    //Use of anon function prevents clearing of docReadyInterval
    docReadyInterval = setInterval(docReadyCheck, 1000); // check once a second to see if document is complete
  }

  function includeIframes(elementContents) {
    console.log('start includeIframes');

    if (!elementContents) {
      console.log('elementContents not defined. Define as $(document)');
      elementContents = $(document);
    }

    var iframeCount = 0;

    elementContents.find('iframe,frame').each(function() {
      console.log('start of find iframes');

      if ($(this).hasClass('jitp-inspected') === false) {
        console.log('first time inpection of iframe - no jitp-inspected class');

        try {
          includeIframes($(this).contents()); // recursive call to include nested iframes

          // attach event code for most modern browsers
          $(this).on('load', attachEventIframe($(this))); // Browser NOT IE < 11

          // attach event code for older Internet Explorer browsers
          console.log('iframeCount: ' + iframeCount + '.');
          var domElement = $(this)[iframeCount]; // convert jquery object to dom element

          if (domElement.attachEvent) { // Older IE Browser < 11
            console.log('attach event to iframe. Browser IE < 11');
            domElement.attachEvent('onload', attachEventIframe($(this)));
          }
          iframeCount++;
        } catch (err) {
          /* Unfortunately, if the 'includeIframes' function is manually triggered multiple times in quick succession,
           * this 'try/catch' block may not have time to complete,
           * and so it might error out,
           * and iframes that are NOT cross-site may be set to "cross-site"
           * and activity may or may not bubble to parent page.
           * Fortunately, this is a rare occurrence!
           */
          console.log('found cross-site iframe - add classes "jitp-inspected" & "cross-site"');
          $(this).addClass('jitp-inspected cross-site');
        }
      } else {
        console.log('iframe already has class jitp-inspected');
      }
    });
  }

  function attachEventIframe(iframeItem) {
    console.log('start attachEventIframe');

    // retrieve stored value as config will not include private config
    // when this function is called by public function, iframeRecheck
    console.log('config.activityEvents: ' + config.activityEvents + '.');
    var iframeContents = iframeItem.contents();
    var storeActivityEvents = loadData('activityEvents', '');

    try {
      iframeContents.on(storeActivityEvents, function(event) {
        console.log('bubbling iframe activity event to body of page event: ' + event.type + '.');
        $('body').trigger(event);
      });
      iframeItem.addClass('jitp-inspected'); // add "jitp-inspected" class, so we don't need to check this iframe again
    } catch (err) {
      console.log('problem with attachment of activity events to this iframe');
    }
  }
  /* --strip_iframe_end-- */

  // -------------------------- Utility Functions --------------------------//

  function time2txt(secs) {
    var minLeft = Math.floor(secs / 60);
    if (minLeft <= 15) {
      var secsLeft = secs % 60;
      var timeTxt = minLeft > 0 ? minLeft + 'm ' : '';
      timeTxt += secsLeft + 's';
      return timeTxt;
    }
    if (minLeft <= 75) {
      if (minLeft <= 22) return 'about 15 mins';
      if (minLeft <= 37) return 'about 30 mins';
      if (minLeft <= 52) return 'about 25 mins';
      return 'about 1 hour';
    }
    var hoursLeft = Math.floor(minLeft / 60);
    minLeft %= 60;
    if (minLeft <= 15) return 'about ' + hoursLeft + ' hours';
    if (minLeft > 52) return 'about ' + (hoursLeft + 1) + ' hours';
    return 'about ' + hoursLeft + '&frac12; hours';
  }

  // Returns a random integer between min (included) and max (excluded)
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  return api;
}));

