/*jsl:import ../../ui.js*/
/*jsl:import ../app/Responder.js*/
/*jsl:import DragAndDropHelper.js*/

/** A View is wrapper for DOM nodes providing event responder and data model
    binding behaviour.

    Note: Views can define a container element (`this.container`) which is the
    _real_ container of its child nodes. For example, when using a View with
    a TABLE element, the container is usually set to the first TBODY. This
    allows you to specify something clever in the THEAD that doesn't get stomped
    on by the body content.

    ## Animation ##
    
    Views feature sophisticated built-in support for animating property
    transitions. For example, if a view should animate its transition from
    enabled to disabled, the view might be defined as follows:
    
        'myview': coherent.View({
                            animate: {
                                enabled: true
                            },
                            ...
                        })
    
    This would animate the transition from enabled to disabled over a duration
    of 200ms. By default, the animation would add the class defined in
    {@link coherent.Style.kDisabledClass} to the underlying DOM node associated
    with the view.
    
    @binding {Boolean} visible - Controls whether this view is visible or not.
        This binding updates the display style of the DOM node associated with
        the view. When the value of the binding is `false`, the display style is
        set to `none`. When the value of the binding is `true`, the display
        style is cleared.
        
    @binding {String} class - The `class` binding modifies the class property of
        the DOM node for this view. Any internal class names will be reapplied
        after changing the node's class name.
        
    @binding {Boolean} enabled - Is this view enabled? This is most useful for
        instances of {@link coherent.FormControl} which represent browser-native
        controls that may refuse input when disabled. In addition, custom
        controls can behave differently when enabled and disabled.
        
    @binding {Boolean} editable - Is the value of this view editable? Like the
        binding for `enabled`, the `editable` binding is most useful for 
        instances of {@link coherent.FormControl}, however, custom controls that
        allow editing values may also use this binding.
        
    @binding {String} html - The HTML content displayed within this view.
    @binding {String} text - The text content displayed within this view.
    @binding {String} toolTip - The text displayed when the visitor hovers the
        mouse over this view, provided the DOM node supports this behaviour.
    @binding {Any} argument - The second parameter value passed when invoking
        the action method on the target. This is useful for passing along a
        deeply nested data value that would be incovenient to retrieve in any
        other fashion.
    
 */
coherent.View= Class.create(coherent.Responder, {

    exposedBindings: ['visible', 'class', 'enabled', 'editable', 'html', 'text',
                      'toolTip', 'argument'],
    
    /** The default placeholder values for various bindings. Each entry should
        consist of an object literal with keys for `multipleValues`, `nullValue`,
        and `noSelection`.
     */
    defaultPlaceholders: {
        text: {
            multipleValues: _('marker.text.multipleValues'),
            nullValue: _('marker.text.placeholder'),
            noSelection: _('marker.text.noSelection')
        },
        html: {
            multipleValues: _('marker.text.multipleValues'),
            nullValue: _('marker.text.placeholder'),
            noSelection: _('marker.text.noSelection')
        }
    },
    
    /** @interface coherent.AnimationOptions The properties of an
        AnimationOptions dictionary control how animations of a view will be
        performed.
        
        @property {String} classname - The class name to add (or remove).
        @property {String} add - The class name to add. The `add` property will
            take precedence over the `classname` property if both are specified.
        @property {String} remove - The class name to remove. The `remove`
            property takes precedence over the `classname` property when both
            are specified and the animation is reversed.
        @property {Boolean} reverse - Should the direction of animation be
            reversed? When the animation is reversed, the sense of the values
            specified for `add` and `remove` is reversed: the class in `add` is
            removed from the node and the class in `remove` is added.
        @property {Number} duration - The number of milliseconds the animation
            should take from beginning to end. If this value is 0, the node is
            updated immediately and the callback method (if present) called.
        @property {Number} delay - The number of milliseconds to wait before
            starting the animation.
        @property {String[]} only - An array of CSS properties to animate. If
            no value is specified for `only`, then all CSS properties will be
            animated.
        @property {Number} discreteTransitionPoint - The point at which
            properties with discrete values will change. This value should be
            between 0 and 1. The default is 0.5.
        @property {Function} callback - A method which will be invoked when the
            animation has completed. If the animation is interrupted, the method
            will not be called.
        @property {Dictionary} actions - A dictionary specifying how individual
            nodes should be handled. The keys in this dictionary are IDs and the
            values should either be a {@link coherent.Animator.Action} or a
            animation action function.
     */
     
    /** The animation options for views. Entries in this dictionary represent
        properties (or property-like values) that should be animated. Each entry
        should be a dictionary with keys from {@link coherent.AnimationOptions}.
     */
    animationOptions: {
        'class': {},
        visible: {
            classname: coherent.Style.kFadingClass,
            reverse: true
        },
        enabled: {
            classname: coherent.Style.kDisabledClass,
            reverse: true
        },
        editable: {
            classname: coherent.Style.kReadOnlyClass,
            reverse: true
        },
        focus: {
            classname: coherent.Style.kFocusClass
        },
        text: {
            classname: coherent.Style.kUpdatingClass
        },
        html: {
            classname: coherent.Style.kUpdatingClass
        }
    },
    
    /** The default animation option values that will be used if a property
        doesn't specify a value for a particular key in the AnimationOptions
        dictionary. Presently, this specifies the default duration of all
        animations: 200ms.
        
        @type coherent.AnimationOptions
     */
    defaultAnimationOptions: {
        duration: 200
    },
    
    /** Reference to a coherent.Formatter instance that should be used for
        formatting the html/text value of this view.
        
        @type coherent.Formatter
     */
    formatter: null,
    
    /** The target of the action defined for this view. In Cocoa this appears on
        the NSControl class, but NSControl and NSView are somewhat blended here.
        
        @type Object
     */
    target: null,
    
    /** The action this view should send. In Cocoa this appears on the NSControl
        class, but NSControl and NSView are somewhat blended here. This should
        be a function/method reference or a string.
        
        @type Function|String
     */
    action: null,
    
    /** When should the action be sent? This should be the name of the event. */
    sendActionOn: ['click'],
    
    /** Construct a new View. Most view subclasses actually inherit this
        constructor.
        
        @param view - Either the ID of the node, the node itself, or `null` if
            the view should create all its own markup.
        @param [parameters=null] - A hash containing parameters for the view.

     */
    constructor: function(node, parameters)
    {
        if ((null===node || 'undefined'===typeof(node)) && this.markup)
        {
            this.node= coherent.View.createNodeFromMarkup(this.markup);
            this.id= Element.assignId(this.node);
        }
        else if ('string'===typeof(node))
        {
            this.id= node;
            this.node= document.getElementById(this.id);
            if (!this.node)
                throw new Error('Node not found for ID: ' + this.id);
        }
        else if (1===node.nodeType)
        {
            this.id= Element.assignId(node);
            this.node= node;
        }
        else
            throw new Error('Unexpected value for node: ', + node);
            
        if (this.id in coherent.View.viewLookup)
            throw new Error('Two views share the same ID: ' + this.id);

        this.node.object= this;
        
        coherent.View.viewLookup[this.id]= this;

        //  Handle factory and constructor formatter values
        if (this.formatter && 'function'===typeof(this.formatter))
        {
            if (this.formatter.__factoryFn__)
                this.formatter= this.formatter();
            else
                this.formatter= new (this.formatter)();
        }

        this.base(parameters);

        this.__createStructure();
    },

    __createStructure: function()
    {
        var node= this.node;
        var v;
        var p;


        //  generate structure if desired and there's no content in the view.
        if (this.innerHTML && ""===String(node.innerHTML).trim())
            node.innerHTML= this.innerHTML;

        
        //  re-jigger dataModel so that it points to this view
        var oldDataModel= coherent.dataModel;
        var oldContext= this.__context;
        coherent.dataModel= this.__context= this;


        //  process declarative structure and factory properties
        var structure= this.structure()||{};
    
        for (p in structure)
        {
            v= structure[p];
            if (v && 'function'==typeof(v) && (v=v.valueOf()).__factoryFn__)
                v.call(this, p);
        }
    
        //  restore original data model
        this.__context= oldContext;
        coherent.dataModel= oldDataModel;
    },
    
    /** Remove all observers for the bound attributes. Called when this View is
        destroyed, however, because Javascript hasn't got a destructor or finalise
        method, this must be called manually -- in the case of Web pages, on the
        unload event.
     */
    teardown: function()
    {
        for (var b in this.bindings)
            this.bindings[b].unbind();
        
        // Remove the object pointer from the node
        if (this.node)
            this.node.object= null;
        delete this.node;
        delete coherent.View.viewLookup[this.id];
    },
    
    __factory__: function(selector, parameters, container)
    {
        var klass= this;
        var findNodes= Element.queryAll;
        
        if ('string'!==typeof(selector))
        {
            container= parameters;
            parameters= selector;
            selector= null;
        }
        
        parameters= parameters||{};
        
        function setupNode(node)
        {
            var view= coherent.View.fromNode(node)||new klass(node, parameters);
            if ('action' in parameters && !parameters.target)
                view.target= this;
        }

        /**
            @param sel  When called by ListView to instantiate a template, sel
                        is a node.
                        When called during the processing of the __structure__
                        member, sel is a CSS selector.
                        When called for declarative members, sel is undefined
                        
            @param bindOnly When called by ListView, this will be the relative
                        source value.
                        When called during the processing of the __structure__
                        member, this will be true if the paramaters should be
                        attached to the node or false to actually create the
                        view.
                        When called for declarative members, bindOnly is undefined
         */
        return function(sel)
        {
            //  when called with a node, this is just an indirect method of 
            //  calling the constructor. This is used by the template support
            //  in ListView.
            if (sel && 1===sel.nodeType)
            {
                return new klass(sel, parameters);
            }
            
            var e= container||(this?this.node:document);
            var nodes= findNodes(e, selector||sel);
            if (!nodes.length)
                return null;
                
            Array.forEach(nodes, setupNode, this);
            
            return coherent.View.fromNode(nodes[0]);
        };
    },
    
    /** Initialise the view. This is always called after the DOM node associated
        with this view has been located. It's a good practice to make certain
        views always call their super class' init method.
     */
    init: function()
    {
    },

    /** Return the declarative structure of the View, where the keys are CSS
        selectors used to find the DOM nodes that should be attached to views.
        @type Object
     */
    structure: function()
    {
        return this.__structure__;
    },
    
    /** Return the view element
        @type Element
     */
    viewElement: function()
    {
        return this.node || document.getElementById(this.id);
    },

    /** Return the container element, which may be different from the view
        itself in lists or tables.
        @type Element
     */
    container: function()
    {
        return this.__container || this.node;
    },
    
    /** Set the container for the view.
        @param {Element} newContainer a reference to the new container node for the view
     */
    setContainer: function(newContainer)
    {
        this.__container= newContainer;
        return newContainer;
    },
    
    wrap: function(tagName, classname)
    {
        var node= this.node;
        var container= document.createElement(tagName||'span');
        container.classname= classname;
        
        node.parentNode.replaceChild(container, node);
        container.appendChild(node);
        return (this.__container= container);
    },
    
    /** Find the parent view in the DOM heirarchy...
        @type coherent.View
     */
    superview: function()
    {
        var node= this.node;
        if (!node)
            return null;
        
        var view= null;
        
        while (node && !view)
        {
            node= node.parentNode;
            if (!node)
                return null;
            if (document==node)
                return coherent.page;
            view= coherent.View.fromNode(node);
        }
        
        return view;
    },

    /** Determine whether this view is a decendant of the specified parent view.
        @param {coherent.View} parent - The view that should be tested to
            determine whether this view is a descendant.
        @type Boolean
     */
    isDescendantOf: function(parent)
    {
        if (!parent)
            return false;
            
        var parentNode= parent.node;
        var node= this.node;
        
        return Element.contains(parentNode, node);
    },
    
    /** Add a view as a child of this view. This simply calls appendChild on
        this view's DOM node with the DOM node of the subview.
        @param {coherent.View} subview - The view to add.
     */
    addSubview: function(subview)
    {
        var container= this.container();
        container.appendChild(subview.node);
    },

    /** Find the first view that matches the given CSS selector. If no views
        match the selector, this method returns `null`.
        @param {String} selector - A CSS selector rooted at the node for this
            view.
        @type coherent.View
     */
    viewWithSelector: function(selector)
    {
        var node= Element.query(this.node, selector);
        return coherent.View.fromNode(node);
    },
    
    /** The default value for nextResponder for a View is the super view.
        @type coherent.View
     */
    nextResponder: function()
    {
        return this.__nextResponder||this.superview();
    },
    
    /** Return the delegate associated with this view. Rather than subclass a
        view, it is often more appropriate to respond to the view's delegate
        methods.
        @see #setDelegate for a discussion of how this method __really__ works.
        @type Object
     */
    delegate: function()
    {
        return this.__delegate;
    },
    
    /** Set the delegate for this view. This method is a bit tricky, because the
        value for the delegate might be a string representing the name of the
        delegate in the view's context. However, there might not be a value for
        that key when this method is called. In that case, a temporary method
        will be installed to override {@link #delegate}. This temporary method
        will look up the name of the delegate and return that value. Once a
        delegate is found, the temporary method is removed and the value found
        will be returned immediately when calling {@link #delegate}.
        
        @param {Object|String} newDelegate - The value to use for the delegate.
     */
    setDelegate: function(newDelegate)
    {
        if ('string'!==typeof(newDelegate))
        {
            this.__delegate= newDelegate;
            return;
        }
        
        //  Need some extra trickery for string delegates...
        var delegate= this.__context && this.__context.valueForKey(newDelegate);
        if (delegate)
        {
            this.__delegate= delegate;
            return;
        }
        
        /*  The delegate wasn't found in the context yet... so create a
            temporary function which will look it up later. Note, the temporary
            function will delete itself and return the object to using the
            prototype delegate method.
         */
        this.delegate= function()
        {
            this.__delegate= (this.__context && this.__context.valueForKey(newDelegate));
            if (this.__delegate)
                delete this.delegate;
            return this.__delegate;
        }
    },
    
    /** Set the focus to the view.
     */
    focus: function()
    {
        this.node.focus();
    },
    
    /** Remove the focus from the view.
     */
    blur: function()
    {
        this.node.blur();
    },
    
    /** Retrieve the class name associated with this view.
        @type String
     */
    'class': function()
    {
        return this.node.className;
    },

    /** Modify the class name of this view. This method takes care to leave any
        theme class names in place. Principally this method is used to update
        the class based on model data rather than ui state. Changing UI state
        should be done via {@link #addClassName} or {@link #removeClassName}.
        
        The class name change will be animated according to the rules specified
        for the `class` property. Therefore to enable animations for changes to
        the `class` property, add the following to a View's paramters:
        
            animate: {
                'class': true
            }
        
        Or to set the duration of the animation to something other than the
        default 200ms value, use the following:
        
            animate: {
                'class': 500
            }
            
        Note: It is necessary to quote the property name, because `class` is a
        reserved word in ES3 and might cause problems for older browsers.
        
        It is also possible to specify a dictionary matching the
        {@link coherent.AnimationOptions} interface. This permits developers to
        have complete control over the animation process.
        
        @param {String} newClassName - the new class name to apply to this view.
     */
    setClass: function(newClassName)
    {
        var node= this.node;
        var originalClassName= node.className;
        var newClasses= $S((newClassName||"").split(" "));
        var prefixLen= coherent.Style.PREFIX.length;
        
        //  reset any state classes
        function reapplyStyle(classname)
        {
            if (classname.slice(0,prefixLen)===coherent.Style.PREFIX)
                Set.add(newClasses, classname);
        }
        originalClassName.split(" ").forEach(reapplyStyle);
        
        newClassName = Set.join(newClasses, ' ');
        
        if (newClassName===originalClassName)
            return;
            
        var animationOptions= this.__animationOptionsForProperty('class');
        if (animationOptions.duration)
            coherent.Animator.setClassName(node, newClassName, animationOptions);
        else
            node.className= newClassName;
    },
    
    addClassName: function(classname, animationOptions)
    {
        if (animationOptions)
            coherent.Animator.addClassName(this.node, classname, animationOptions);
        else
            Element.addClassName(this.node, classname);
    },
    
    removeClassName: function(classname, animationOptions)
    {
        if (animationOptions)
            coherent.Animator.removeClassName(this.node, classname, animationOptions);
        else
            Element.addClassName(this.node, classname);
    },
    
    animateClassName: function(animationOptions, reverse)
    {
        var hasReverse= ('reverse' in animationOptions);
        
        if (hasReverse)
        {
            var originalReverse= animationOptions.reverse;
            animationOptions.reverse= reverse?!animationOptions.reverse:animationOptions.reverse;
        }
        else
            animationOptions.reverse= !!reverse;
            
        coherent.Animator.animateClassName(this.node, animationOptions);

        if (!hasReverse)
            delete animationOptions.reverse;
        else
            animationOptions.reverse= originalReverse;
    },
    
    /** Send the action message to the target.
     */
    sendAction: function()
    {
        if (!this.action)
            return;

        var responder= this.target||this;
        
        /*  If the target is FIRST_RESPONDER (a string), then determine what is
            the current first responder. Otherwise, the initial responder is
            either the target or the current view if no target has been set.
         */
        if (FIRST_RESPONDER===responder)
            responder= coherent.page.firstResponder;
        else if ('string'===typeof(responder))
            responder= this.__context.valueForKeyPath(responder);

        var argument= this.argument||null;
        
        /*  When an explicit target is specified and the action is not a string,
            the action function can be invoked directly. There's no need (and no
            capactiy) to pass the action up the chain.
         */
        if ('string'!==typeof(this.action))
        {
            this.action.call(responder, this, argument);
            return;
        }
        
        var action= this.action;
        
        /*  Bubble the action up the responder chain. The first view that has a
            method corresponding to the action name will be the target responder.
         */
        while (responder)
        {
            if (action in responder)
            {
                responder[action](this, argument);
                return;
            }
            
            responder= responder.nextResponder();
        }
        
    },
    
    /** Default handler for the click event. If the view has been disabled, the
        click is canceled and ignored. If an action has been specified
        and the sendActionOn field contains "click", the view will send its
        action. Otherwise, processing will be passed to the superclass.
     */
    onclick: function(event)
    {
        if (this.disabled)
        {
            Event.stop(event);
            return;
        }

        if (!this.action)
        {
            this.base(event);
            return;
        }
        
        //  The view should only send the action when the sendActionOn "mask"
        //  contains the click event.
        if (this.sendActionOn.containsObject('click'))
            this.sendAction();
        Event.stop(event);
    },

    /** @name TrackingInfo
        @class This is an adhoc structure expected by {@link coherent.View#addTrackingInfo}.
        @memberOf coherent
        @property {Element} owner - The scope in which to invoke the callbacks
        @property {Function} onmouseenter - The callback to invoke when the mouse
            enters the view.
        @property {Function} onmouseleave - The callback to invoke when the mouse
            exits the view.
     */
     
    /** Add mouse tracking info for this view. The callbacks in trackingInfo are
        always called as methods on the owner.

        @param {coherent.TrackingInfo} trackingInfo - A structure containing
            information about the callbacks for mouse tracking.
     */
    addTrackingInfo: function(trackingInfo)
    {
        coherent.page.addTrackingInfo(this.id, trackingInfo);
    },

    __animationOptionsForProperty: function(property)
    {
        var options= this.animate && this.animate[property];
        var optionsType= typeof(options);
        
        if (!options)
            options= {
                duration: 0
            };
        else if ('boolean'===optionsType)
            options= {};
        else if ('number'===optionsType)
            options= {
                duration: options
            };
        else
            options= Object.clone(options);
        
        if (property in this.animationOptions)
            Object.applyDefaults(options, this.animationOptions[property]);
        else
            throw new Error("No default animation options specified for property: " + property);
            
        Object.applyDefaults(options, this.defaultAnimationOptions);
        
        return options;
    },
    
    __animatePropertyChange: function(property, options)
    {
        var node= this.node;
        var animationOptions= this.__animationOptionsForProperty(property);
        var animator= coherent.Animator;
        var _this= this;
                
        function cleanup()
        {
            options.cleanup.call(_this, node, animationOptions);
        }
        
        function update()
        {
            options.update.call(_this, node, animationOptions);
            animationOptions.reverse= !options.reverse;
            animationOptions.callback= options.cleanup?cleanup:null;
            animator.animateClassName(node, animationOptions);
        }

        function go()
        {
            if (options.setup)
                options.setup.call(_this, node, animationOptions);

            if ('reverse' in animationOptions)
            {
                if (options.reverse)
                    animationOptions.reverse= !animationOptions.reverse;
            }
            else
                animationOptions.reverse= !!options.reverse;

            if (options.update)
                animationOptions.callback= update;
            else
                animationOptions.callback= options.cleanup?cleanup:null;
            animator.animateClassName(node, animationOptions);
        }

        if (!animationOptions.duration)
            go();
        else
            go.delay(0);
    },

    visible: function()
    {
        return 'none'!==Element.getStyle(this.node, 'display');
    },
    
    setVisible: function(visible)
    {
        this.__animatePropertyChange('visible', {
                setup: function(node, options)
                {
                    if (!visible)
                        return;

                    if (options.duration)
                        Element.addClassName(node, options.classname||options.add);
                    node.style.display= "";
                },
                cleanup: function(node, options)
                {
                    node.style.display= visible?"":"none";

                    if (visible)
                        return;
                        
                    if (options.duration)
                        Element.removeClassName(node, options.classname||options.add);
                },
                reverse: !visible
            });
    },

    enabled: function()
    {
        return !this.node.disabled;
    },

    /** Enable or disable the view.
            
        When disabled, the view adds the `coherent.Style.kDisabledClass` to
        the nodes's class name. When enabled, this class is removed. Of course,
        the view also updates the nodes's disabled property.
        
        @param {Boolean} isEnabled - should the view be enabled or disabled
     **/
    setEnabled: function(isEnabled)
    {
        this.__animatePropertyChange('enabled', {
                reverse: !isEnabled,
                cleanup: function(node)
                {
                    node.disabled= !isEnabled;
                }
            });
    },

    editable: function()
    {
        return !this.node.readOnly;
    },
    
    setEditable: function(isEditable)
    {
        this.__animatePropertyChange('editable', {
                reverse: !isEditable,
                cleanup: function(node)
                {
                    node.readOnly= !isEditable;
                }
            });
    },

    text: function()
    {
        var node= this.node;
        return node.textContent||node.innerText;
    },
    
    setText: function(newText)
    {
        this.__animatePropertyChange('text', {
                update: function(node)
                {
                    node.innerHTML= "";
                    node.appendChild(document.createTextNode(newText));
                }
            });
    },
    
    /** Track changes to the text binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     */
    observeTextChange: function(change, keyPath, context)
    {
        var view= this.node;
        var binding= this.bindings.text;
        var markerType= binding && binding.markerType;
        var newValue= change.newValue;

        if (markerType)
        {
            if (null===newValue || 'undefined'===typeof(newValue))
                newValue="";
            Element.addClassName(view, coherent.Style.kMarkerClass);
        }
        else
        {
            Element.removeClassName(view, coherent.Style.kMarkerClass);
            if (this.formatter)
                newValue= this.formatter.stringForValue(newValue);
        }
        
        this.setText(newValue);
    },
    
    html: function()
    {
        return this.node.innerHTML;
    },
    
    setHtml: function(newHtml)
    {
        this.__animatePropertyChange('html', {
                update: function(view)
                {
                    view.innerHTML= newHtml;
                }
            });
    },
    
    /** Track changes to the html binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     */
    observeHtmlChange: function(change, keyPath, context)
    {
        var node= this.node;
        var binding= this.bindings.html;
        var markerType= binding && binding.markerType;
        var newValue= change.newValue;
        
        if (markerType)
        {
            if (null===newValue || 'undefined'===typeof(newValue))
                newValue="";
            Element.addClassName(node, coherent.Style.kMarkerClass);
        }
        else
        {
            Element.removeClassName(node, coherent.Style.kMarkerClass);
            if (this.formatter)
                newValue= this.formatter.stringForValue(newValue);
        }

        this.setHtml(newValue);
    },
    
    toolTip: function()
    {
        return this.node.title;
    },
    
    setToolTip: function(newTooltip)
    {
        var node= this.node;
        if (!newTooltip)
            node.removeAttribute('title');
        else
            node.title= newTooltip;
    },
    
    /** Use this method rather than calling the DOM removeChild method directly,
        because this will automatically teardown the outgoing node and give the
        view a chance to remove any event handlers.
        
        @parameter node     the node to remove from this view.
        @returns the node that was removed or null if the node is null.
     */
    removeChild: function(node)
    {
        if (!node)
            return null;
        coherent.View.teardownViewsForNodeTree(node);
        if (this.beforeRemoveElement)
            this.beforeRemoveElement(node);
        return node.parentNode.removeChild(node);
    },

    /** When this view is cloned, this method is called to set up any state that
        can't be inferred from the DOM.
        @param originalView   the view associated with the original DOM node.
     */
    clonedFrom: function(originalView)
    {
    },
    
    /** Register for drag types. */
    registerForDraggedTypes: function(dragTypes)
    {
        var types= dragTypes;
        if (1===arguments.length && 'string'===typeof(dragTypes))
            types= [dragTypes];
        else if (arguments.length>1)
            types= arguments;
            
        var len= types.length;
        
        if (!this.registeredDraggedTypes)
            this.registeredDraggedTypes= {};
        
        while (len--)    
            this.registeredDraggedTypes[types[len]]= true;
    },

    unregisterForDraggedTypes: function(dragTypes)
    {
        var types= dragTypes;
        if (arguments.length>1)
            types= arguments;
            
        var len= types.length;
        
        if (!this.registeredDraggedTypes)
            return;
            
        while (len--)
            delete this.registeredDraggedTypes[types[len]];
    },
    
    /** Kick-start the drag operation */
    dragElementWithOperationAndData: function(e, operation, data, offset, source)
    {
        var helper;
        var event= coherent.EventLoop.currentEvent;
        if (!coherent.page._mousedownView)
            throw new Error("Can't initiate a drag & drop operation except during dragstart event.");
        
        //  Remember who initiated the drag...    
        coherent.page._draggingSourceView= this;
        coherent.page._draggingData= data;
        
        if (coherent.Support.DragAndDrop)
        {
            var dt= event.dataTransfer;
            dt.clearData();
            dt.effectAllowed=operation;
            if (coherent.Browser.IE)
            {
                if (e)
                {
                    helper= coherent.page._dragging= new coherent.DragAndDropHelper();
                    helper.initFakeDragAndDrop(e, event);
                }
                
                if ('text/plain' in data)
                    dt.setData("Text", data["text/plain"]);
                if ('text/uri-list' in data)
                    dt.setData("URL", data["text/uri-list"]);
            }
            else
            {
                for (var p in data)
                    dt.setData(p, data[p]);

                var itemRect= Element.getRect(e);
                
                dt.setDragImage(e, event.pageX-itemRect.left,
                                   event.pageY-itemRect.top);
            }
        }
        else
        {
            helper= coherent.page._dragging= new coherent.DragAndDropHelper();
            helper.initFakeDragAndDrop(e, event);
            Event.preventDefault(event);
        }
    },
    
    /* NSDraggingSource equivalents */
    draggingEndedWithOperation: function(op)
    {
    },
    
    /* NSDraggingDestination equivalents */
    
    /** Return the acceptable drop operations for the view. Default is none. */
    draggingEntered: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'draggingEntered' in delegate)
            return delegate.draggingEntered(dragInfo);
        return "none";
    },
    
    draggingExited: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'draggingExited' in delegate)
            delegate.draggingExited(dragInfo);
    },
    
    /** Return the acceptable drop operations for the view. Default is none. */
    draggingUpdated: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'draggingUpdated' in delegate)
            return delegate.draggingUpdated(dragInfo);
        return null;
    },
    
    /** Return true if the view is willing to accept the drop. */
    prepareForDragOperation: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'prepareForDragOperation' in delegate)
            return delegate.prepareForDragOperation(dragInfo);
        return false;
    },
    
    /** Return true if the view was able to perform the drag. */
    performDragOperation: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'performDragOperation' in delegate)
            return delegate.performDragOperation(dragInfo);
        return false;
    },
    
    concludeDragOperation: function(dragInfo)
    {
        var delegate= this.delegate();
        if (delegate && 'concludeDragOperation' in delegate)
            delegate.concludeDragOperation(dragInfo);
    }
    
});

/** Lookup table matching node IDs to view instances */
coherent.View.viewLookup= {};

/** Handle special processing for subclasses of the View class. This method
 *  registers the view by name (via __viewClassName__ key) and sets up matching
 *  tag specifications (via __tagSpec__ key). Also combines any default
 *  bindings specified for the subclass with default bindings from the super
 *  class.
 */
coherent.View.__subclassCreated__= function(subclass)
{
    var proto= subclass.prototype;
    var baseproto= subclass.superclass.prototype;

    //  Allow inheritance of __structure__ definitions from base classes
    if (proto.__structure__!==baseproto.__structure__)
        Object.applyDefaults(proto.__structure__, baseproto.__structure__);
    if (proto.animationOptions!==baseproto.animationOptions)
        Object.applyDefaults(proto.animationOptions, baseproto.animationOptions);
    if (proto.markup && proto.markup instanceof coherent.Asset)
        proto.markup= proto.markup.content();
}

/** Lookup the View instance for a particular node.
 *  @param element  the node which may be associated with a view
 *  @returns {coherent.View} the view associated with the node or null if
 *           the node isn't associated with any views.
 */
coherent.View.fromNode= function(element)
{
    var lookup= coherent.View.viewLookup;
    var id = null;
    
    if (coherent.typeOf(element) == "string")
        id = element;
    else if ("id" in element)
        id = element.id;
    
    if (!lookup || !id || !lookup[id])
        return null;
    
    return lookup[id];
}

coherent.View.teardownViewsForNodeTree= function(node)
{
    function teardownNode(node)
    {
        var view= coherent.View.fromNode(node);
        if (!view)
            return;
        view.teardown();
    }

    Element.depthFirstTraversal(node||document.body, teardownNode);
}

coherent.View.addToHoldingArea= function(node)
{
    var holdingArea= coherent.View.__holdingArea;
    if (!holdingArea)
    {
        coherent.View.__holdingArea= holdingArea= document.createElement('div');
        holdingArea.style.position='absolute';
        holdingArea.style.left='-9999px';
        holdingArea.style.top='-9999px';
        holdingArea.style.width='0';
        holdingArea.style.height='0';
        holdingArea.style.overflow='hidden';
        holdingArea.id="coherent_holding_area";
        document.body.appendChild(holdingArea);
    }

    Element.assignId(node);
    holdingArea.appendChild(node);
}    


/** Create a node represented by the mark up. If markup contains more than one
    top-level node, this will only return the first.
 */
coherent.View.createNodeFromMarkup= function(markup)
{
    var incubator= coherent.View.__incubator;
    if (!incubator)
    {
        coherent.View.__incubator= incubator= document.createElement('div');
        incubator.style.position='absolute';
        incubator.style.left='-9999px';
        incubator.style.top='-9999px';
        incubator.style.width='0';
        incubator.style.height='0';
        incubator.style.overflow='hidden';
        incubator.id="coherent_incubator";
        document.body.appendChild(incubator);
    }
    
    incubator.innerHTML= String(markup).trim();
    
    var node= incubator.removeChild(incubator.firstChild);

    // put the new node in the holding area, this allows us to always fetch it
    // by ID.
    coherent.View.addToHoldingArea(node);
    
    return node;
}

Object.markMethods(coherent.View, 'coherent.View');