/*jsl:import View.js*/
coherent.FieldGroup= Class.create(coherent.View, {

    validateFields: function()
    {
        var fields= Element.queryAll(this.node, 'input,textarea');
        
        var len= fields.length;
        var f;
        var firstInvalidField;
        var validationResult;
        var valid= true;
        
        for (var i=0; i<len; ++i)
        {
            f= coherent.View.fromNode(fields[i]);
            if (!f)
                continue;
            
            if ('validate' in f)
            {
                validationResult= f.validate();
                
                if (validationResult instanceof coherent.Error)
                {
                    valid= false;
                    firstInvalidField= firstInvalidField || f;
                }
            }
        }
        
        if (firstInvalidField)
            firstInvalidField.focus();
            
        return valid;
    }
    
});
