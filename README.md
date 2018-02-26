# jquery-idleTimeout-plus

User idle detector with session keep-alive, warning dialog, lock screen, url redirection and support for multiple windows and tabs.
### Features
* Highly configurable
* Multiple window/tab support
* Callback support for all events (idle,warning,lock screen, logout and redirect)
* Callback support for dialog/screen creation
* Support for both jQueryUI and Bootstrap GUI frameworks
* Modular code supports AMD/CommonJS
* Attempts to mitigate race conditions with regards to auto logout (what I wouldn't give for cross-window JavaScript semaphores)

## Getting Started
### Installation
**NPM**

`npm install @garylocke/jquery-idleTimeout-plus`

**Bower**

`bower install garylocke.jquery-idleTimeout-plus`

Adding to your website
```
<head>
    <!-- include jQuery & other necessary dependencies -->
    ...
    <link href="/css/jquery-idleTimeout-plus.css" rel="stylesheet" type="text/css" />
    <script src="/scripts/jquery-idleTimeout-plus.js" type="text/javascript"></script>
    ...
    
</head>
```

### Dependencies

* jQuery +2.2
* jQuery UI +1.11 or Bootstrap +3.3
* [jQuery Storage API](https://github.com/julien-maurel/jQuery-Storage-API) (for iFrame or Multi-window support)
* [jQuery BlockUI](http://jquery.malsup.com/block/) (for lock screen support)

### Basic Usage
```
jQuery(document).ready(function() {
    IdleTimeoutPlus.start({
        idleTimeLimit: 1400
    });
});
```

## Options

### Basic Options

| Settings      |  Type  | Default                          | Descritption                  |
|:--------------|:------:|:---------------------------------|:------------------------------|
| idleTimeLimit |  int   | 1200 (20min)                     | idle timeout in seconds       |
| bootstrap     |  bool  | false                            | enable bootstrap              |
| warnTimeLimit |  int   | 180 (3min)                       | warning timeout in seconds    |
| warnMessage   | string | Your session is about to expire! | warning dialog message        |
| redirectUrl   | string | /timed-out                       | Redirect URL for user timeout |
| multiWindowSupport     |  bool  | false                            | Support multiple tabs/windows (jquery&#8209;storage&#8209;api&nbsp;required)              |


### Detailed Options

| Setting Name | &nbsp; |
|:----|:----|
|Type|Default Value|

---
#### General Settings

* Note: All callback functions receive the IdleTimeoutPlus config object as parameter.

| idleTimeLimit | &nbsp; |
|:----|:----|
|int (secs)|1200 (20 min)|
The idle time limit in seconds before an action (warning dialog/redirect/etc) is initiated.

| idleCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called when the idle timer is started.  Use this to close your fully custom warning/lock screens if needed.

| idleCheckHeartbeat | &nbsp; |
|:----|:----|
|int (secs)|2|
Controls how often the module checks for user activity

| activityEvents | &nbsp; |
|:----|:----|
|string|click keypress scroll wheel mousewheel mousemove touchmove|
Controls which [activity events](https://developer.mozilla.org/en-US/docs/Web/Reference/Events) to detect

| bootstrap | &nbsp; |
|:----|:----|
|bool|false|
Setting to true enables Bootstrap 3 modals and themes

---
#### Warning Settings

| warnEnabled | &nbsp; |
|:----|:----|
|bool|true|
If set to false the warning period is skipped and the user is either redirected to the timeout URL or shown the lock screen.

| warnTimeLimit | &nbsp; |
|:----|:----|
|int (secs)|180 (3 min)|
The time limit for the warning period.

| warnCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called when the warning period starts. _Note: the internal warning dialog will NOT be shown unless this function returns TRUE._

| warnContentCallback | &nbsp; |
|:----|:----|
|bool/function|false|
This function should return a string that contains the desired structure and content of the warning dialog. See the [Custom Content](#custom) section for more details.

| warnTitle | &nbsp; |
|:----|:----|
|string|Session Timeout|
The title for the warning dialog.  _Setting this to null will remove the title bar._

| warnMessage | &nbsp; |
|:----|:----|
|string|Your session is about to expire!|
The text for the warning dialog.

| warnStayAliveButton | &nbsp; |
|:----|:----|
|string|Stay Connected|
The text for the warning dialog _Stay Alive_ button.

| warnLogoutButton | &nbsp; |
|:----|:----|
|string|Logout|
The text for the warning dialog _Logout_ button.

| warnCountdownMessage | &nbsp; |
|:----|:----|
|string|Time remaining: {timer}|
Text for the warning countdown message. _Setting this to null will remove the countdown._ See the [Custom Content](#custom) section for more details.

| warnCountdownBar | &nbsp; |
|:----|:----|
|bool|false|
Enable/disable the warning countdown bar.

---
#### Timeout URL Settings

| redirectUrl | &nbsp; |
|:----|:----|
|string|/timed-out|
URL the user is redirected to after exceeding the timeout.

| logoutUrl | &nbsp; |
|:----|:----|
|string|/logout|
URL the user is redirected to when clicking the "Logout" button.

| logoutAutoUrl | &nbsp; |
|:----|:----|
|string|null|
URL the user is redirected to when a logout occurs in another window. If null the `logoutUrl` value is used.  
The purpose of this setting is to help avoid server-side logout race conditions.

#### Timeout Callback Settings

_Note: If a callback function is defined auto url redirection will only occur if the callback function returns true._

| redirectCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called after the user exceeds the timeout.

| logoutCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called when the user clicks the "Logout" button

| logoutAutoCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called when a logout occurs in another window.

---
#### Session Keep-Alive Settings

| keepAliveInterval | &nbsp; |
|:----|:----|
|int (secs)|600 (10 min)|
Controls how often the `keepAliveUrl` is pinged.

| keepAliveUrl | &nbsp; |
|:----|:----|
|string|window.location.href|
URL the keep alive ping is sent to.

| keepAliveAjaxType | &nbsp; |
|:----|:----|
|string|GET|
Sets the desired AJAX query type: `GET` or `POST`.

| keepAliveAjaxData | &nbsp; |
|:----|:----|
|string|(empty)|
The data to send with the keep alive ping request.

---
#### Lock Screen Settings

| lockEnabled | &nbsp; |
|:----|:----|
|bool|false|
If set to true to enable the lock screen functionality. See the [Special Situations](#special) section for more details.

| lockTimeLimit | &nbsp; |
|:----|:----|
|int (secs)|7200 (2 hrs)|
The time limit for the lock screen period.

| lockHaltKeepAlive | &nbsp; |
|:----|:----|
|bool|true|
Controls whether the keep alive pings should be stopped during the lock screen period.

| lockCallback | &nbsp; |
|:----|:----|
|bool/function|false|
Called when the lock period starts. _Note: the internal lock screen will NOT be shown 
unless this function returns TRUE._

| lockPassCallback | &nbsp; |
|:----|:----|
|bool/function|false|
This function is REQUIRED if any of the internal lock screen functionality is being used. It will receive to parameters:

* The submitted user password
* The config object

The return value of this function is ignored because it is assumed that AJAX will be used to authenticate the password. On a correct password, 
this function must call IdleTimeoutPlus.rollback() to disable the lock screen.  See the Examples page for more information.

| lockTitle | &nbsp; |
|:----|:----|
|string|null|
The title for the lock screen.  _Setting this to null will remove the title bar._

| lockUsername | &nbsp; |
|:----|:----|
|string|System User|
To improve the appearance of the lock screen you should correctly set this to the correct current username.

| lockMessage | &nbsp; |
|:----|:----|
|string|Enter your password to unlock the screen|
The text for the lock screen.

| lockUnlockButton | &nbsp; |
|:----|:----|
|string|UnLock|
The text for the lock screen _UnLock_ button.

| lockLogoutButton | &nbsp; |
|:----|:----|
|string|Not {username} ?|
The text for the lock screen _Logout_ button.  This is actually an anchor text link instead of a button. See the [Custom Content](#custom) section for more details.

| lockCountdownMessage | &nbsp; |
|:----|:----|
|string|Auto-logout in: {timer}|
Text for the lock screen countdown message. _Setting this to null will remove the countdown._ See the [Custom Content](#custom) section for more details.

| lockBlockUiConfig | &nbsp; |
|:----|:----|
|json object|_empty_|
Allows you to customize the BlockUI settings if necessary. See the [Custom Content](#custom) section for more details.

| lockLoadActive | &nbsp; |
|:----|:----|
|bool|false|
If set to true the lock screen is automatically started. See the [Special Situations](#special) section for more details.

---
#### Lock Screen Settings

| iframesSupport | &nbsp; |
|:----|:----|
|bool|false|
Enables iFrame support. See the [Special Situations](#special) section for more details.

| multiWindowSupport | &nbsp; |
|:----|:----|
|bool|false|
Enables multi-window support. Requires jQuery Storage API to be active. See the [Special Situations](#special) section for more details.

## <a name="custom"></a>Custom Content

### Countdown Messages & Lock screen Logout text
The options `{timer}` and `{username}` are placeholders that are filled with the appropriate content at runtime.
`{timer}` is replaced with a timer showing the remaining minutes and seconds (15m 24s) and `{username}` is replaced with the value
of `config.lockUsername`.
**Examples**
```
warnCountdownMessage: 'Redirecting in {timer}'
lockCountdownMessage: '{timer} remaining until logout'
lockLogoutButton: 'Hey! I'm not {username}! Log me out NOW!'
```
---

### Warning Content
When providing custom content for the warning dialog you must the following classes and element ids to ensure proper function:

| Element Id or Class           | Element Type | Description                                                              |
|:------------------------------|:-------------|:-------------------------------------------------------------------------|
| id="jitp-warn-display"        | div          | Primary parent for the dialog                                            |
| class="jitp-countdown-holder" | span         | Holds the countdown timer for both the text message and the progress bar |
| id="jitp-warn-bar"            | div          | Countdown progress bar                                                   |
| id="jitp-warn-logout"         | button       | Logout button                                                            |
| id="jitp-warn-alive"          | button       | Stay Alive button                                                        |

#### Bootstrap
```
<div class="modal fade" id="jitp-warn-display" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header"><h4 class="modal-title">Session Timeout</h4></div>
            <div class="modal-body">
                <p>Your session is about to expire!</p>
                <p>Time remaining: <span class="jitp-countdown-holder"></span></p>
                <div class="progress">
                    <div id="jitp-warn-bar" class="progress-bar progress-bar-striped active" role="progressbar" style="min-width: 15px; width: 100%;">
                        <span class="jitp-countdown-holder"></span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="jitp-warn-logout" type="button" class="btn btn-default">Logout</button>
                <button id="jitp-warn-alive" type="button" class="btn btn-primary">Stay Connected</button>
            </div>
        </div>
    </div>
</div>
```

#### jQuery UI
* Do not provide the title inside the warning content.  Instead be sure to set warnTitle correctly.
* jQuery UI does not support progress bar labels inside of dialogs so do not include a `progress-label` element.
* Unlike Bootstrap many of the elements (buttons/title) are set via the jQuery dialog creation command so the content HTML is considerably simpler.

```
<div id="jitp-warn-display">
    <p>Your session is about to expire!</p>
    <p>Time remaining: <span class="jitp-countdown-holder"></span></p>
    <div id="jitp-warn-bar"></div>
</div>
```

---

### Lock Screen Content
When providing custom content for the lock screen you must use the following classes and element ids to ensure proper function:

| Element Id or Class           | Element Type   | Description                                    |
|:------------------------------|:---------------|:-----------------------------------------------|
| id="jitp-lock-display"        | div            | Primary parent for the lock screen             |
| id="jitp-lock-form"           | form           | Form element (not required)                    |
| class="jitp-countdown-holder" | span           | Holds the countdown timer for the text message |
| id="jitp-lock-bar"            | div            | Countdown progress bar                         |
| id="jitp-lock-pass"           | input-password | User password field                            |
| id="jitp-lock-unlock"         | button         | UnLock button                                  |
| id="jitp-lock-logout"         | button/anchor  | Logout button                                  |

Additionally the display property for the primary parent element (`jitp-lock-display`) should be set to none: `style="display: none;"`.

#### Bootstrap
```
<div id="jitp-lock-display" class="jitp-lock-back" style="display: none;">
    <div class="panel panel-default jitp-lock-panel">
        <div class="panel-heading"><h2 class="panel-title">Screen Locked</h2></div>
        <div class="panel-body">
            <h4>John Doe</h4>
            <p>Enter your password to unlock the screen</p>
            <div class="input-group">
                <input id="jitp-lock-pass" type="password" class="form-control" placeholder="Password..."/>
                <span class="input-group-btn">
                    <button id="jitp-lock-unlock" class="btn btn-primary" type="button">UnLock</button>
                </span>
            </div>
            <a id="jitp-lock-logout" href="javascript:;">Not John Doe ?</a>
        </div>
        <div class="panel-footer">Auto-logout in: <span class="jitp-countdown-holder"></span></div>
    </div>
</div>
```

#### jQuery UI
```
<div id="jitp-lock-display" class="jitp-lock-back" style="display: none;">
    <div class="jitp-lock-panel jitp-lock-jqpanel">
        <header>Screen Locked</header>
        <div class="jitp-lock-jqpanel-body">
            <h2>John Doe</h2>
            <p>Enter your password to unlock the screen</p>
            <div>
                <input id="jitp-lock-pass" type="text" class="form-control" placeholder="Password..."/>
            </div>
            <button id="jitp-lock-unlock" type="button">UnLock</button>
            <a id="jitp-lock-logout" href="javascript:;">Not John Doe ?</a>
        </div>
        <footer>Auto-logout in: <span class="jitp-countdown-holder"></span></footer>
    </div>
</div>
```

---

### BlockUI Customization
You may override the default BlockUI options by setting the `lockBlockUiConfig` config element. For mor information refer to the jquery BlockUI [documentation](http://malsup.com/jquery/block/#options).
```
IdleTimeoutPlus.start({
    lockBlockUiConifg: {
        overlayCSS: {
            backgroundColor: 'HotPink',
        }
    }
});
```

## <a name="special"></a>Special Situations

### Multiple Window/Tab support
With `multiWindowSupport` set to true IdleTimeoutPlus will sync your timeout and logout events across all your client's browser windows & tabs that meet the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).
Multi-window/tab support is dependent upon [jQuery Storage API](https://github.com/julien-maurel/jQuery-Storage-API) as local storage is used to sync cross window events.  If jQuery Storage API is not found an error will be written to the console and the module will not initialize.

* When multiple window support is enabled if the user opens a new window it is considered an activity event and the idle timer will be reset and any warning dialogs will be cleared.
* Be sure to call `IdleTimeoutPlus.logout()` from your application's logout link/button instead of manually redirecting to your logout page.  If this is not done other windows/tabs will not be automatically logged out.
* If a lock screen is present, **opening a new window will NOT clear the lock screen**.  Instead, the new window will automatically be locked. For more details refer to the **Lock screen** section further down.

##### Initialization
No special consideration for configuring/starting the plugin is needed when using the `multiWindowSupport` option.
```
jQuery(document).ready(function() {
    IdleTimeoutPlus.start({
        multiWindowSupport: true
    });
});
```

### iFrame support
Like multiple windows, iframe support requires that all your iframes meet the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) and that the [jQuery Storage API](https://github.com/julien-maurel/jQuery-Storage-API) plugin is loaded.
Additionally, you will need to use the iframes distribution file:
```
<head>
    <!-- include jQuery & other necessary dependencies -->
    ...
    <link href="/css/jquery-idleTimeout-plus.css" rel="stylesheet" type="text/css" />
    <script src="/scripts/jquery-idleTimeout-plus-iframes.js" type="text/javascript"></script>
    ...
    
</head>
```
### Lock screen support
Enabling lock screen support provides a very nice feature for your users but also introduces some security concerns.  Primarily, it is important to realize that anyone familiar with Firebug or Chrome's developer's tools can easily bypass the lock screen.
Therefore, **Do NOT rely upon this feature to provide hardened security.**  That being said using a lock screen offers some flexibility between having a user loosing all their form progress after 15min of inactivity and the alternative of keeping the screen unsecured for two hours.

##### Initialization
To use the lock screen you must 1) Enable the lock screen, 2) Enable multi-window support, 3) Set the lockPassCallback function (if using the internal lock screen feature) 
```
jQuery(document).ready(function() {
    IdleTimeoutPlus.start({
        multiWindowSupport: true,
        lockEnabled: true,
        lockPassCallback: myPasswordVerificationFunction,
    });
});
```
On your login screen you will **need to call** the `cleanUpLockScreen()` function to prevent the user from accidentally receiving a lock screen the moment they login (and subsequently being immediately logged out).
```
jQuery(document).ready(function() {
    IdleTimeoutPlus.cleanUpLockScreen();
});
```

## About

### Bugs or feature requests
Found a problem or would like a feature submit it via [GitHub](https://github.com/garylocke/jquery-idleTimeout-plus/issues)
### License
jquery-idleTimeout plus is licensed under the [GNU General Public License Version 3](https://www.gnu.org/licenses/gpl-3.0-standalone.html)

### Acknowledgements

Forked from [LinearSoft's jquery-idleTimeout-plus](https://github.com/LinearSoft/jquery-idleTimeout-plus) v0.9.5, which was based on [Jill Elaine's jquery-idleTimeout](https://github.com/josebalius/jquery-idleTimeout) and [Orangehill's bootstrap-session-timeout](https://github.com/orangehill/bootstrap-session-timeout).