/*jsl:import ../../ui.js*/


/** Placeholders are returned by the selection attribute for controllers when
    either there is no selection or there are multiple values selected.
    Note: These can't be objects (e.g. {}) because JavaScript tests for pointer
    equality when comparing objects and this doesn't work between frames.
    
    @namespace
 */
coherent.Markers= {

    /** Multiple different values are selected. */
    MultipleValues: "ThisIsAnUniqueStringThatRepresentsMultipleValues",
    /** There is no selection available. */
    NoSelection: "ThisIsAnUniqueStringThatRepresentsNoSelection"

};



/** A placeholder for the selection in an array controller. This proxy manages
    the multiple selection placeholders and such.
    
    @property {coherent.Controller} controller - A reference to the controller
        with which this SelectionProxy is associated.
    @property {Boolean} mutable - Whether this selection should be considered
        mutable.
 */
coherent.SelectionProxy= Class.create(coherent.KVO, {

    /** Construct a new SelectionProxy. This is only ever called by a Controller
        instance, so there's probably no reason to call this method.
        
        @param {coherent.Controller} controller - the controller owning the
            selection this proxy is managing.
     */
    constructor: function(controller)
    {
        this.controller= controller;
        this.mutable= true;
    },
    
    /** Override the default handling for {@link coherent.KVO#infoForKey}. This
        proxies to the selected objects for the infoForKey implementation.

        @param {String} key - the key for which the info is requested
        @type coherent.KeyInfo
     */
    infoForKey: function(key)
    {
        var selectedObjects= this.controller.selectedObjects();
        var keyInfo= selectedObjects.infoForKey(key);
        if (keyInfo)
            keyInfo.mutable &= this.mutable;
        return keyInfo;
    },

    /** Override the default handling for {@link coherent.KVO#infoForKeyPath}.
        This implementation proxies to the selected objects for the infoForKeyPath
        implementation.
        
        @param {String} keyPath - the path to the info requested
        @type coherent.KeyInfo
     */
    infoForKeyPath: function(keyPath)
    {
        var selectedObjects= this.controller.selectedObjects();
        var keyInfo= selectedObjects.infoForKeyPath(keyPath);
        if (keyInfo)
            keyInfo.mutable &= this.mutable;
        return keyInfo;
    },
    
    /** Translate an array of values into a MultipleValues marker if all the
        values are not the same.
        
        @param value - the array of values to compare
        @returns Either returns the original value or {@link coherent.Markers.MultipleValues}
     */
    translateValue: function(value)
    {
        if ("array"!==coherent.typeOf(value))
            return value;
    
        //  handle single element array
        if (1===value.length)
            return value[0];
        
        var i;
        var len= value.length;
        var v= value[0];

        //  use --len rather than len-- to skip index 0.
        while (--len)
        {
            if (0!==coherent.compareValues(v, value[len]))
                return coherent.Markers.MultipleValues;
        }
    
        return v;
    },

    /** Validate a proposed value change for a key. If there is no selection,
        the proposed value is valid (pointless, but valid). Otherwise, each object
        in the selection must validate the value. If any object returns an
        instance of {@link coherent.Error}, the value is considered invalid.
        
        @param value - the proposed value
        @param {String} key - the key of the property that should be validated.
        @returns The valid value or an instance of {@link coherent.Error}
     */
    validateValueForKey: function(value, key)
    {
        var selectedObjects= this.controller.selectedObjects();
        var len= selectedObjects.length;
        var i;
        
        if (0===len)
            return value;
        
        var validValue;
        while (len--)
        {
            validValue= selectedObjects[len].validateValueForKey(value, key);
            if (validValue instanceof coherent.Error)
                return validValue;
        }
        
        return validValue;
    },

    /** Validate a proposed value change for a keyPath. If there is no selection,
        the proposed value is valid (pointless, but valid). Otherwise, each object
        in the selection must validate the value. If any object returns an
        instance of {@link coherent.Error}, the value is considered invalid.
        
        @param value - the proposed value
        @param {String} keyPath - the key path to the property that should be
            validated.
        @returns The valid value or an instance of {@link coherent.Error}
     */
    validateValueForKeyPath: function(value, keyPath)
    {
        var selectedObjects= this.controller.selectedObjects();
        var len= selectedObjects.length;
        var i;
        
        if (0===len)
            return value;
        
        var validValue;
        while (len--)
        {
            validValue= selectedObjects[len].validateValueForKeyPath(value, keyPath);
            if (validValue instanceof coherent.Error)
                return validValue;
        }
        
        return validValue;
    },
    
    /** Retrieve the value for a specific key. If the collection of selected
        objects is empty, this method returns {@link coherent.Markers.NoSelection}.
        Otherwise, the value is passed to {@link #translateValue} to determine
        if all the values are the same.
        
        @param {String} key - the key for which the value is requested
        @returns The value of the key for the selected objects or a marker value.
     */
    valueForKey: function(key)
    {
        var selectedObjects= this.controller.selectedObjects();
        if (0===selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= selectedObjects.valueForKey(key);
        return this.translateValue(result);
    },

    /** Retrieve the value for a property at the specified key path. If the
        selection contains no objects, then valueForKeyPath will return
        {@link coherent.Markers.NoSelection}. Otherwise, this method retrieves
        the values from selected objects and calls {@link #translateValue} to
        make certain all values are the same.
        
        @param {String} keyPath - the path to the property to retrieve
        @returns The value for the property or a marker value.
     */
    valueForKeyPath: function(keyPath)
    {
        var selectedObjects= this.controller.selectedObjects();
        //  handle no selection placeholder
        if (0===selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= selectedObjects.valueForKeyPath(keyPath);
        return this.translateValue(result);
    },
    
    /** Set the value for a property with the specified key. If the selection
        is not mutable, this will silently fail. Otherwise, this sets the
        value on the selected objects.
        @param value - The new value for the property
        @param {String} key - The key for the property
     */
    setValueForKey: function(value, key)
    {
        if (!this.mutable)
            return;

        var selectedObjects= this.controller.selectedObjects();
        selectedObjects.setValueForKey(value, key);
    },
    
    /** Set the value for a property identified by keyPath. If the selection is
        not mutable, this method will silently fail. Otherwise, this sets the
        property on each of the selected objects.
        @param value - The new value for the property
        @param {String} keyPath - The path to the property
     */
    setValueForKeyPath: function(value, keyPath)
    {
        if (!this.mutable)
            return;
            
        var selectedObjects= this.controller.selectedObjects();
        selectedObjects.setValueForKeyPath(value, keyPath);
    }
});
