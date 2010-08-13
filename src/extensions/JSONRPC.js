/*jsl:import ../foundation/net/XHR.js*/
/*jsl:declare JSONRPC*/
/*jsl:declare JSON*/

coherent.JSONRPC= function(method, url, parameters, options)
{
  options= Object.applyDefaults(options, JSONRPC.DEFAULTS);
  var deferred= XHR.request(method, url, parameters, options);
            
  deferred.addCallback(JSONRPC.__requestComplete);
  return deferred;
}

Object.extend(coherent.JSONRPC, {

  DEFAULTS: {
    sync: false,
    responseContentType: 'application/json'
  },

  get: function(url, parameters, options)
  {
    return JSONRPC('GET', url, parameters, options);
  },
  
  post: function(url, parameters, options)
  {
    return JSONRPC('POST', url, parameters, options);
  },

  postJSON: function(url, parameters, json, options)
  {
    options= Object.extend({ contentType: 'application/json' }, options);
    options.body= JSON.stringify(json);
    return JSONRPC('POST', url, parameters, options);
  },
  
  __requestComplete: function(response)
  {
    if (!response.head)
      return new Error('Invalid response format. Does not contain header block.');
  
    var status= parseInt(response.head.status,10);

    if (status>=300 && status<400)
    {
      JSONRPC.issueRedirect(response);
      return new Error('Response redirected');
    }
    else if (status>=400 && status<600)
    {
      var err= new Error(response.head.errorMessage);
      err.status= status;
      err.response= response;
      return err;
    }

    //  only pass the body along
    return response.body;
  },
  
  issueRedirect: function(response)
  {
    var url= response.head.location;
    var method= response.head.method;
    var target= response.head.target;
    var args= response.head.args;
  
    if ('post'===method)
      JSONRPC.issuePostRedirect(url, args, target);
    else
      JSONRPC.issueGetRedirect(url, args, target);
    
    return true;
  },
  
  issuePostRedirect: function(url, args, target)
  {
    //build the form
    var form = document.createElement("form");

    form.action = url;
    form.method = "post";
    if (target)
      form.target= target;
      
    //generate hidden
    var p;
    var v;
    var o= {};

    function createHidden(fn, key, value)
    {
      var tn = document.createElement("input");
      fn.appendChild(tn);
      tn.type = "hidden";
      tn.name = key;
      tn.value = value;
    }

    //loop over arguments and create hidden elements
    for (p in args)
    {
      v= args[p];
      //  skip properties defined on Object
      if (args[p]===o[p])
        continue;
      if (v instanceof Array)
        v.forEach(function(value) { createHidden(form, p, value); });
      else
        createHidden(form, p, v);
    }

    //  Firefox won't submit the form unless it is part of the DOM...
    form.style.position='absolute';
    form.style.visibility='hidden';
    form.style.height='0px';
    form.style.width='0px';
    document.body.appendChild(form);

    //send it
    form.submit();
  },

  issueGetRedirect: function(url, args, target)
  {
    if (!url)
      return;
    
    args= Object.toQueryString(args);

    if (args)
    {
      if (-1===url.indexOf('?'))
        url+= '?';
      else
        url+= '&';
      url+= args;
    }

    window.open(url, target?target:"_top");
  }
});

coherent.__export("JSONRPC");
