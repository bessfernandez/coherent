/*jsl:import ../views/View.js*/
/*jsl:import ../core/asset.js*/

function VIEW(markup, structure)
{
    if (1==arguments.length)
    {
        structure= markup;
        markup= null;
    }

    function setupView(viewNode)
    {
        var view;

        if (!viewNode)
        {
            if ("string"!==typeof(markup))
                markup= markup.content();
            viewNode= coherent.View.createNodeFromMarkup(markup);
        }
        
        var v;
        var p;

        if (':root' in structure)
        {
            v= structure[':root'];
            if (v && 'function'===typeof(v) && v.__factoryFn__)
                view= v.call(this, viewNode);
        }
        
        if (!view)
            view= new coherent.View(viewNode);
            
        for (p in structure)
        {
            if (':root'===p)
                continue;

            v= structure[p];
            if (!v || 'function'!==typeof(v) || !v.__factoryFn__)
                continue;

            v.call(view, p);
        }

        return view;
    }

    setupView.__factoryFn__= true;
    return setupView;
}
