/*jsl:import ../../ui.js*/
/*jsl:declare Sizzle*/

//  Trick picked up from Prototype to get around IE8's fixed Element & Event
(function() {
  var element = this.Element;
  this.Element = {};
  Object.extend(this.Element, element || {});
}).call(window);

/*jsl:declare Element*/

/**
    @name Element
    @namespace
 */
Object.extend(Element, {

    /** Generate an unique ID which can be used to identify an element.
        @returns {String} an unique ID
     */
    uniqueId: function()
    {
        return 'coherent_id_' + Element.assignId.uniqueId++;
    },
    
    /** Make certain an element has an ID. If it doesn't have one, assign an
        unique ID to it.
        
        @param {Element} element - a DOM element
        @returns {String} the element's ID
     */
    assignId: function(element)
    {
        return element.id ||
               (element.id=('coherent_id_' + Element.assignId.uniqueId++));
    },

    /** Create a regular expression that will match a particular class name
        @param {String} className - The classname that the regular expression
            should match
        @type RegExp
     */
    regexForClassName: function(className)
    {
        var lookup= Element.__regexLookup || (Element.__regexLookup= {});
            
        if (className in lookup)
            return lookup[className];
            
        return (lookup[className]=new RegExp("(^|\\s)" + className + "(\\s|$)"));
    },
    
    /** Determine whether an element has the specified class name
    
        @type Boolean
        @param {Element} element - The DOM element to test.
        @param {String} className - The class name to test for.
     */
    hasClassName: function(element, className)
    {
        var elementClassName = element.className;
        if (!elementClassName)
            return false;
        if (elementClassName==className)
            return true;
        
        return Element.regexForClassName(className).test(elementClassName);
    },

    /** Add the specified class name to the element.
        @param {Element} element - The DOM element to add the class name to.
        @param {String} className - The class name to add to the element.
     */
    addClassName: function(element, className)
    {
        if (!className)
            return;
            
        if (Element.hasClassName(element, className))
            return;
        element.className += ' ' + className;
    },

    /** Remove the specified class name from the element.
        @param {Element} element - The DOM element to remove the class name from.
        @param {String} className - The class name to remove from the element.
     */
    removeClassName: function(element, className)
    {
        if (!element || !className)
            return;
            
        var regex= Element.regexForClassName(className);
        element.className= element.className.replace(regex, ' ').trim();
    },
    
    /** Remove the specified class name from the element.
        @param {Element} element - The DOM element which will have its class name
            altered
        @param {String} className - The original class name that will be replaced.
        @param {String} newClassName - The new class name that will be added.
     */
    replaceClassName: function(element, className, newClassName)
    {
        if (!className)
            return;
            
        if (!newClassName) {
            Element.removeClassName(element, className);
            return;
        }
            
        var regex= Element.regexForClassName(className);
        element.className= element.className.replace(regex, '$1'+newClassName+'$2').trim();
    },
    
    /** If the element has the class name, remove it, otherwise add it.
        @param {Element} element - The DOM element which will have its class
            name changed.
        @param {String} className - The class name to add or remove.
     */
    toggleClassName: function(element, className)
    {
        if (!className)
            return;
            
        var regex= Element.regexForClassName(className);
        var elementClassName= element.className;
        
        if (regex.test(elementClassName))
            element.className= elementClassName.replace(regex, ' ').trim();
        else
            element.className+= ' ' + className;
    },
    
    /** Add and remove classes to/from an element. This preserves existing classes
        and only adds the class if it doesn't already exist and only removes classes
        that do exist.
    
        @param {Element} element - the DOM element to modify
        @param {String|String[]} classesToAdd - either a single class name or an
            array of classes to add to the element.
        @param {String|String[]} classesToRemove - either a single class name or
            an array of classes to remove from the element
     */
    updateClass: function(element, classesToAdd, classesToRemove)
    {
        var classes= $S(element.className.split(' '));
        var add= Set.add;
        var remove= Set.remove;
        
        var i;
        var len;
        
        if ('string'===typeof(classesToAdd))
            add(classes, classesToAdd);
        else
        {
            len= classesToAdd.length;
            while (len--)
                add(classes, classesToAdd[len]);
        }
        
        if ('string'===typeof(classesToRemove))
            remove(classes, classesToRemove);
        else
        {
            len= classesToRemove.length;
            while (len--)
                remove(classes, classesToRemove[len]);
        }
        element.className= Set.join(classes, ' ');
    },

    /** The list of CSS properties that will be returned from {@link #getStyles}
        when the `propsToGet` parameter is missing.
        @type String[]
     */
    PROPERTIES: ['backgroundColor', 'backgroundPosition', 'borderTopColor', 
                 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 
                 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 
                 'borderLeftWidth', 'color', 'display', 'fontSize', 'letterSpacing', 
                 'lineHeight', 'opacity',
                 'width', 'height', 'top', 'bottom', 'left', 'right', 
                 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
    
    /** Retrieve the styles for an element.
        @param {Element} element - the DOM node for which to fetch styles
        @param {String|String[]} [propsToGet] - the property or properties to
            fetch, if not specified, the value of {@link Element.PROPERTIES} is
            used.
        @returns {String} The property value, when `propsToGet` is a string.
        @returns {Object} A dictionary of property values, when `propsToGet` is
            missing or an array.
     */
    getStyles: function(element, propsToGet)
    {
        var styles = {};
        var computedStyle= window.getComputedStyle(element, null);

        if ('string'===typeof(propsToGet))
            return element.style[propsToGet]||computedStyle[propsToGet]||null;
        
        propsToGet= propsToGet||Element.PROPERTIES;
    
        var p;
        var len= propsToGet.length;

        while (len--)
        {
            p= propsToGet[len];
            styles[p]= element.style[p]||computedStyle[p]||null;
        }
    
        return styles;
    },

    /** Set a single style on an element. This function requires Javascript
        identifiers rather than CSS rule names. For example: `backgroundColor`
        instead of `background-color`.
        
        @param {Element} element - the DOM element to update.
        @param {String} style - the style rule identifier
        @param {String|Number} value - the value for the style
     */
    setStyle: function(element, style, value)
    {
        element.style[style]= value;
    },
    
    /** Set multiple styles on an element. Like {@link #setStyle}, this function
        requires Javascript identifiers rather than CSS rule names. For example,
        it expects `marginLeftWidth` instead of `margin-left-width`.
        
        An example of using `setStyles`:
        
            Element.setStyles(node, {
                opacity: 0.5,
                backgroundColor: '#666',
                color: 'white'
            });
            
        @param {Element} element - the DOM element to update.
        @param {Object} styles - a dictionary containing name value pairs
     */
    setStyles: function(element, styles)
    {
        var elementStyle= element.style;
        for (var p in styles)
            elementStyle[p]= styles[p];
    },
    
    /** Retrieve the dimensions of the DOM node. This method takes care of
        adjusting hidden nodes (via display=none) because otherwise, they report
        0 x 0 dimensions.
        @param {Element} node - The DOM element for which dimensions should be
            fetched.
        @returns {Object} a dictionary with the top, left, width, and height of
            the element.
     */
    getDimensions: function(node)
    {
        var display = Element.getStyle(node, 'display');
        if (display && display != 'none') // Safari bug
            return {
                left: node.offsetLeft,
                top: node.offsetTop,
                width: node.offsetWidth,
                height: node.offsetHeight
            };

        // All *Width and *Height properties give 0 on elements with display none,
        // so enable the element temporarily
        var els = node.style;
        var originalVisibility = els.visibility;
        var originalPosition = els.position;
        var originalDisplay = els.display;
        els.visibility = 'hidden';
        els.position = 'absolute';
        els.display = 'block';
        var dimensions = {
            width: node.offsetWidth,
            height: node.offsetHeight,
            left: node.offsetLeft,
            top: node.offsetTop
        };
        els.display = originalDisplay;
        els.position = originalPosition;
        els.visibility = originalVisibility;
        return dimensions;
    },
    
    set3PiecesBorderImage : function(element, url, leftWidth, rightWidth){
        if (coherent.Support.BorderImage) {            
            // Set the border-image
            element.style.borderWidth = url ? '0px ' + rightWidth + 'px 0px ' + leftWidth + 'px ' : '0px';
            var value = url ? "url(" + url + ") 0 " + rightWidth + " 0 " + leftWidth + " repeat stretch" : '';
            element.style.webkitBorderImage = value;
            element.style.MozBorderImage = value;
        
        } else {
            if(!url){
                element.innerHTML = ""; //remove all children.
                return;
            }

            // Generate 3 div with a background-image
            var mPart = document.createElement('div');
            var middleStyle = mPart.style;
            middleStyle.position = 'absolute';
            middleStyle.top = '0px';
            middleStyle.bottom = '0px';

            var cont = mPart.cloneNode(false);
            cont.style.left = "0px";
            cont.style.right = "0px";
            
            var lPart = mPart.cloneNode(false);
            var leftStyle = lPart.style;          
            leftStyle.backgroundImage = 'url(' + url + ')';
            leftStyle.backgroundRepeat = 'no-repeat';
            
            
            var rPart = lPart.cloneNode(false);
            var rightStyle = rPart.style;
            leftStyle.left = '0px';
            leftStyle.width = leftWidth + 'px';
            
            rightStyle.right = '0px';
            rightStyle.width = rightWidth + 'px';
            rightStyle.backgroundPosition = '100% 0px'; //Image sticks to the right side.
            
            middleStyle.left = leftWidth + 'px';
            middleStyle.right = rightWidth + 'px';
            middleStyle.backgroundImage = 'url(' + url.replace(/.png/, '__mid.png') + ')';
            middleStyle.backgroundRepeat = 'repeat-x';

        	// Insert left, middle and right parts.
            if (element.firstChild)
                element.insertBefore(cont, element.firstChild);
            else
                element.appendChild(cont);
        	cont.appendChild(lPart);
        	cont.appendChild(mPart);
        	cont.appendChild(rPart);
        }
    },
    
    /** IE has problems with cloneNode, so a wrapper is necessary.
        @param {Element} node - the DOM element to clone
        @type Element
     */
    clone: function(node)
    {
        return node.cloneNode(true);
    },
    
    /** Visit all elements in the node tree rooted at e in depth first order. If
        the visitor function returns false (and exactly false, not a false-y
        value like null or undefined), the traversal will abort.
    
        @param {Element} node - the root of the DOM tree to traverse
        @param {Function} visitor - A function to call for each element. This
            function receives the node as its only argument.
        @param {Object} [scope] - the scope to use for the visitor function
     */
    depthFirstTraversal: function(node, visitor, scope)
    {
        if (!node || !visitor)
            return;
        var end= node.nextSibling||node.parentNode;
        var visitChildren;
        
        scope= scope||visitor;

        while (node!==end)
        {
            if (1===node.nodeType)
            {
                visitChildren= visitor.call(scope, node);
                
                if (false!==visitChildren && node.firstChild)
                {
                    node= node.firstChild;
                    continue;
                }
            }
            
            while (!node.nextSibling)
            {
                node= node.parentNode;
                if (node===end)
                    return;
            }
            
            node= node.nextSibling;
        }
    },
    
    /** Wrapper method for querySelector. This wrapper enables using a helper
        library for browsers that don't support the W3C query API.
        
        @param {Element} node - the root node from which to begin the query
        @param {String} selector - a CSS selector to find
        @returns {Element} one node that matches the selector or null
     */
    query: function(node, selector)
    {
        if ('undefined'===typeof(selector))
        {
            selector= node;
            node= document;
        }
        else if (node!==document)
            selector = ['#', Element.assignId(node), ' ', selector].join('');
        return node.querySelector(selector);
    },
    
    /** Wrapper method for querySelectorAll. This wrapper enables using a helper
        library for browsers that don't support the W3C query API.
        
        @param {Element} node - the root node from which to begin the query
        @param {String} selector - a CSS selector to find
        @returns {Element[]} a list of nodes that match the selector (may be empty)
     */
    queryAll: function(node, selector)
    {
        if ('undefined'===typeof(selector))
        {
            selector = node;
            node = document;
        }
        else if (node!==document)
            selector = ['#', Element.assignId(node), ' ', selector].join('');
        return Array.from(node.querySelectorAll(selector));
    },

    /** Retrieve the dimensions and position of the viewport.
        @returns {Object} a dictionary with left, top, width, and height
     */
    getViewport: function()
    {
        var docElement= document.documentElement;
        var body= document.body;
        
        return {
            left: window.scrollLeft||docElement.scrollLeft||body.scrollLeft,
            top: window.scrollTop||docElement.scrollTop||body.scrollTop,
            width: window.innerWidth||docElement.clientWidth||body.clientWidth,
            height: window.innerHeight|docElement.clientHeight||body.clientHeight
        };
    },
    
    /** Determine the parentNode that controls scrolling.
        @param {Element} node - the element that is scrolled
        @returns {Element} a node that has `overflow` style set to `scroll` or
            `auto` with a height.
     */
    scrollParent: function(node)
    {
        var styles;
        var getStyles= Element.getStyles;
        var body= document.body;
        
        while (node && node!=body)
        {
            styles= getStyles(node, ['overflow', 'overflowX', 'overflowY']);
            for (var styleKey in styles)
            {
                var style = styles[styleKey];
                
                if ('auto' == style || 'scroll' == style)
                    return node;
            }
            node= node.parentNode;
        }
        
        return node;
    },
    
    /** Determine the client rectangle of an element.
    
        @param {Element} node - The DOM element to measure
        @param {Boolean} [relativeToViewport=false] When `true`, position is 
            relative to the viewport instead of the page.
        @returns {Object} an object with top, left, bottom, right, width, and
            height properties containing the px-based values for the node.
     */
    getRect: function(node, relativeToViewport)
    {
        if (!node)
            return null;

        var docElement= document.documentElement;
        var body= document.body;

    	var left= 0;
    	var top = 0;
        
        if (node!=document.body && node.getBoundingClientRect)
        {
            var box= node.getBoundingClientRect();
            //  values of box are read only...
            box= {
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom
            };
            
            //  getBoundingClientRect returns coordinates relative to the
            //  viewport. Scroll extents of the body need to be added in order
            //  to return the rectangle relative to the page.
            if (!relativeToViewport)
            {
                box.left+= Math.max(docElement.scrollLeft, body.scrollLeft);
                box.right+= Math.max(docElement.scrollLeft, body.scrollLeft);
                box.top+= Math.max(docElement.scrollTop, body.scrollTop);
                box.bottom+= Math.max(docElement.scrollTop, body.scrollTop);
            }
                                     
			// IE adds the HTML element's border, by default it is medium which is 2px
			// IE 6 and 7 quirks mode the border width is overwritable by the following css html { border: 0; }
			// IE 7 standards mode, the border is always 2px
			// This border/offset is typically represented by the clientLeft and clientTop properties
			// However, in IE6 and 7 quirks mode the clientLeft and clientTop properties are not updated when overwriting it via CSS
			// Therefore this method will be off by 2px in IE while in quirksmode
            box.left-= docElement.clientLeft;
            box.right-= docElement.clientLeft;
            box.top-= docElement.clientTop;
            box.bottom-= docElement.clientTop;
            
            box.width= box.right-box.left+1;
            box.height= box.bottom-box.top+1;
            return box;
        }
        
        var parent= node.parentNode;
        var offsetChild= node;
        var offsetParent= node.offsetParent;
        var mozilla= coherent.Browser.Mozilla;
        var safariOtherThan2= coherent.Browser.Safari && !coherent.Browser.Safari2;
        var safari2= coherent.Browser.Safari2;
        var getStyles= Element.getStyles;
        var dimensions= Element.getDimensions(node);
        
        var fixed= ('fixed'===Element.getStyles(node, 'position'));
        var styles;
        
        left+= node.offsetLeft;
        top+= node.offsetTop;
       
        //  Find the cumulative offsets
        while (!fixed && offsetParent)
        {
            left+= offsetParent.offsetLeft;
            top+= offsetParent.offsetTop;


			// Mozilla and Safari > 2 does not include the border on offset parents
			// However Mozilla adds the border for table or table cells
			if (mozilla && !((/^t(able|d|h)$/i).test(offsetParent.tagName)) || safariOtherThan2)
			{
			    styles= getStyles(offsetParent, ['borderLeftWidth', 'borderTopWidth']);
			    left+= parseInt(styles.borderLeftWidth||0, 10);
			    top+= parseInt(styles.borderTopWidth||0, 10);
            }
            
            if (!fixed)
                fixed= ('fixed'===getStyles(offsetParent, 'position'));
                
            if ('BODY'!==offsetParent.tagName)
                offsetChild= offsetParent;
            offsetParent= offsetParent.offsetParent;
        }
        
        //  Find the cumulative scroll offsets
        var stylesToGet= mozilla?['display', 'overflow', 'borderLeftWidth', 'borderTopWidth']:['display'];
        
        while (parent && parent.tagName && 'BODY'!==parent.tagName && 'HTML'!==parent.tagName)
        {
            styles= getStyles(parent, stylesToGet);
            
			//  Remove parent scroll UNLESS that parent is inline or a table to work around Opera inline/table scrollLeft/Top bug
			if (!((/^inline|table.*$/i).test(styles.display)))
			{
				// Subtract parent scroll offsets
				left-= parent.scrollLeft;
				top-= parent.scrollTop;
			}

			//  Mozilla does not add the border for a parent that has overflow != visible
			if (mozilla && "visible"!=styles.overflow)
			{
			    left+= parseInt(styles.borderLeftWidth||0, 10);
			    top+= parseInt(styles.borderTopWidth||0, 10);
            }
            
			// Get next parent
			parent = parent.parentNode;
        }
        
		//  Safari <= 2 doubles body offsets with a fixed position element/offsetParent or absolutely positioned offsetChild
		//  Mozilla doubles body offsets with a non-absolutely positioned offsetChild
		var position= getStyles(offsetChild, 'position');
		
		if ((safari2 && (fixed || position=="absolute")) ||
			(mozilla && position!="absolute"))
		{
		    left-= body.offsetLeft;
		    top-= body.offsetTop;
		}
		
		//  Add the document scroll offsets if position is fixed
		if (relativeToViewport===true && !fixed) {
		    left -= Math.max(docElement.scrollLeft, body.scrollLeft);
		    top -= Math.max(docElement.scrollTop, body.scrollTop);
		}
		
		return {
		    left: left,
		    top: top,
		    right: left + dimensions.width-1,
		    bottom: top + dimensions.height-1,
		    width: dimensions.width,
		    height: dimensions.height
		};
    },
    
    /** Return the DOM element based on a position in the client area.
        @param {Number} clientX - the x coordinate relative to the viewport
        @param {Number} clientY - the y coordinate relative to the viewport
        @type Element
     */
    fromPoint: function(clientX, clientY)
    {
        if (coherent.Browser.Safari)
        {
            var docElement= document.documentElement;
            var body= document.body;
            
            clientX+= window.scrollLeft||docElement.scrollLeft||body.scrollLeft;
            clientY+= window.scrollTop||docElement.scrollTop||body.scrollTop;
        }
        
        var e= document.elementFromPoint(clientX, clientY);
        return e;
    }

});



/** Alias for {@link Element.getStyle}.
    @function
 */
Element.getStyle= Element.getStyles;

Element.assignId.uniqueId= 1;


//  Provide support for legacy browsers that don't implement the W3C selector API
if (!coherent.Support.QuerySelector)
    Object.extend(Element, {
    
        query: function(node, selector)
        {
            if (1==arguments.length) {
                selector = node;
                node = document;
            }
            return (Sizzle(selector, node)[0] || null);
        },
        
        queryAll: function(node, selector)
        {
            if (1==arguments.length) {
                selector = node;
                node = document;
            }
            return (Sizzle(selector, node) || null);
        }
        
    });

/*jsl:declare HTMLElement*/
/*jsl:declare Node*/

// Firefox < 3.5 doesn't know Element.children, adding it here.
if ('undefined'===typeof(document.documentElement.children))
{

    HTMLElement.prototype.__defineGetter__("children", function() {
        var arr = [];
        var len= this.childNodes.length;
        var node;

        while (len--)
        {
            node= this.childNodes[len];

            if (Node.ELEMENT_NODE!==node.nodeType)
                continue;

            arr.unshift(node);
        }

        return arr;
    });
    
}

// Firefox doesn't know (as of FF3.5) Element.innerText , emulate it here.
if ('undefined'===typeof(document.documentElement.innerText))
{

    HTMLElement.prototype.__defineGetter__("innerText", function () {
        return this.textContent;
    });

    HTMLElement.prototype.__defineSetter__("innerText", function (someText) {
        this.textContent = someText;
    });

}
