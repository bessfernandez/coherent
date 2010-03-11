/*jsl:import event.js*/

//  IE does things different, of course.
if (coherent.Browser.IE)
{
    Object.extend(Event, {
    
        observe: function(node, eventName, handlerMethod)
        {
            if ('on'!=eventName.slice(0,2))
                eventName= 'on'+eventName;
            node.attachEvent(eventName, handlerMethod);
            return handlerMethod;
        },
    
        stopObserving: function(node, eventName, handlerMethod)
        {
            if (!node || !eventName || !handlerMethod)
                return;
                
            if ('on'!=eventName.slice(0,2))
                eventName= 'on'+eventName;
            node.detachEvent(eventName, handlerMethod);
        },

    	stop: function(event)
    	{
    		event= event||window.event;
    		event.returnValue = false;
    		event.cancelBubble = true;
    	},

    	preventDefault: function(event)
    	{
    	    event.returnValue= false;
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
                document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
                /** @inner */
                var script= document.getElementById("__ie_onload");
                script.onreadystatechange = function()
                {
                    if ("complete"===this.readyState)
                        Event._domHasFinishedLoading();
                };
                script= null;
            
                //  observe cleared when Event._domHasFinishedLoading called
                Event.observe(window, 'load', Event._domHasFinishedLoading);
                Event._readyCallbacks= [];
            }
        
            Event._readyCallbacks.push(f);
        }
    	
    	
    });
}
