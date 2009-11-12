/*jsl:import ../core/startup.js*/

/*jsl:declare Event*/

//  Trick picked up from Prototype to get around IE8's fixed Element & Event
(function() {
  var event = this.Event;
  this.Event = {};
  Object.extend(this.Event, event || {});
}).call(window);


/*  Event stuff for all browsers
 */
Object.extend(Event, {

	KEY_BACKSPACE: 8,
	KEY_TAB: 9,
	KEY_CLEAR: 12,
    KEY_RETURN: 13,
	KEY_ENTER: 13,
	KEY_SHIFT: 16,
	KEY_CTRL: 17,
	KEY_ALT: 18,
	KEY_PAUSE: 19,
	KEY_CAPS_LOCK: 20,
	KEY_ESCAPE: 27,
	KEY_SPACE: 32,
	KEY_PAGE_UP: 33,
	KEY_PAGE_DOWN: 34,
	KEY_END: 35,
	KEY_HOME: 36,
	KEY_LEFT_ARROW: 37,
	KEY_UP_ARROW: 38,
	KEY_RIGHT_ARROW: 39,
	KEY_DOWN_ARROW: 40,
	KEY_INSERT: 45,
	KEY_DELETE: 46,
	KEY_HELP: 47,
	KEY_LEFT_WINDOW: 91,
	KEY_RIGHT_WINDOW: 92,
	KEY_SELECT: 93,
	KEY_NUMPAD_0: 96,
	KEY_NUMPAD_1: 97,
	KEY_NUMPAD_2: 98,
	KEY_NUMPAD_3: 99,
	KEY_NUMPAD_4: 100,
	KEY_NUMPAD_5: 101,
	KEY_NUMPAD_6: 102,
	KEY_NUMPAD_7: 103,
	KEY_NUMPAD_8: 104,
	KEY_NUMPAD_9: 105,
	KEY_NUMPAD_MULTIPLY: 106,
	KEY_NUMPAD_PLUS: 107,
	KEY_NUMPAD_ENTER: 108,
	KEY_NUMPAD_MINUS: 109,
	KEY_NUMPAD_PERIOD: 110,
	KEY_NUMPAD_DIVIDE: 111,
	KEY_F1: 112,
	KEY_F2: 113,
	KEY_F3: 114,
	KEY_F4: 115,
	KEY_F5: 116,
	KEY_F6: 117,
	KEY_F7: 118,
	KEY_F8: 119,
	KEY_F9: 120,
	KEY_F10: 121,
	KEY_F11: 122,
	KEY_F12: 123,
	KEY_F13: 124,
	KEY_F14: 125,
	KEY_F15: 126,
	KEY_NUM_LOCK: 144,
	KEY_SCROLL_LOCK: 145,

    isNumpadNumKey: function(keyCode)
    {
        return keyCode >= 96 && keyCode <= 111;
    },

    isAlphaNumKey: function(keyCode)
    {
        if (!this._reverseKeys)
            this._reverseKeys= (function() {
                    var keys= {};
                    var originalKeys = Event.KEYS;
                    
                    for (var key in originalKeys)
                        keys[originalKeys[key]] = key;
                    return keys;
                })();
        return this.isNumpadNumKey(keyCode) || !this._reverseKeys[keyCode];
    },
    
    _domHasFinishedLoading: function()
    {
        if (arguments.callee.done)
            return;
        arguments.callee.done= true;

        if (this._domLoadedTimer)
            window.clearInterval(this._domLoadedTimer);
        Event.stopObserving(window, 'load', Event._domHasFinishedLoading);
        
        var callbacks= Event._readyCallbacks;
        var len= callbacks.length;
        var i;
    
        for (i=0; i<len; ++i)
            callbacks[i]();

        Event._readyCallbacks = null;
    },
    
    observe: function(node, eventName, handlerMethod)
    {
        if ('on'==eventName.slice(0,2))
            eventName= eventName.slice(2);
        node.addEventListener(eventName, handlerMethod, false);
        if (!handlerMethod.displayName)
            handlerMethod.displayName= eventName + " event observer";
        return handlerMethod;
    },

    stopObserving: function(node, eventName, handlerMethod)
    {
        if (!node || !eventName || !handlerMethod)
            return null;
        if ('on'==eventName.slice(0,2))
            eventName= eventName.slice(2);
        node.removeEventListener(eventName, handlerMethod, false);
        return handlerMethod;
    },

	stop: function(event)
	{
		event.preventDefault();
		event.stopPropagation();
	},
    	
	preventDefault: function(event)
	{
	    event.preventDefault();
	},
	
	onDomReady: function(f)
    {
        //  If the DOM has already loaded, fire off the callback as soon as
        //  possible after returning from this method.
        if (Event._domHasFinishedLoading.done)
        {
            window.setTimeout(f, 0);
            return;
        }
    
        if (!Event._readyCallbacks)
        {
            document.addEventListener("DOMContentLoaded",
                                      Event._domHasFinishedLoading,
                                      false);
            
            function checkReadyState()
            {
                if ((/loaded|complete/).test(document.readyState))
                    Event._domHasFinishedLoading();
            }
        
            if (coherent.Browser.Safari)
                Event._domLoadedTimer = window.setInterval(checkReadyState, 10);
        
            Event.observe(window, 'load', Event._domHasFinishedLoading);
            Event._readyCallbacks= [];
        }
    
        Event._readyCallbacks.push(f);
    }


});

Object.markMethods(Event, "Event");