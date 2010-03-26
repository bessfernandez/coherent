/*jsl:import ../core/../../foundation.js*/

var CancelledError= coherent.defineError('CancelledError');
var InvalidStateError= coherent.defineError('InvalidStateError');

(function (){

    var NOTFIRED= -1;
    var SUCCESS= 0;
    var FAILURE= 1;
    
    /** Any deferred value.
     */
    coherent.Deferred= Class.create({

        constructor: function(canceller)
        {
            this.canceller= canceller;
            this._result= null;
            this._status= NOTFIRED;
            this._callbacks= [];
        },
    
        _fire: function(result)
        {
            while (this._callbacks.length)
            {
                this._status= (result instanceof Error)?FAILURE:SUCCESS;
                this._result= result;
                
                var methods= this._callbacks.shift();
                var fn= methods[this._status];
                var scope= methods[2];
                if (!fn)
                    continue;
                
                result= fn.call(scope, result);
                if (result instanceof coherent.Deferred)
                {
                    result.addMethods(this._fire, this._fire, this);
                    return;
                }
            }

            this._status= (result instanceof Error)?FAILURE:SUCCESS;
            this._result= result;
        },
        
        result: function()
        {
            return this._result;
        },
        
        cancel: function()
        {
            if (NOTFIRED!==this._status)
                throw new InvalidStateError('Can not cancel Deferred because it is already complete');
            var cancelResult= (this.canceller && this.canceller());
            if (!(cancelResult instanceof Error))
                cancelResult= new CancelledError('Deferred operation cancelled');
            this.failure(cancelResult);
        },
        
        addMethods: function(newCallback, newErrorHandler, scope)
        {
            this._callbacks.push([newCallback, newErrorHandler, scope]);
            if (NOTFIRED===this._status)
                return this;
            this._fire(this._result);
            return this;
        },

        addCallback: function(newCallback, scope)
        {
            return this.addMethods(newCallback, null, scope);
        },
        
        addErrorHandler: function(newErrorHandler, scope)
        {
            return this.addMethods(null, newErrorHandler, scope);
        },
            
        callback: function(result)
        {
            if (NOTFIRED!==this._status)
                throw new InvalidStateError('Can not signal callback because Deferred is already complete: result=' + result);
            this._fire(result);
        },
    
        failure: function(error)
        {
            if (NOTFIRED!==this._status)
                throw new InvalidStateError('Can not signal failure because Deferred is already complete: error=' + error);
            this._fire(error);
        }

    });

})();