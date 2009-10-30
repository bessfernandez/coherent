/*jsl:import FormControl.js*/

/**
 *  @declare coherent.Slider
 *  @extends coherent.FormControl
 **/
coherent.Slider= Class.create(coherent.FormControl, {
    
    exposedBindings: ['minValue', 'maxValue'],
        
    /** Callback for tracking changes to the value binding. This method will
     *  disable the control if the value is undefined (meaning one of the
     *  objects along the key path doesn't exist). Additionally, the control
     *  will be set to readonly if the value binding isn't mutable or if the new
     *  value is one of the marker values (MultipleValuesMarker or
     *  NoSelectionMarker).
     *
     *  @param change   a ChangeNotification with the new value for the slider
     **/
    observeValueChange: function(change)
    {
        var view= this.viewElement();
        var newValue= change.newValue;

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);

        if (coherent.NoSelectionMarkerType===markerType)
            view.disabled= true;
        else if (!this.bindings.enabled)
            view.disabled= false;
    
        if (!this.bindings.editable)
            view.readOnly= !this.bindings.value.mutable();

        if (view.readOnly)
            Element.addClassName(view, coherent.Style.kReadOnlyClass);
        else
            Element.removeClassName(view, coherent.Style.kReadOnlyClass);

        if (view.disabled)
            Element.addClassName(view, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(view, coherent.Style.kDisabledClass);
                
        view.value= newValue;
    },
    
    onchange: function(event)
    {
        var view= this.viewElement();
        var value= parseInt(view.value,10);
        
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    minValue: function()
    {
        return parseInt(this.viewElement().getAttribute('min'),10);
    },

    setMinValue: function(minValue)
    {
        var view= this.viewElement();
        
        view.setAttribute('min',minValue);
        
        if (this.bindings.value) {
            var boundValue = this.bindings.value.value();
            
            if (boundValue > minValue)
                view.value = boundValue;
        }

    },
    
    maxValue: function()
    {
        return parseInt(this.viewElement().getAttribute('max'),10);
    },

    setMaxValue: function(maxValue)
    {
        var view= this.viewElement();
        
        view.setAttribute('max', maxValue);
        
        if (this.bindings.value) {
            var boundValue = this.bindings.value.value();
            
            if (boundValue < maxValue)
                view.value = boundValue;
        }
    }
    
});
