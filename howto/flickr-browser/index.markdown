---
title: Creating a Simple Flickr Photo Browser
layout: default
---

The first thing you'll want to do is create a new application. In your shell, type the following:

    > coherent app flickr
    
This will generate an application skeleton for the flickr application we're going to build. You should see something like the following:

    create  
    create  src
    create  spec
    exists  .
    exists  spec
    create  spec/jasmine-1.0.1
    create  spec/jasmine-dom
    create  src/css
    exists  src
    create  src/js
    create  src/nibs/Main.jsnib
    create  flickr.jsproj
    create  spec/index.html
    create  spec/jasmine-1.0.1/jasmine-html.js
    create  spec/jasmine-1.0.1/jasmine.css
    create  spec/jasmine-1.0.1/jasmine.js
    create  spec/jasmine-1.0.1/MIT.LICENSE
    create  spec/jasmine-dom/jasmine-dom-fixtures.js
    create  spec/jasmine-dom/jasmine-dom-matchers.js
    create  spec/spec-helpers.js
    create  src/css/flickr.css
    create  src/css/reset.css
    create  src/index.html
    create  src/js/flickr.js
    create  src/js/AppDelegate.js
    create  src/nibs/Main.jsnib/Main.css
    create  src/nibs/Main.jsnib/Main.html
    create  src/nibs/Main.jsnib/Main.js
    create  src/NOTICE

Fire up your favourite text editor (like [TextMate](http://macromates.com/)) and take a look at what's there. If you're like me, you'd rather see it in action. Head back to your command line and type:

    > distil server
    
This will fetch the coherent source code, build your application, and launch your favourite browser to view the application. You should see something like this:

![First run](assets/first-startup.png)

Certainly not the most exciting thing you've ever seen I'd bet. If you watch closely — and you might need to clear your cache to see it — there's a brief flash of content that indicates the application is loading. Open up the `index.html` file from the project's `src` folder. You'll see the following:

{% highlight html %}
<noscript>
  This application requires a browser with Javascript enabled.
</noscript>
<div class="ui-startup">
  Please wait, this application is loading resources&hellip;
</div>
{% endhighlight %}

First, if the visitor has disabled Javascript, we'll provide a brief error message. The plan is to provide a link to a nice set of instructions on how to enable Javascript for each supported browser. Next is a simple `DIV` with the class `ui-startup` that will display a message while your application is loading resources. This can be as simple or complex as you'd like, but anything you add to this page will need to be loaded first, before the rest of your application's resources. So keeping this light weight is a good idea.

