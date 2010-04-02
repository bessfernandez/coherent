# Get Started

Subversion or git are nice, but if you just want to build the next great Web application, code generation is the answer. You can install the coherent Ruby gem and start right away.

    sudo gem install coherent

This will automatically install the distil gem as a dependency. First you should probably generate the gallery demo. Type the following in a folder where you keep your projects:

    coherent demo gallery sample
    
This will generate a fully functional miniature photo gallery. Granted, you'll have to look at photos of my daughter, but it's worth it since she's so cute.

Now you can build your application by running `distil`. The first thing you'll notice is that Distil checks out the Coherent source code into the `ext/coherent` folder. You can always update that folder so you're tracking the latest and greatest version of the library.

Point your favourite browser at the `build` folder and it should load a page that looks like the following:

<div style="margin: 0 auto; width:336px;">
<img src="http://coherentjs.org/wordpress/wp-content/uploads/2009/12/CoherentSampleGallery.png" alt="" title="Coherent Sample Gallery" width="336" height="290">
</div>

## Building An App Skeleton

Chances are you won't be content to stare at pictures of my daughter all day long. You probably want to build your **own** project. Back up to your projects folder and type:

    coherent app first-app
    cd first-app
    distil

Just like the gallery demo, this will generate the app and build it. If you open the `build` folder in your browser, you won't see anything terribly exciting. But now you're ready to go.

## Installing Plug Ins

So I borrowed the code from Ruby on Rails to handle plug ins. At the moment, there isn't much except some additional controls. But you can install those by typing the following in your project folder:

    coherent plugin install controls

This will build a folder named `controls` in the `vendor/plugins` folder. The controls plugin includes various extras including a view that wraps Google Maps, a date picker, and a fancy sliding track view.

There will be more controls and more plugins in the future.