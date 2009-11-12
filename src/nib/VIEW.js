/*jsl:import ../views/View.js*/

function VIEW(content, structure)
{
    if ('object'===typeof(content))
    {
        structure= content;
        content= null;
    }

    function setupView(viewNode)
    {
        var view;

        if (!viewNode)
            viewNode= coherent.View.createNodeFromMarkup(content);

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
