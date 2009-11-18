/*jsl:import easing.js*/
/*jsl:import ../core/startup.js*/
/*jsl:import ../dom/element.js*/
/*jsl:import ../dom/element-ie.js*/

/** @name coherent.Animator
    @namespace The animator
*/
(function() {

    var DEFAULTS = {
        duration: 500,
        actions: {}
    };
    
    var timer      = null;
    var actors     = {};
    var actorCount = 0;
    var lastStep   = 0;
    
    var getStyles= Element.getStyles;
    
    function getStylesForTree(node, propsToGet)
    {
        var info= {};
        function visitNode(node)
        {
            var id= Element.assignId(node);
            info[id]= getStyles(node, propsToGet);
        }
        Element.depthFirstTraversal(node, visitNode);
        return info;
    }
    
    function colourToString()
    {
        return [this.r, this.g, this.b, this.a].join(',');
    }
    
    function stringToColor(color)
    {
        if (typeof(color) != "string")
            return color;
        
        var rgb;
        
        if ((rgb= Element.colours[color.toLowerCase()]))
            color= rgb;

        if ((rgb= color.match(/^rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d(?:\.\d+)?)\s*)?\)$/i)))
            return {
                r: parseInt(rgb[1], 10),
                g: parseInt(rgb[2], 10),
                b: parseInt(rgb[3], 10),
                a: parseInt(rgb[4]||1, 10),
                toString: colourToString
            };

        if ('#'!==color.charAt(0)) {
            if (color=="transparent") {
                return {
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 0
                };
            }
            throw new Error('Invalid colour: ' + color);
        }
        
        if (4==color.length)
            return {
                r: parseInt(color.charAt(1)+color.charAt(1), 16),
                g: parseInt(color.charAt(2)+color.charAt(2), 16),
                b: parseInt(color.charAt(3)+color.charAt(3), 16),
                a: 1,
                toString: colourToString
            };
        else
            return {
                r: parseInt(color.substr(1,2), 16),
                g: parseInt(color.substr(3,2), 16),
                b: parseInt(color.substr(5,2), 16),
                a: 1,
                toString: colourToString
            };
    }
    
    function normaliseProperties(props)
    {
        if ('margin' in props)
        {
            props.marginLeft= props.marginRight= props.marginTop= props.marginBottom= props.margin;
            delete props.margin;
        }
        if ('padding' in props)
        {
            props.paddingLeft= props.paddingRight= props.paddingTop= props.paddingBottom= props.padding;
            delete props.padding;
        }
        if ('borderColor' in props)
        {
            props.borderLeftColor= props.borderRightColor= props.borderTopColor=
                                   props.borderBottomColor= props.borderColor;
            delete props.borderColor;
        }
        if ('borderWidth' in props)
        {
            props.borderLeftWidth= props.borderRightWidth= props.borderTopWidth=
                                   props.borderBottomWidth= props.borderWidth;
            delete props.borderWidth;
        }
        return props;
    }

    function startAnimator()
    {
        if (timer)
            return;
        
        lastStep = (new Date()).getTime();
        timer = window.setInterval(step, 10);
    }
    
    function stopAnimator()
    {
        if (!timer)
            return;
        window.clearInterval(timer);
        timer= null;
    }
    
    function step()
    {
        var element, t, stepper;
        var now = (new Date()).getTime();
        coherent.EventLoop._start= now;
        
        for (var a in actors)
        {
            var actor= actors[a];
            var properties= actor.properties;
            
            for (var p in properties) {
                stepper = properties[p][0];
                if (now >= stepper.endTime) {
                    stepper.step(1);
                    onAnimationComplete(a, p);
                } else if (stepper.startTime <= now) {
                    t = (now-stepper.startTime)/stepper.totalTime;
                    stepper.step(t);
                }
            }
        }
        
        lastStep = now;
    }
    
    /** An animation stepper for colour properties.
     */
    function ColourStepper(property, element, start, end, shouldCleanup)
    {
        this.property= property;
        this.element= element;
        this.start= stringToColor(start);
        this.end= stringToColor(end);
        
        if (coherent.Support.CSS3ColorModel) {
            // We assume here that if you are fading to/from alpha=0, then you don't
            // want a color shift, so make sure the RGB values are equal.
            if (this.start.a === 0) {
                this.start.r = this.end.r;
                this.start.g = this.end.g;
                this.start.b = this.end.b;
            } else if (this.end.a === 0) {
                this.end.r = this.start.r;
                this.end.g = this.start.g;
                this.end.b = this.start.b;
            }

            this.step = this.stepRGBA;
        } else {
            this.step = this.stepRGB;
        }
        
        this.delta= {
            r: this.end.r-this.start.r,
            g: this.end.g-this.start.g,
            b: this.end.b-this.start.b,
            a: this.end.a-this.start.a
        };

        this.shouldCleanup= !!shouldCleanup;
    }
    ColourStepper.prototype.stepRGB= function(t)
    {
        if (this.curve)
            t= this.curve(t);
        
        var rgb= ['rgb(',
                   Math.round(t * this.delta.r + this.start.r), ',',
                   Math.round(t * this.delta.g + this.start.g), ',',
                   Math.round(t * this.delta.b + this.start.b), ')'].join('');
        this.element.style[this.property]= rgb;
    }
    ColourStepper.prototype.stepRGBA= function(t)
    {
        if (this.curve)
            t= this.curve(t);
        var rgba= ['rgba(',
                   Math.round(t * this.delta.r + this.start.r), ',',
                   Math.round(t * this.delta.g + this.start.g), ',',
                   Math.round(t * this.delta.b + this.start.b), ',',
                              t * this.delta.a + this.start.a, ')'].join('');
        this.element.style[this.property]= rgba;
    }
    ColourStepper.prototype.cleanup= function()
    {
        this.element.style[this.property]= '';
    }

    /** An animation stepper for numeric property values (integers) like left,
        top, width, height, etc.
     */
    function NumericStepper(property, element, start, end, shouldCleanup)
    {
        this.property= property;
        this.element= element;
        this.start= parseInt(start||0, 10);
        this.end= parseInt(end||0, 10);
        this.delta= this.end-this.start;
        this.shouldCleanup = !!shouldCleanup;
    }
    NumericStepper.prototype.step= function(t)
    {
        if (this.curve)
            t= this.curve(t);
        this.element.style[this.property]= Math.round(t*this.delta + this.start) + 'px';
    }
    NumericStepper.prototype.cleanup= function() {
        this.element.style[this.property]= '';
    }

    /** An animation stepper for element opacity. There's a special case step
        function to handle IE.
     */
    function OpacityStepper(element, start, end, shouldCleanup)
    {
        this.element= element;
        this.start= parseFloat(start||0);
        this.end= parseFloat(end||0);
        this.delta= end-start;
        this.shouldCleanup = !!shouldCleanup;
    }
    if (coherent.Browser.IE) {
        OpacityStepper.prototype.step= function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var opacity = t * this.delta + this.start;
            this.element.style.filter = (opacity>=1) ? '' : 'Alpha(Opacity='+opacity*100+')';
        }
        OpacityStepper.prototype.cleanup= function()
        {
            this.element.style.filter = '';
        }
    } else {
        OpacityStepper.prototype.step= function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var opacity= t*this.delta + this.start;
            this.element.style.opacity= (opacity>=1)?1:opacity;
        }
        OpacityStepper.prototype.cleanup= function() 
        {
            this.element.style.opacity= '';
        }
    }

    /** An animation stepper for discrete values like display. The value clicks
        over to the end value half way through the animation.
     */
    function DiscreteStepper(property, element, start, end, shouldCleanup)
    {
        this.property= property;
        this.element= element;
        this.start= start;
        this.end= end;
        this.shouldCleanup= !!shouldCleanup;
    }
    DiscreteStepper.prototype.step= function(t)
    {
        if (t>=this.discreteTransitionPoint)
        {
            this.element.style[this.property] = this.end;
            this.step= function(t){};
        }
    }
    DiscreteStepper.prototype.cleanup= function()
    {
        this.element.style[this.property]= '';
    }
    
    
    function ClassNameStepper(element, start, end)
    {
        this.element= element;
        this.start= start;
        this.end= end;
    }
    ClassNameStepper.prototype.step= function(t)
    {
        if (t>=this.discreteTransitionPoint) {
            this.element.className = this.end;
            this.step = function(t){};
        }
    }
    
    /** An animation stepper for background image positioning. It can support all
        permutations of background-position, including keywords like top, left, etc.
        Caveat: It's not possible to animate from percentages/keywords to pixels.
        In this case, we'll fall back to a DiscreteStepper.
     */
    function BackgroundPositionStepper(element, start, end, shouldCleanup)
    {
        function convertKeywords(keywords) {
            switch (keywords) {
                case 'top':
                    return '0% 50%';
                case 'right':
                    return '100% 50%';
                case 'bottom':
                    return '50% 100%';
                case 'left':
                    return '0% 50%';
                case 'center':
                    return '50% 50%';
                default:
                    keywords = keywords.replace(/top|left/g, '0%');
                    keywords = keywords.replace(/bottom|right/g, '100%');
                    return keywords;   
            }
        }
        function stripUnits(item) {
            return parseInt(item, 10);
        }
        
        start = convertKeywords(start);
        end = convertKeywords(end);
        
        var startUnit = start.match(/%|px/)[0];
        var endUnit = end.match(/%|px/)[0];
        if (startUnit != endUnit) {
            return new DiscreteStepper('backgroundPosition', element, start, end, shouldCleanup);
        }
        
        this.element = element;
        this.unit = startUnit;
        this.start = Array.map(start.split(' '), stripUnits);
        this.end = Array.map(end.split(' '), stripUnits);
        this.delta = [this.end[0]-this.start[0], this.end[1]-this.start[1]];
        this.shouldCleanup= !!shouldCleanup;
        
        return this;
    }
    BackgroundPositionStepper.prototype.step = function(t)
    {
        if (this.curve)
            t= this.curve(t);
        this.element.style.backgroundPosition= Math.round(t * this.delta[0] + this.start[0])+this.unit+' '+
                                               Math.round(t * this.delta[1] + this.start[1])+this.unit;
    }
    BackgroundPositionStepper.prototype.cleanup= function()
    {
        if (coherent.Browser.IE) {
            this.element.style.backgroundPositionX = '';
            this.element.style.backgroundPositionY = '';
        } else {
            this.element.style.backgroundPosition = '';
        }
    }


    function getStepper(property, element, start, end, cleanup)
    {
        switch(property)
        {
            case '_className':
                return new ClassNameStepper(element, start, end);
                
            case 'display':
                return new DiscreteStepper(property, element, start, end, cleanup);
            
            case 'backgroundPosition':
                return new BackgroundPositionStepper(element, start, end, cleanup);
                
            case 'backgroundColor':
            case 'color':
            case 'borderColor':
            case 'borderTopColor':
            case 'borderRightColor':
            case 'borderBottomColor':
            case 'borderLeftColor':
                return new ColourStepper(property, element, start, end, cleanup);
            
            case 'opacity':
                return new OpacityStepper(element, start, end, cleanup);
            
            default:
                return new NumericStepper(property, element, start, end, cleanup);
        }
    }
    
    function onAnimationComplete(elementID, property)
    {
        var callbacks = [];
        var actor= actors[elementID];
        var stepper = actor.properties[property].shift();
        
        if (stepper.shouldCleanup && "function"===typeof(stepper.cleanup))
            stepper.cleanup();
        
        if ("function" == typeof(stepper.callback))
            callbacks.push(stepper.callback);
        
        if (!actor.properties[property].length)
        {
            delete actor.properties[property];
            actor.propCount--;
        }
        
        if (!actor.propCount)
        {
            if ("function" == typeof(actors[elementID]._callback))
                callbacks.push(actor._callback);
            delete(actors[elementID]);
            actorCount--;
        }
        
        if (!actorCount)
            stopAnimator();
        
        // execute callbacks
        var callbackCount= callbacks.length;
        for (var c=0; c<callbackCount; c++)
            callbacks[c](document.getElementById(elementID), property);
    }
    
    function animateProperties(element, hash, options)
    {
        options = Object.applyDefaults(options, DEFAULTS);
        
        if (options.delay)
        {
            animateProperties.delay(options.delay, element, hash, options);
            delete options.delay;
            return;
        }
        
        var elementId = Element.assignId(element);
        var actor = actors[elementId];

        if (!actor)
        {
            actorCount++;
            actor= actors[elementId] = {
                _node: element,
                propCount: 0,
                properties: {}
            };
        }
        if ("function" == typeof(options.callback))
            actor._callback = options.callback;
        
        var groupStart  = coherent.EventLoop.getStart();
        var groupEnd    = groupStart + options.duration;
        var startStyles = options.startStyles || getStyles(element,
                                                           Set.toArray(hash));

        normaliseProperties(hash);
              
        // assemble animation data structure
        for (var p in hash)
        {
            var propertyEntry= hash[p];
            
            var value= propertyEntry;
            if ('object'===typeof(value) && 'value' in value)
                value= value.value;

            var delay= propertyEntry.delay || 0;
            var start= groupStart + delay;
            var end;
            
            if (propertyEntry.duration)
                end= propertyEntry.duration + start;
            else
                end= groupEnd;

            var curve = propertyEntry.curve || options.curve;
            var discreteTransitionPoint = propertyEntry.discreteTransitionPoint || options.discreteTransitionPoint || 0.5;
            var cleanup = typeof(propertyEntry.cleanup)!=="undefined" ? propertyEntry.cleanup : options.cleanup;
            var propertySteppers;

            //  Grab the array of steppers for this property, if this property
            //  is not presently animating, increment the number of animating
            //  properties for this actor and create an empty stepper array.
            if (p in actor.properties)
                propertySteppers= actor.properties[p];
            else
            {
                actor.propCount++;
                propertySteppers= [];
            }
            
            function testCollision(returnValue, item, index)
            {
                var endCollision = item.startTime < end && item.endTime > end;
                var startCollision = item.startTime < start && item.endTime > start;
                var innerCollision = item.startTime <= start && item.endTime >= end;
                
                if (!(startCollision || endCollision || innerCollision))
                    returnValue.push(item);
                return returnValue;
            }
                        
            // resolve collisions
            if (propertySteppers.length)
                propertySteppers= propertySteppers.reduce(testCollision, []);
            
            //  Create the new stepper for this property
            var stepper= getStepper(p, element, startStyles[p], value, cleanup);
            stepper.startTime = start;
            stepper.endTime   = end;
            stepper.totalTime = end-start;
            stepper.curve     = curve;
            stepper.discreteTransitionPoint = discreteTransitionPoint;
            
            if ('object'===typeof(propertyEntry) && 'callback' in propertyEntry)
                stepper.callback = propertyEntry.callback;
            
            if (options.stepBackToZero)
                stepper.step(0);

            propertySteppers.push(stepper);
            
            //  Stash the steppers back in the actor
            actor.properties[p]= propertySteppers;
        }
        
        //  start the animation timer
        startAnimator();        
    }
    
    function isNodeInDocument(node)
    {
        var id= Element.assignId(node);
        return !!document.getElementById(id);
    }
    
    function animateClassName(element, newClassName, options)
    {
        var node;
        var style;
        
        options = Object.applyDefaults(options, DEFAULTS);
        
        if (options.delay) {
            animateClassName.delay(options.delay, element, newClassName, options);
            delete options.delay;
            return;
        }
        
        if (!isNodeInDocument(element))
        {
            element.className= newClassName;
            if (options.callback)
                options.callback();
            return;
        }
        
        var propsToGet = options.only;
        // get old styles
        var startStyles = getStylesForTree(element, propsToGet);
        
        // set className and clear any styles that we're currently animating on
        // to remove any conflicts with the new className
        var oldClassName = element.className;
        element.className = newClassName;
        
        for (var id in startStyles)
        {
            var actor= actors[id];
            if (!actor)
                continue;
            
            style= actor._node.style;
            for (var p in actor.properties)
                style[p]= '';
        }

        // get destination styles
        var endStyles = getStylesForTree(element, propsToGet);
        element.className = oldClassName;

        /* If there is a callback supplied for this class transition, 
           move it to the _className property rather than the animation itself.
           This way, if the class transition is interrupted by another (without a callback)
           The original callback won't run.
        */
        var thingsToAnimate = {};
        thingsToAnimate[element.id] = {
            _className: {
                value: newClassName,
                duration: options.duration,
                callback: options.callback
            }
        };        
        delete options.callback;
        
        function animateNode(node)
        {
            var id= node.id;
            var nodeAction= options.actions[id];
            var from= startStyles[id];
            var to= endStyles[id];
            var adjusted= {};
            
            if (!nodeAction)
            {
                var fromDisplay= from.display;
                var toDisplay= to.display;
                
                if (fromDisplay=='none' && toDisplay=='none')
                    nodeAction = coherent.Animator.IGNORE_NODE;

                if (fromDisplay=='none' && toDisplay!=='none')
                    nodeAction = coherent.Animator.FADE_IN_NODE;

                if (fromDisplay!=='none' && toDisplay=='none')
                    nodeAction = coherent.Animator.FADE_OUT_NODE;
            }
            
            // If nodeAction is a function, it should be executed.
            // It is expected to return an animation type (FADE_NODE, IGNORE_NODE, etc)
            if ("function" === typeof(nodeAction)) {
                nodeAction = nodeAction(node, startStyles, endStyles);
            }
            
            if ('object'==typeof(nodeAction))
            {
               adjusted= nodeAction;
               nodeAction= coherent.Animator.MORPH_NODE;
            }
            
            switch (nodeAction)
            {
                case coherent.Animator.IGNORE_NODE:
                    //  Skip child nodes because this node should be ignored
                    return false;
                    
                case coherent.Animator.FADE_NODE:
                    // do animations
                    thingsToAnimate[id] = thingsToAnimate[id] || {};
                    thingsToAnimate[id].opacity = {
                        value: 0, 
                        duration: options.duration,
                        curve: coherent.easing.linearCompleteAndReverse
                    };
                    //  Skip child nodes because this node will be fading out
                    //  and will fade in with the new class name
                    return false;
                    
                case coherent.Animator.FADE_OUT_NODE:
                    // don't need to consider child nodes, because they won't be
                    // visible after self node fades out
                    thingsToAnimate[id] = thingsToAnimate[id] || {};
                    thingsToAnimate[id].opacity = {
                        value: 0, 
                        duration: options.duration/2,
                        cleanup: false
                    };
                    //  Skip child nodes because they won't be visible after the
                    //  class changes.
                    return false;
                    
                case coherent.Animator.FADE_IN_NODE:
                    // don't need to consider child nodes, because they'll have their
                    // new style when fading in.
                    from.opacity = 0;
                    thingsToAnimate[id] = thingsToAnimate[id] || {};
                    thingsToAnimate[id].opacity = {
                        value: 1, 
                        duration: options.duration/2, 
                        delay: options.duration/2
                    };
                    return false;
                    
                case coherent.Animator.MORPH_NODE:
                default:
                    // calculate differences
                    for (var p in from)
                    {
                        // only animate over properties that don't match, or are to be overwritten
                        var actor= actors[id];
                        var adjustedValue= adjusted[p];
                        var finalValue= adjustedValue ? (adjustedValue.value || adjustedValue) : to[p];
                        
                        if ((actor && p in actor.properties) ||
                            (String(from[p]) != String(finalValue)))
                        {
                            thingsToAnimate[id] = thingsToAnimate[id] || {};
                            if (p in adjusted)
                            {
                                if (adjustedValue.value)
                                    thingsToAnimate[id][p]= adjustedValue;
                                else
                                    thingsToAnimate[id][p]= {
                                        value: adjustedValue
                                    };
                                thingsToAnimate[id][p].cleanup= false;
                            }
                            else
                                thingsToAnimate[id][p] = finalValue;
                        }
                    }
                    return true;
            }
        }
        
        Element.depthFirstTraversal(element, animateNode);
        
        options.stepBackToZero = true;
        options.cleanup= true;
               
        for (var nodeId in thingsToAnimate)
        {
            node= document.getElementById(nodeId);
            if (!node)
                continue;

            options.startStyles = startStyles[nodeId];            
            animateProperties(node, thingsToAnimate[nodeId], options);
        }
    }
    
    function _removeClassName(originalClasses, className)
    {
        var index= originalClasses.indexOf(className);
        if (-1!==index)
            originalClasses.splice(index,1);
        return originalClasses;
    }
    
    function _addClassName(originalClasses, className)
    {
        var index= originalClasses.indexOf(className);
        if (-1===index)
            originalClasses.push(className);
        return originalClasses;
    }
    
    // Return Object
    
    coherent.Animator = /** @scope coherent.Animator */ {
    
        addClassName: function(element, className, options)
        {
            if (!className)
                return;
            if ('object'===typeof(className) && 'classname' in className)
            {
                options= className;
                className= options.classname;
            }
            
            var regex= Element.regexForClassName(className);
            
            var elementClassName = element.className;

            if (!regex.test(elementClassName)) {
                if (elementClassName)
                    elementClassName += ' ' + className;
                else
                    elementClassName= className;
            }

            animateClassName(element, elementClassName, options);
        },
        
        removeClassName: function(element, className, options)
        {
            var elementClasses= element.className;
            var regex;

            if ('object'===typeof(className) && 'classname' in className)
            {
                options= className;
                className= options.classname;
            }
            
            if (elementClasses===className)
            {
                animateClassName(element, '', options);
                return;
            }

            elementClasses= elementClasses.split(" ");
            if ('string'===typeof(className))
                elementClasses= _removeClassName(elementClasses, className);
            else
                elementClasses= className.reduce(_removeClassName, elementClasses);

            //if (elementClassName==element.className)
            //    return;
            
            animateClassName(element, elementClasses.join(" "), options);
        },
        
        setClassName: function(element, className, options)
        {
            var elementClassName= element.className;
            //if (elementClassName===className)
            //    return;
                
            animateClassName(element, className, options);
        },
        
        replaceClassName: function(element, oldClassName, newClassName, options) 
        {
            //if (oldClassName===newClassName)
            //    return;
            
            if (oldClassName) {
                var regex = Element.regexForClassName(oldClassName);
                newClassName= element.className.replace(regex, "$1"+newClassName+"$2");
            } else {
                newClassName = element.className + ' ' + newClassName;
            }
            animateClassName(element, newClassName, options);
        },
        
        animateClassName: function(element, options)
        {
            var elementClasses= (element.className||"").split(" ");
            var reverse= options.reverse;
            var add= reverse ? options.remove : (options.add||options.classname);
            var remove= reverse ? (options.add||options.classname) : options.remove;
            
            if (add)
            {
                if ('string'===typeof(add))
                    elementClasses= _addClassName(elementClasses, add);
                else
                    elementClasses= add.reduce(_addClassName, elementClasses);
            }
            if (remove)
            {
                if ('string'===typeof(remove))
                    elementClasses= _removeClassName(elementClasses, remove);
                else
                    elementClasses= remove.reduce(_addClassName, elementClasses);
            }

            if (options.duration)
                animateClassName(element, elementClasses.join(" "), options);
            else
            {
                element.className= elementClasses.join(" ");
                if (options.callback)
                    options.callback(element);
            }
        },
        
        /**
            @function

            @param {Element} element
            @param {Object} properties
            @param {Object} [options]
         */
        setStyles: animateProperties,
        
        abort: function()
        {
            actors = {};
            stopAnimator();
        }
    };
})();

coherent.Animator.FADE_NODE     = "fade";
coherent.Animator.FADE_IN_NODE  = "fade_in";
coherent.Animator.FADE_OUT_NODE = "fade_out";
coherent.Animator.IGNORE_NODE   = "ignore";
coherent.Animator.MORPH_NODE    = "morph";
