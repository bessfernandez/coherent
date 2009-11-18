/*jsl:import FormControl.js*/

/**
 **/
coherent.Slider= Class.create(coherent.FormControl, {
    
    exposedBindings: ['minValue', 'maxValue'],
        
    /** Callback for tracking changes to the value binding. This method will
        disable the control if the value is undefined (meaning one of the
        objects along the key path doesn't exist). Additionally, the control
        will be set to readonly if the value binding isn't mutable or if the new
        value is one of the marker values (MultipleValuesMarker or
        NoSelectionMarker).
      
        @param change   a ChangeNotification with the new value for the slider
      */
    observeValueChange: function(change)
    {
        var node= this.node;
        var newValue= change.newValue;

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);

        if (coherent.NoSelectionMarkerType===markerType)
            node.disabled= true;
        else if (!this.bindings.enabled)
            node.disabled= false;
    
        if (!this.bindings.editable)
            node.readOnly= !this.bindings.value.mutable();

        if (node.readOnly)
            Element.addClassName(node, coherent.Style.kReadOnlyClass);
        else
            Element.removeClassName(node, coherent.Style.kReadOnlyClass);

        if (node.disabled)
            Element.addClassName(node, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(node, coherent.Style.kDisabledClass);
                
        node.value= newValue;
    },
    
    onchange: function(event)
    {
        var value= parseInt(this.node.value,10);
        
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    minValue: function()
    {
        return parseInt(this.node.getAttribute('min'),10);
    },

    setMinValue: function(minValue)
    {
        var node= this.node;
        
        node.setAttribute('min',minValue);
        
        if (this.bindings.value) {
            var boundValue = this.bindings.value.value();
            
            if (boundValue > minValue)
                node.value = boundValue;
        }

    },
    
    maxValue: function()
    {
        return parseInt(this.node.getAttribute('max'),10);
    },

    setMaxValue: function(maxValue)
    {
        var node= this.node;
        
        node.setAttribute('max', maxValue);
        
        if (this.bindings.value) {
            var boundValue = this.bindings.value.value();
            
            if (boundValue < maxValue)
                node.value = boundValue;
        }
    }
    
});
