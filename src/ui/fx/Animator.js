/*jsl:import ../../ui.js*/
/*jsl:import easing.js*/
/*jsl:import ../dom/element.js*/
/*jsl:import ../dom/element-ie.js*/
/*jsl:import steppers.js*/
/*jsl:import steppers-ie.js*/


/** @name coherent.Animator
    @namespace The animator
*/
coherent.Animator= {
    MORPH_NODE    : 0x01,
    IGNORE_NODE   : 0x12,
    FADE_NODE     : 0x13,
    FADE_IN_NODE  : 0x14,
    FADE_OUT_NODE : 0x15,
    MORPH_NODE_IGNORE_CHILDREN : 0x16,

    IGNORE_CHILDREN_MASK : 0x10
};

(function() {

    var fx= coherent.fx;
    
    var DEFAULTS = {
        duration: 500,
        discreteTransitionPoint: 0.5,
        actions: {}
    };
    
    var timer      = null;
    var actors     = {};
    var actorCount = 0;
    var lastStep   = 0;
    
    var getStyles= Element.getStyles;

    function getStylesForTreeNodeVisitor(node)
    {
        var id= getStylesForTreeNodeVisitor.assignId(node);
        var action= getStylesForTreeNodeVisitor.actions[id] || getStylesForTreeNodeVisitor.MORPH_NODE;

        if (getStylesForTreeNodeVisitor.MORPH_NODE===action || getStylesForTreeNodeVisitor.MORPH_NODE_IGNORE_CHILDREN===action)
        {
            getStylesForTreeNodeVisitor.info.__count++;
            getStylesForTreeNodeVisitor.info[id]= getStylesForTreeNodeVisitor.getStyles(node, getStylesForTreeNodeVisitor.propsToGet);
        }
        return (action & getStylesForTreeNodeVisitor.IGNORE_CHILDREN_MASK)?false:true;
    }
    getStylesForTreeNodeVisitor.getStyles= Element.getStyles;
    getStylesForTreeNodeVisitor.assignId= Element.assignId;
    getStylesForTreeNodeVisitor.MORPH_NODE= coherent.Animator.MORPH_NODE;
    getStylesForTreeNodeVisitor.MORPH_NODE_IGNORE_CHILDREN= coherent.Animator.MORPH_NODE_IGNORE_CHILDREN;
    getStylesForTreeNodeVisitor.IGNORE_CHILDREN_MASK= coherent.Animator.IGNORE_CHILDREN_MASK;
    
    function getStylesForTree(node, propsToGet, actions)
    {
        var info={};
        getStylesForTreeNodeVisitor.propsToGet= propsToGet;
        getStylesForTreeNodeVisitor.actions= actions||{};
        getStylesForTreeNodeVisitor.info= info;
        Element.depthFirstTraversal(node, getStylesForTreeNodeVisitor);
        return info;
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
        actors= {};
    }
    
    function step()
    {
        var now = coherent.EventLoop.getStart();
        
        var element;
        var t;
        var stepper;
        
        for (var a in actors)
        {
            var actor= actors[a];
            var properties= actor.properties;
            
            for (var p in properties)
            {
                stepper = properties[p][0];
                if (now >= stepper.endTime)
                {
                    stepper.step(1);
                    animationDidComplete(actor, p);
                }
                else if (stepper.startTime <= now)
                {
                    t = (now-stepper.startTime)/stepper.totalTime;
                    stepper.step(t);
                }
            }
        }
        
        lastStep = now;
    }
    
    function animationDidComplete(actor, property)
    {
        var callbacks = [];
        var stepper = actor.properties[property].shift();
        
        if (stepper.shouldCleanup && stepper.cleanup)
            stepper.cleanup();
        
        if (stepper.callback)
            callbacks.push(stepper.callback);
        
        if (!actor.properties[property].length)
        {
            delete actor.properties[property];
            actor.propCount--;
        }
        
        if (!actor.propCount)
        {
            if (actor.callback)
                callbacks.push(actor.callback);
            delete(actors[actor.id]);
            actorCount--;
        }
        
        if (!actorCount)
            stopAnimator();
        
        // execute callbacks
        var callbackCount= callbacks.length;
        for (var c=0; c<callbackCount; c++)
            callbacks[c](actor.node, property);
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
                node: element,
                id: elementId,
                propCount: 0,
                properties: {}
            };
        }
        if (options.callback)
            actor.callback = options.callback;
        
        var groupStart= coherent.EventLoop.getStart();
        var groupEnd= groupStart + options.duration;
        var startStyles= options.startStyles || getStyles(element, Object.keys(hash));

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
            var discreteTransitionPoint = propertyEntry.discreteTransitionPoint || options.discreteTransitionPoint;
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
            var stepper= fx.getStepper(p, element, startStyles[p], value, cleanup);
            stepper.startTime= start;
            stepper.endTime= end;
            stepper.totalTime= end-start;
            stepper.curve= curve;
            stepper.discreteTransitionPoint= discreteTransitionPoint;
            
            if ('object'===typeof(propertyEntry) && 'callback' in propertyEntry)
                stepper.callback= propertyEntry.callback;
            
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
        
        //  Create a local copy of the options rather than using what was passed
        //  to the method, because we'll be changing some stuff.
        options = Object.applyDefaults(Object.clone(options), DEFAULTS);
        
        if (options.delay)
        {
            animateClassName.delay(options.delay, element, newClassName, options);
            delete options.delay;
            return;
        }
        
        if (!isNodeInDocument(element))
        {
            element.className= newClassName;
            if (options.callback)
                options.callback(element);
            return;
        }
        
        var propsToGet = options.only;
        // get old styles
        var startStyles = getStylesForTree(element, propsToGet, options.actions);
        
        // set className and clear any styles that we're currently animating on
        // to remove any conflicts with the new className
        var oldClassName = element.className;
        element.className = newClassName;
        
        for (var id in startStyles)
        {
            var actor= actors[id];
            if (!actor)
                continue;
            
            style= actor.node.style;
            for (var p in actor.properties)
                style[p]= '';
        }

        // get destination styles
        var endStyles = getStylesForTree(element, propsToGet, options.actions);
        element.className = oldClassName;

        /* If there is a callback supplied for this class transition, 
           move it to the classname property rather than the animation itself.
           This way, if the class transition is interrupted by another (without
           a callback) the original callback won't run.
        */
        var thingsToAnimate = {};
        thingsToAnimate[element.id]= {
            classname: {
                value: newClassName,
                duration: options.duration,
                callback: options.callback
            }
        };
        options.callback=null;
        
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
            if ("function"===typeof(nodeAction))
                nodeAction = nodeAction(node, startStyles, endStyles);
            
            if ('object'===typeof(nodeAction))
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
                    return (nodeAction & coherent.Animator.IGNORE_CHILDREN_MASK)?false:true;
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
    
    Object.extend(coherent.Animator, {
    
        /** Animate adding a class name to an element.
            @param {Element} element - The DOM element to animate.
            @param {String} className - The new class name to add to the element.
            @param {Object} [options] - Options for the animation.
         */
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
        
        /** Animate removing a class name from an element.
            @param {Element} element - The DOM element to animate.
            @param {String} className - The class name to remove from the element.
            @param {Object} [options] - Options for the animation.
         */
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

            animateClassName(element, elementClasses.join(" "), options);
        },

        /** Animate setting the class name for an element.
            @param {Element} element - The DOM element to animate.
            @param {String} className - The new class name for the element.
            @param {Object} [options] - Options for the animation.
         */
        setClassName: function(element, className, options)
        {
            var elementClassName= element.className;
            animateClassName(element, className, options);
        },
        
        /** Animate replacing one class name with another.
            @param {Element} element - The DOM element to animate.
            @param {String} oldClassName - The old class name that should be
                removed, may be null or empty.
            @param {String} newClassName - The new class name to add.
            @param {Object} [options] - Animation options.
         */
        replaceClassName: function(element, oldClassName, newClassName, options) 
        {
            if (oldClassName)
            {
                var regex = Element.regexForClassName(oldClassName);
                newClassName= element.className.replace(regex, "$1"+newClassName+"$2");
            }
            else
            {
                newClassName = element.className + ' ' + newClassName;
            }
            animateClassName(element, newClassName, options);
        },
        
        /** Animate changes to an element's class name. This method is very
            general purpose and permits adding and removing class names. In
            addition, the operation may be reversed by setting a flag in the
            options parameter.
            
            @param {Element} element - The DOM element that should be animated.
            @param {Object} options - A dictionary defining how the element
                should be modified.
         */
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
                    elementClasses= remove.reduce(_removeClassName, elementClasses);
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
    });
})();
