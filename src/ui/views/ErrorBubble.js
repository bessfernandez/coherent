/*jsl:import Button.js*/
/*jsl:import Bubble.js*/
/*jsl:import CollectionView.js*/

/** A specialisation of the {@link coherent.Bubble} view that displays the
    contents of a {@link coherent.Error} object and offers buttons to attempt
    recovery form the error.
 */
coherent.ErrorBubble= Class.create(coherent.Bubble, {

    markup: '<div class="bubble"></div>',
    innerHTML: '<span class="chrome tl"></span><span class="chrome tr"></span><span class="chrome top"></span><span class="chrome left"></span><span class="chrome right"></span><span class="chrome bottom"></span><span class="chrome bl"></span><span class="chrome br"></span><a href="#" class="close">close</a><span class="chrome center"></span><div class="container"><div class="content"></div><ul class="buttons"><li><button></button></li></ul></div><span class="chrome arrow"></span>',

    __structure__: {
        '.buttons': coherent.CollectionView({
                            visibleBinding: 'recoveryOptions',
                            contentBinding: 'recoveryOptions',
                            action: 'recoveryButtonClicked',
                            viewTemplate: VIEW({
                                    'button': coherent.Button({
                                            textBinding: 'representedObject.text'
                                        })
                                })
                        })
    },
    
    error: function()
    {
        return this.__error;
    },
    
    setError: function(newError)
    {
        this.__error= newError;
    },
    
    updateContent: function()
    {
        if (!this.__error)
            return;

        var error= this.__error;
        var container= this.container();
        var textnode;

        textnode= document.createTextNode(error.description);
        container.innerHTML="";
        container.appendChild(textnode);
        
        if (error.recoveryOptions && error.recoveryAttempter)
        {
            function makeOptionKVO(o)
            {
                var kvo= new coherent.KVO();
                kvo.text= o;
                return kvo;
            }
            
            var options= error.recoveryOptions.map(makeOptionKVO);
            this.setValueForKey(options, 'recoveryOptions');
        }
    }

});
