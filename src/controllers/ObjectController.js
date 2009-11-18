/*jsl:import Controller.js*/
/*jsl:import SelectionProxy.js*/



/** An ObjectController manages a single object and reflects its selection and
    editable status.

    @property {Function} objectClass
        A reference to the constructor which should be used if the controller
        needs to create a new instance of the class it is managing.

    @binding {Boolean} editable
        Should the value exposed by this controller be editable? In addition to
        the option of setting this value via a call to {@link
        coherent.ObjectController#setEditable}, the value of the `editable`
        binding reflects the mutable status of the `content` binding.
    
    @binding {Object} content
        This is the object that this controller is managing.
        
  */
coherent.ObjectController= Class.create(coherent.Controller, {

    /** Create an instance of an ObjectController.
        
        @param {Object} [parameters] a general purpose has of parameters for
               this controller. Any values in this hash will be assigned to the
               constructed instance. For more info see {@link coherent.Bindable}.
     */
    constructor: function(parameters)
    {
        this.base(parameters);

        this.objectClass= coherent.KVO;
        this.__content= null;
        this.__editable= true;
        this.__selectedObjects= [];
        this.__selection= new coherent.SelectionProxy(this);
    },
    
    /** Perform magic to correctly reflect changes to the {@link #selectedObjects}
        as a change to the {@link #selection}. This could probably be a bit cleaner...
        
        @private
        
        @param {coherent.ChangeNotification} change - the property change
            notification
        @param {String} keyPath - the keypath relative to the child object not
            this object
        @param {String} context - the name of the child object that is changing
     */
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        this.base(change, keyPath, context);
        if ('selectedObjects'!==context)
            return;
            
        var selectionKeyPath= 'selection.' + keyPath;
        var newValue= this.valueForKeyPath(selectionKeyPath);
        var selectionChange= new coherent.ChangeNotification(this, coherent.ChangeType.setting,
                                                    newValue, null);
        this.notifyObserversOfChangeForKeyPath(selectionChange, selectionKeyPath);
    },
    
    exposedBindings: ["editable", "content"],
    
    /** Retrieve whether this content of this controller is editable. The content
        is editable if it was set directly (not via a binding) or if the bound
        content keyPath is editable.
      
        @type Boolean
     */
    editable: function()
    {
        var editable= this.__editable;
        
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();
        return editable;
    },

    /** Set the editable flag for this controller. Note, if the content is
        bound and isn't mutable, setting editable will have no real effect if
        the bound content isn't editable.
        
        @param {Boolean} editable - the new value for the editable property
     */
    setEditable: function(editable)
    {
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();

        if (this.bindings.editable)
            this.bingings.editable.setValue(editable);
        this.__editable= editable;
    },

    /** Retrieve the content for this controller. For ObjectControllers, this is
        just a single object. For subclasses, this may be an array or other
        data.
        
        @type Object
      */
    content: function()
    {
        return this.__content;
    },

    /** Set the content for this controller. The new content is automatically
        selected.
        
        @param newContent - the object for this Controller.
      */
    setContent: function(newContent)
    {
        if (this.bindings.content)
            this.bindings.content.setValue(newContent);

        this.__content= newContent;
        
        this.willChangeValueForKey('selectedObjects');
        if (!newContent)
            this.__selectedObjects= [];
        else
            this.__selectedObjects= [newContent];
        this.didChangeValueForKey('selectedObjects');
        //  The selection proxy will never actually change, so I need to force
        //  a change notification.
        this.forceChangeNotificationForKey('selection');
    },

    /** Retrieve the selected objects. For an ObjectController, this is always
        the single object being managed.
        @type Object[]
      */
    selectedObjects: function()
    {
        return this.__selectedObjects;
    },

    /** Retrieve a proxy for the selection. The selection proxy transforms
        multiple selections into a single object. When the selected objects have
        the same value for a key, the selection proxy will report that value.
        Otherwise, the selection proxy returns a special marker value.
        
        @type coherent.SelectionProxy
      */
    selection: function()
    {
        return this.__selection;
    }

});
