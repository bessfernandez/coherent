/*jsl:import FormControl.js*/

/** Basic support for buttons
 */
coherent.Button= Class.create(coherent.FormControl, {

    onmousedown: function(event)
    {
        var node= this.node;
        Element.addClassName(node, coherent.Style.kActiveClass);
    },

    onmouseup: function(event)
    {
        var node= this.node;
        Element.removeClassName(node, coherent.Style.kActiveClass);
    }
    
});
