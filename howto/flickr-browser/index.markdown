---
title: Creating a Simple Flickr Photo Browser (Part 1)
layout: default
---

You can't really understand a new framework until you've dug in and created a real application. So let's build an application that allows visitors to browse photos belonging to a flickr user. In addition, it would be nice to allow visitors to navigate to other users listed as a flickr user's contacts.

* [Setting up](#setting_up)
* [Creating the data model](#create_data_model)
  * [User Model](#user_model)
  * [Photo Model](#photo_model)
* [Fetching users](#fetching_users)
* [Creating the UI](#create_ui)
{.toc}
  
## Setting up

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

## Creating the data model  {#create_data_model}

We're trying to build an application that browses photos by a particular flickr user and also allows visitors to navigate to photos of other flickr users marked as contacts. We'll need to create two data model classes: Person and Photo.

### User Model

When we request a flickr user's data, we get the following JSON returned:

    {
      "person": {
        "id": "51164044@N00",
        "nsid": "51164044@N00",
        "ispro": 0,
        "iconserver": "83",
        "iconfarm": 1,
        "path_alias": "jeffwatkins",
        "username": {
          "_content": "jeffwatkins"
        },
        "realname": {
          "_content": "Jeff Watkins"
        },
        "location": {
          "_content": "Seattle, WA, USA"
        },
        "photosurl": {
          "_content": "http:\/\/www.flickr.com\/photos\/jeffwatkins\/"
        },
        "profileurl": {
          "_content": "http:\/\/www.flickr.com\/people\/jeffwatkins\/"
        },
        "mobileurl": {
          "_content": "http:\/\/m.flickr.com\/photostream.gne?id=790583"
        },
        "photos": {
          "firstdatetaken": {
            "_content": "2009-01-17 12:33:05"
          },
          "firstdate": {
            "_content": "1232738682"
          },
          "count": {
            "_content": 200
          }
        }
      },
      "stat": "ok"
    }

This is some gnarly JSON, but that's what you get if you've specified XML first and use automatic translation into other formats. Fortunately, it's not too hard to convert this into something useful. Let's write a simple function in `src/js/flickr.js` to convert the JSON from flickr into something more useful:

{% highlight js %}
flickr.convertFlickrUserJson= function(userJson)
{
  return {
    id: userJson.id,
    iconserver: userJson.iconserver,
    iconfarm: userJson.iconfarm,
    username: Object.get(userJson, 'username._content'),
    realname: Object.get(userJson, 'realname._content'),
    location: Object.get(userJson, 'location._content'),
    photosUrl: Object.get(userJson, 'photosurl._content'),
    profileUrl: Object.get(userJson, 'profileUrl._content')
  };
}
{% endhighlight %}

Notice the use of `Object.get`. This function is kind of similar to `coherent.KVO#valueForKey`; it attempts to retrieve a property value by traversing the object graph. If `Object.get` encounters a `null` or `undefined` value, it will return `null` or `undefined`. This means you need to write considerably less error-handling code just to extract a simple value. After all, it's unlikely you're going to need to handle `userJson.realname==null` any different than `userJson.realname._content==null`.

Let's be good developers and write some tests, just to make certain we have what we expect. Create a file named `flickr-json-spec.js` in the project's `spec` folder. Add the following code:

{% highlight js linenos %}
/*jsl:import coherent*/

describe("evri.convertFlickrUserJson", function() {
  
  beforeEach(function(){
  
    this.USER= {
      "person": {
        "id": "51164044@N00",
        "nsid": "51164044@N00",
        "ispro": 0,
        "iconserver": "83",
        "iconfarm": 1,
        "path_alias": "jeffwatkins",
        "username": {
          "_content": "jeffwatkins"
        },
        "realname": {
          "_content": "Jeff Watkins"
        },
        "location": {
          "_content": "Seattle, WA, USA"
        },
        "photosurl": {
          "_content": "http:\/\/www.flickr.com\/photos\/jeffwatkins\/"
        },
        "profileurl": {
          "_content": "http:\/\/www.flickr.com\/people\/jeffwatkins\/"
        },
        "mobileurl": {
          "_content": "http:\/\/m.flickr.com\/photostream.gne?id=790583"
        },
        "photos": {
          "firstdatetaken": {
            "_content": "2009-01-17 12:33:05"
          },
          "firstdate": {
            "_content": "1232738682"
          },
          "count": {
            "_content": 200
          }
        }
      },
      "stat": "ok"
    };
    
  });
  
  it("should include id", function() {
    var json= evri.convertFlickrUserJson(this.USER);
    expect(json).toHaveProperty('id');
  });
  
});
{% endhighlight %}

On line 7, I'm defining a fixture for the test. It's my own User record from flickr. And starting on line 50, I'm writing tests against this data. In reality, you might want to write a few more tests, but I can't be bothered.

So let's define a data model for the flickr user:

{% highlight js linenos %}
flickr.User= Model("User", {

  id: String,
  username: String,
  realname: String,
  iconserver: String,
  iconfarm: Number,
  location: String,
  photosUrl: String,
  profileUrl: String,
  
  /**
    flickr.User#profileImageUrl() -> String
    
    Generate the url of the user's profile image based on the id, iconserver and 
    iconfarm properties. According to flickr, this has the following format:
    
    http://farm{icon-farm}.static.flickr.com/{icon-server}/buddyicons/{nsid}.jpg
   */
  profileImageUrl: function()
  {
    var id= this.id();
    var iconfarm= this.valueForKey('iconfarm');
    var iconserver= this.valueForKey('iconserver');
    return ['http://farm', iconfarm, '.static.flickr.com/', iconserver,
            '/buddyicons/', id, '.jpg'].join('');
  }
});
{% endhighlight %}

I'm putting this in a file named `User.js` in the `src/js/models` path. In lines 3-10, I'm using a shorthand notation to define properties of the User model: just listing the type of the property. This will work for any composite property, but if you want to specify a relation, you'll need more specific syntax (which we'll cover later).

Then on line 20, I'm defining a custom method to return the profile image URL for the User. This is a string composed of the User's `id`, `iconserver` and `iconfarm` properties. Because we don't plan to change any of these three values, this implementation is probably sufficient. But if any of these values could change, we'd want to let the model know how the properties depend on each other. We do this declaratively with `keyDependencies` as on line 3 in the full User model:

{% highlight js linenos %}
flickr.User= Model("User", {

  keyDependencies: {
    'profileImageUrl': ['id', 'iconserver', 'iconfarm']
  },
  
  id: String,
  username: String,
  realname: String,
  iconserver: String,
  iconfarm: String,
  location: String,
  photosUrl: String,
  profileUrl: String,
  
  /**
    flickr.User#profileImageUrl() -> String
    
    Generate the url of the user's profile image based on the id, iconserver and 
    iconfarm properties. According to flickr, this has the following format:
    
    http://farm{icon-farm}.static.flickr.com/{icon-server}/buddyicons/{nsid}.jpg
   */
  profileImageUrl: function()
  {
    var id= this.id();
    var iconfarm= this.valueForKey('iconfarm');
    var iconserver= this.valueForKey('iconserver');
    return ['http://farm', iconfarm, '.static.flickr.com/', iconserver,
            '/buddyicons/', id, '.jpg'].join('');
  }
  
});
{% endhighlight %}

We should really write some tests to make certain the `profileImageUrl` property is generated correctly. This is where I get to say: that's left as an exercise to the reader.

### Photo Model

When we ask flickr for a user's photos, the JSON is much cleaner than the user's profile:

    {
      "photos": {
        "page": 1,
        "pages": 20,
        "perpage": 10,
        "total": "200",
        "photo": [
          {
            "id": "5133515827",
            "owner": "51164044@N00",
            "secret": "b983eb2c07",
            "server": "4133",
            "farm": 5,
            "title": "Halloween 2010",
            "ispublic": 1,
            "isfriend": 0,
            "isfamily": 0,
            "datetaken": "2010-10-31 16:25:44",
            "datetakengranularity": "0"
          },
          // ... blah, blah, blah
        ]
      },
      "stat": "ok"
    }
    
There's really no need to write a clean up method for this data. We can jump right into defining a model for the Photo.

{% highlight js linenos %}
flickr.Photo= Model("Photo", {

  keyDependencies: {
    tinyImageUrl: ['id', 'secret', 'server', 'farm'],
    thumbnailImageUrl: ['id', 'secret', 'server', 'farm'],
    smallImageUrl: ['id', 'secret', 'server', 'farm'],
    mediumImageUrl: ['id', 'secret', 'server', 'farm'],
    largeImageUrl: ['id', 'secret', 'server', 'farm'],
    veryLargeImageUrl: ['id', 'secret', 'server', 'farm']
  },
    
  id: String,
  secret: String,
  server: String,
  farm: Number,
  title: String,
  datetaken: Date,

  tinyImageUrl: function()
  {
    return this.__tinyImageUrl ||
           (this.__tinyImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeTiny));
  },
  
  thumbnailImageUrl: function()
  {
    return this.__thumbnailImageUrl ||
           (this.__thumbnailImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeThumbnail));
  },

  smallImageUrl: function()
  {
    return this.__smallImageUrl ||
           (this.__smallImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeSmall));
  },

  mediumImageUrl: function()
  {
    return this.__mediumImageUrl ||
           (this.__mediumImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeMedium));
  },

  largeImageUrl: function()
  {
    return this.__largeImageUrl ||
           (this.__largeImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeLarge));
  },

  veryLargeImageUrl: function()
  {
    return this.__veryLargeImageUrl ||
           (this.__veryLargeImageUrl=this.urlOfImageWithSize(flickr.Photo.SizeVeryLarge));
  },
  
  /**
    flickr.Photo#urlOfImageWithSize(size) -> String
    
    * size(flick.Photo.Size): The constant identifying the size of the image
    
    This method creates a URL for the image with the specified size according to
    the general photo URL rule:
    
    http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}[_{size}].jpg
   */
  urlOfImageWithSize: function(size)
  {
    return ['http://farm', this.farm(), '.static.flickr.com/', this.server(),
            '/', this.id(), '_', this.secret(),
            (size!==flickr.Photo.SizeMedium ? '_'+size : ''),
            '.jpg'].join('');
  }
  
});

Object.extend(flickr.Photo, {

  SizeTiny: 's',
  SizeThumbnail: 't',
  SizeSmall: 'm',
  SizeMedium: '-',
  SizeLarge: 'z',
  SizeVeryLarge: 'b'
  
});
{% endhighlight %}

That might seem like a lot of lines for something pretty simple, but let's break it down a bit: lines 12 through 17 declare the properties for the Photo. On line 65, I declare a helper function to build URLs for the various sizes of the photo (constants defined on lines 77 through 82). Then there are custom methods to retrieve URLs for the various sizes of the photo (lines 19, 25, 31, 37, 43, and 49). Finally, I declare the inter-dependencies of the synthesized properties in `keyDependencies` on line 3.

Again, I should write some tests to make certain the various synthesized URLs work correctly, but I'll leave that as an exercise for the reader.

## Fetching Users

Now that we've defined our data model classes, it would be really nice to be able to fetch some data from flickr. Unfortunately, flickr tracks users via an opaque ID rather than by username or email address. This is good from a database standpoint, but bad from a convenience standpoint. But we can get around that pretty easily.

Let's define a simple `findByEmail` method for our User model. First we need to make an XmlHttpRequest (AKA XHR) for the user's ID. After we get that ID, we can make another XHR request for the actual user info.

Here's the code:

{% highlight js linenos %}
/**
  flickr.User.findByEmail(emailAddress) -> coherent.Deferred
  
  - emailAddress(String): the email address of the user we'd like to find
  
  Look up a user via his email address. This method returns an instance of
  coherent.Deferred and actually makes multiple calls to the flickr API behind
  the scenes.
 */  
flickr.User.findByEmail= function(emailAddress)
{
  //  Convert the flickr user profile JSON data into a User Model instance
  function oncompleteGetInfo(data)
  {
    var user= flickr.convertFlickrUserJson(data.person);
    return new flickr.User(user);
  }
  
  //  Kick off another XHR request with the ID to get the user's profile
  function oncompleteFindByEmail(data)
  {
    var id= Object.get(data, 'user.id');
    if (!id)
      return new Error("Could not find user");
      
    var d= XHR.get(flickr.API_URL, {
                   method: 'flickr.people.getInfo',
                   api_key: flickr.API_KEY,
                   user_id: id,
                   format: 'json'
                  }, flickr.XHR_OPTIONS);
    d.addCallback(oncompleteGetInfo);
    return d;
  }

  //  Kick off the first XHR request to look up the user's ID from his email address
  var d= XHR.get(flickr.API_URL, {
                  method: 'flickr.people.findByEmail',
                  api_key: flickr.API_KEY,
                  find_email: emailAddress,
                  format: 'json'
                }, flickr.XHR_OPTIONS);
  d.addCallback(oncompleteFindByEmail);
  return d;
}
{% endhighlight %}

The static method `findByEmail` will return a deferred value. This is based on the Deferred object from the Python Twisted library and from the Javascript Dojo library. When you receive a deferred value, you add a callback and (optionally) an error handler. This allows you to know when the operation has completed (or failed).

The meat of `findByEmail` begins on line 37. I start an XHR get request to the flickr API URL and pass the parameters for the method I want to call (`flickr.people.findByEmail`), my API key to let flickr know who is calling the method, the email address I'm looking for, and what format I want the response in. I also pass some default options for the XHR request. I add a callback to the deferred value returned from `XHR.get` and return the deferred value.

Typically, the result of each callback is passed to the next callback in the chain. That way, you can transform values and pass them along to other parts of your code. One of the tricky ways that deferred values can be used is shown in `oncompleteFindByEmail` on line 33: after kicking off a second XHR request to fetch the user's profile, I create a new deferred value, attach a callback handler (`oncompleteGetInfo`) and return the deferred value. Normally, the return value would be passed to the next callback handler in the chain, but in the case of return values that are themselves deferred values, the process waits until the new deferred value yields a concrete value.

After flickr looks up the user's profile and returns the JSON, our `oncompleteGetInfo` callback will be invoked. This function takes the raw JSON from flickr, transforms it via `flickr.convertFlickrUserJson` and creates a new User Model object. It then returns this User Model, which becomes the return value to the original deferred value created on line 37. The User Model object will be passed to any additional callbacks added to the original deferred value.

To see how this works, we should write a test. Create the file `spec/flickr-user-fetch-spec.js` and add it to the list of scripts to load in `spec/index.html`. Then add the following code:

{% highlight js linenos %}
describe("User model", function() {
  
  it("can find a user by email address", function() {
    function oncompleteFindByEmail(user)
    {
      this.user= user;
    }
    
    runs(function(){
      var d= flickr.User.findByEmail('jeff@metrocat.org');
      d.addCallback(oncompleteFindByEmail, this);
    });
    
    waits(2000);
    
    runs(function(){
      expect(this.user).toBeInstanceOf(flickr.User);
      expect(this.user.username()).toBe("jeffwatkins");
      expect(this.user.id()).toBe("51164044@N00");
    });
  });
  
});
{% endhighlight %}

This test calls the static method we just wrote to find the user by his email address. First on line 4, we declare our callback method: it simply accepts the returned user object and stashes it for later use. Next, on line 9, we execute the first part by calling the `flickr.User.findByEmail` method and adding a callback handler to the returned deferred value. On line 14, we wait for 2 seconds to allow the XHR requests to complete. Finally on line 16, we test the returned results.

## Creating the UI {#create_ui}

Now comes the fun part. Let's create a user picker screen that will be the first thing visitors see when they come to the photo browser application.

Open up your Main interface bundle (`src/nibs/Main.jsnib`) folder and edit the html file, `Main.html`. We're going to add a couple items: an `H1` element for our application title and an `input` element for the visitor's email address.

{% highlight html linenos %}
<div id="user-picker">
  <h1>Brows<em>r</em></h1>
  <input type="text">
</div>
{% endhighlight %}

By itself, this doesn't do much. So let's wire everything up in our interface bundle definition (`Main.js`).

{% highlight js linenos %}
NIB('Main', {

  'Main': VIEW({
  
    ':root': coherent.View({
      //  Set up necessary bindings and configuration information for your
      //  root view here.
    }),
    
    '#user-picker': coherent.View({
      animate: {
        visible: 500
      }
    }),
    
    '#user-picker input': coherent.TextField({
      placeholder: 'you@example.com',
      action: 'findUserByEmail',
      target: 'AppDelegate'
    })
    
  }),


  //  Instantiate your AppDelegate and configure it.
  AppDelegate: flickr.AppDelegate({
    //  Place configuration options for your application delegate here
    userPicker: REF('Main #user-picker')
  }),

  
  //  For the main interface bundle, the owner is the Application itself 
  owner:
  {
    //  Connect your AppDelegate to the Application as a delegate
    delegate: REF('AppDelegate')
  }
  
});
{% endhighlight %}

First we create views for the user picker. Line 10 declares a view for the `user-picker` element in the HTML. I've told the view to animate its visible property over 500ms. Line 16 creates a TextField for the `input` element with its target set to the AppDelegate and its action set to invoke the `findUserByEmail` method.

The last bit of new code is on line 28. This declares a reference to the view associated with the user picker element. The AppDelegate will use this reference to hide and show the user picker.

There's just a little bit more to do. We need to implement a couple methods in our AppDelegate class:

{% highlight js linenos %}
/**
  flickr.AppDelegate#findUserByEmail(sender)
  
  - sender(coherent.TextField): The text field that generated this action
  
  This method will call the flickr.User.findByEmail method to load the user
  with the given email address.
 */
findUserByEmail: function(sender)
{
  var email= sender.value();
  if (this.__email==email)
    return;
  this.__email= email;
  
  var d= flickr.User.findByEmail(email);
  d.addCallback(this.oncompleteFindUserByEmail, this);
  d.addErrorHandler(this.onfailedFindUserByEmail, this);
},

/**
  flickr.AppDelegate#oncompleteFindUserByEmail(user)
  
  - user(flickr.User): The user with the specified email address
  
  After loading the user associated with the specified email address, this
  method stores the user in the user property (duh) and hides the user picker
  view.
 */
oncompleteFindUserByEmail: function(user)
{
  this.setValueForKey(user, 'user');
  this.userPicker.setVisible(false);
},

/**
  flickr.AppDelegate#onfailedFindUserByEmail(error)
  
  - error(Error): The error object that should explain what went wrong.
  
  This method is a total cop-out. It ought to display a meaningful error
  message for the visitor, instead it does nothing except log the error to the
  console.
 */
onfailedFindUserByEmail: function(error)
{
  console.error("Failed to find user:", error);
}
{% endhighlight %}

(Note: don't forget to add a comma after the `hashDidChange` callback or you'll get syntax errors when you load your application.)

On line 9, we create the action method that will be called when the visitor hits return in the text field. The callback for successfully loading the user begins on line 30. I should probably do something clever like start loading the user's photos, but I need to leave **something** for the next instalment.

You should now have something that looks much like this:

<div>
<video src="assets/user-picker.mp4" controls="controls"/>
</div>

You do, don't you?
