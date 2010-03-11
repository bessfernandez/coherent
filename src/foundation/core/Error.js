/*jsl:import ../../foundation.js*/
/*jsl:import local.js*/

/** Base class for all recoverable errors used in Coherent. Typically, you create
    an error using an object literal with the values you'd like to override:
    
        var error= new coherent.Error({
                        description: "Could not contact server.",
                        recoverySuggestion: "Please, check your network connection.",
                        recoveryOptions: ["Try Again", "Cancel"],
                        recoveryAttempter: function(error, index)
                        {
                            ...
                        }
                    })
    
    There's really no need to ever sub-class an Error, since you can add extra
    properties via the object literal used to construct it.
 */
coherent.Error= Class.create({

    /** Construct the error instance from an object literal.
        @param {Object} details - an arbitrary hash of key/value pairs that will
            be copied to the Error instance.
     */
    constructor: function(details)
    {
        Object.extend(this, details);
    },
    
    /** The description of the error. This probably should be a localised string
        using the {@link _} function.
        @type String
     */
    description: _('error.no_description'),
    
    /** An optional recovery suggestion. This is typically rendered in smaller
        type below the error description. This should also be a localised string
        using the {@link _} function.
        @type String
     */
    recoverySuggestion: null,
    
    /** An array of recovery options. These are used as the labels for buttons
        displayed when presenting the error to the visitor. Naturally, these
        should also be localised strings using the {@link _} function.
        @type String[]
     */
    recoveryOptions: null,
    
    /** A function reference that will be called when the visitor attempts to
        recover from an error. This function will receive a reference to the
        original error and the index of the recovery option chosen.
        
        @type Function
        @param error - The original error object
        @param index - The index of the recovery option chosen.
     */
    recoveryAttempter: null
    
});
