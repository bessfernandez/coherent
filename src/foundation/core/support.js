/*jsl:import ../../foundation.js*/

(function(){

    var seleniumIsActive= (-1!==window.name.indexOf('selenium'));

	coherent.Support = {};

	var root = document.documentElement;
	var script = document.createElement("script");
	var div = document.createElement("div");
	var id = "script" + (new Date()).valueOf();

	div.style.display = "none";
	div.innerHTML = "   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;background-position: 0% 100%;background-color:rgba(255,255,255,0.5);-webkit-border-image: inherit; -moz-border-image: inherit;border-image:inherit'>a</a><input type='checkbox'/>";

	var all = div.getElementsByTagName("*");
	var a = div.getElementsByTagName("a")[0];

	// Can't get basic test support
	if (!all || !all.length || !a)
		return;

	// Technique from Juriy Zaytsev
	// http://thinkweb2.com/projects/prototype/detecting-event-support-without-browser-sniffing/
	var eventSupported = function(eventName)
	{
		var el = document.createElement("div");
		eventName = "on" + eventName;

		var isSupported = eventName in el;
		if (!isSupported)
		{
			el.setAttribute(eventName, "return;");
			isSupported = 'function'===typeof(el[eventName]);
		}
		el = null;

		return isSupported;
	};
	
	coherent.Support = {

        /** Does the browser support JavaScript getters & setters? */
        Properties: ('__defineGetter__' in Object.prototype),

        /** Does the browser support native query selector? */
        QuerySelector: ('querySelector' in document),

        /** Does the browser support touch events? */
        Touches: !!document.createTouch,

        /** Does the browser support the W3C Event Model? */
        StandardEventModel: !!window.addEventListener,
        
        /** Does the browser support the hash change event? Currently IE8 in
            IE8 standards mode and FF 3.6. */
        HashChangeEvent: ("onhashchange" in window) && document.querySelector,

        /** Does the browser correctly handle element.cloneNode(true)? */
        CloneNode: true,
        
        /** Determine whether the browser supports HTML5 Drag & Drop. Mozilla
            prior to 3.5 doesn't work correctly. When running under Selenium,
            native drag and drop is disabled.
         */
        DragAndDrop: !seleniumIsActive && eventSupported('dragend'),

        /** Does the browser support the CSS3 Colour Model? */
        CSS3ColorModel: /rgba/.test(a.style.backgroundColor),

        /** Does the browser support separate X & Y on background position? */
        BackgroundPositionXY: a.style.backgroundPosition && 
                              (a.style.backgroundPositionX !== a.style.backgroundPositionY),
        
        /** Doest the browser support the CSS3 BorderImage property? */
        BorderImage: 'inherit'===a.style.WebkitBorderImage ||
                     'inherit'===a.style.MozBorderImage ||
                     'inherit'===a.style.borderImage,
                     
	    /** Does the browser preserve leading whitespace inserted using .innerHTML? */
		PreservesLeadingWhitespace: div.firstChild.nodeType === 3,

		/** Does the browser insert a TBODY element for tables? */
		InsertsTableBody: !!div.getElementsByTagName("tbody").length,

/*  @TODO: Not really sure this is needed...
		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,
*/

        /** Does the browser use the standard style attribute as opposed to .cssText? */
		HasStyleAttribute: /red/.test( a.getAttribute("style") ),

        /** Does the browser normalise the URLs of HREF attributes? */
        PreservesHref: a.getAttribute("href") === "/a",
        
		/** Does the browser support CSS opacity? IE uses proprietary filter mechanism. */
		Opacity: /^0.55$/.test( a.style.opacity ),

		/** Does the browser use standard float attribute (cssFloat) in style
		    definitions rather than non-standard (styleFloat)? */
		CssFloatAttribute: !!a.style.cssFloat,

        /** Does the submit event bubble? */
        SubmitBubbles: eventSupported('submit'),
        
        /** Does the change event bubble? */
        ChangeBubbles: eventSupported('change'),
        
        /** Determine whether assets (SCRIPT and STYLE tags) evaluate content
            added via appendChild with a text node. IE requires using .text and
            .cssText.
         */
        AssetsEvaluateChildren: false
	};

	//  In a standards compliant browser, cloning a node doesn't copy
	//  event handlers from the original node. Guess what IE does?
	if (div.attachEvent && div.fireEvent)
	{
	    var click= function()
	    {
			coherent.Support.CloneNode= false;
			div.detachEvent("onclick", click);
		};
			    
		div.attachEvent("onclick", click);
		div.cloneNode(true).fireEvent("onclick");
	}

    //  Determine value of AssetsEvaluateChildren
	script.type = "text/javascript";
	try
	{
		script.appendChild(document.createTextNode( "window." + id + "=1;" ));
    	root.insertBefore(script, root.firstChild);

    	if (window[id])
    	{
    		coherent.Support.AssetsEvaluateChildren= true;
    		delete window[id];
    	}

    	root.removeChild( script );
	}
	catch(e)
	{}


	// release memory in IE
	root = script = div = all = a = null;
})();