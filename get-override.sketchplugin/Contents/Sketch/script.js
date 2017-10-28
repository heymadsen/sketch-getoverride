//Let's import the library that allows us to talk with the UI
@import "MochaJSDelegate.js";

function onRun(context) {
  //Since the webview can talk with Sketch, we have a function to update the context
  //as needed to make sure we have the correct context when we apply changes
  //the updateContext function is in utils.js
  var doc = updateContext().document;

  var userDefaults = NSUserDefaults.standardUserDefaults();

  // Create a window
  var title = "webview-template";
  var identifier = "com.getoverride";
  var threadDictionary = NSThread.mainThread().threadDictionary();


  var layer = context.selection[0];
  var overridesNames = []
  var idStack = []
  var nameStack = []
  var overridesObj = [{}]
  var itr = 0
  function getOverridesWithNames (symbolInstance)
  {
    var parentLayers = symbolInstance.symbolMaster().children()
    for (var i = 0 ; i< parentLayers.count();i++)
          {
              if (parentLayers[i].class() == MSSymbolInstance)
                  {
                    var idwithNameObject = {}
                    nameStack.push(String(parentLayers[i].name()))
                    idStack.push(String(parentLayers[i].objectID()))
                    var tempObj = {}
                    tempObj["name"] = nameStack.slice(0);
                    tempObj["ID"] = idStack.slice(0);
                    overridesObj[itr] = tempObj;
                    getOverridesWithNames(parentLayers[i])
                    nameStack.pop()
                    idStack.pop()
                  }
              else if(parentLayers[i].class() == MSTextLayer){
                    nameStack.push(String(parentLayers[i].name()))
                    idStack.push(String(parentLayers[i].objectID()))
                    //log("fromText")
                    //log(nameStack)
                    var tempObj = {}
                    tempObj["name"] = nameStack.slice(0);
                    tempObj["ID"] = idStack.slice(0);
                    overridesObj[itr] = tempObj;
                    nameStack.pop()
                    idStack.pop()
                    itr ++;
              }

          }
        //log(overridesObj)
  }



  function setOverridesbyIndex(index,value)
  {
    log(overridesObj[index]["ID"])
    var obj = mergeIDs(overridesObj[index]["ID"],0,value)
    log(obj)
    return obj
  }

  function mergeIDs (arr,index,value){
    var obj = {}
    if (Object.keys(arr).length > 1 && Object.keys(arr).length - 1 >index){
      var tempArr = arr[index]
      log("hereeeeeeee")
      index++
      obj[tempArr] = mergeIDs (arr,index,value)
    } else {
      log("hereeeeeee22222e")
      var tempArr = arr[index]
      obj[tempArr] = value
    }
    return obj
  }


  function changerOverriderBylayerName (symbolInstance,layerNameAndId , value)
  {
    var parentLayers = symbolInstance.symbolMaster().children()
    for (var i = 0 ; i< parentLayers.count();i++)
          {
              if (parentLayers[i].class() == MSSymbolInstance)
                  {
                    var idwithNameObject = {}
                    getOverridesWithNames(parentLayers[i])
                  }
              else if(parentLayers[i].class() == MSTextLayer){
                var idwithNameObject = {}
                if (layerNameAndId.name == parentLayers[i].name() && layerNameAndId.id == parentLayers[i].objectID())
                {
                  log(parentLayers[i].overrides[parentLayers[i].objectID()])
                  parentLayers[i].overrides[parentLayers[i].objectID()] = value
                }
              }
          }
  }



  function merge_options(obj1,obj2){
      var obj3 = {};
      for (var attrname in obj1) {
          obj3[attrname] = obj1[attrname];
      }
      for (var attrname in obj2) {
          if ( obj3[attrname] == undefined || Object.keys(obj3[attrname]).length === 0)
              {
                  obj3[attrname] = obj2[attrname];
              }
          else
              {
                  obj3[attrname] = merge_options(obj3[attrname],obj2[attrname])
              }
      }
      return obj3;
  }

  function updateSymboleInstance (instance,selection){
      if (context.selection.count() == 0)
          {
              doc.showMessage("No layer selected, Please select symbol instance layer");
          }
      else if (context.selection.count() == 1 && context.selection[0].class() == MSSymbolInstance ) {
              log(instance)
              log(selection.overrides())
              var newOverrides = merge_options (instance,selection.overrides())
              log(newOverrides)
              selection.overrides = newOverrides;
              doc.showMessage("you symbol instance updated 😎");
      }
      else if (context.selection.count() < 1){
          doc.showMessage("You are selecting multiple layers, Please select only 1 symbol instance layer that has overrides");
      }
      else {
          doc.showMessage("layer selected doesn't have overrides, Please select only 1 symbol instance layer that has overrides");
      }
  }




  getOverridesWithNames(layer)
  log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log(overridesObj)
  log(JSON.stringify(overridesObj))

  if (threadDictionary[identifier]) {
        return;
  }

  var windowWidth = 600,
        windowHeight = 450;
    var webViewWindow = NSPanel.alloc().init();
    webViewWindow.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), true);
    webViewWindow.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask);

    //Uncomment the following line to define the app bar color with an NSColor
    //webViewWindow.setBackgroundColor(NSColor.whiteColor());
    webViewWindow.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    webViewWindow.standardWindowButton(NSWindowZoomButton).setHidden(true);
    webViewWindow.setTitle(title);
    webViewWindow.setTitlebarAppearsTransparent(true);
    webViewWindow.becomeKeyWindow();
    webViewWindow.setLevel(NSFloatingWindowLevel);
    threadDictionary[identifier] = webViewWindow;
    COScript.currentCOScript().setShouldKeepAround_(true);

    //Add Web View to window
      var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, windowWidth, windowHeight - 24));
      webView.setAutoresizingMask(NSViewWidthSizable|NSViewHeightSizable);
      var windowObject = webView.windowScriptObject();

      var delegate = new MochaJSDelegate({

          "webView:didFinishLoadForFrame:" : (function(webView, webFrame) {
              //We call this function when we know that the webview has finished loading
              //It's a function in the UI and we run it with a parameter coming from the updated context
              //windowObject.evaluateWebScript("updateInput("+updateContext().document.currentPage().artboards().count()+")");
              windowObject.evaluateWebScript("updateInput("+JSON.stringify(overridesObj)+")");

          }),


          //To get commands from the webView we observe the location hash: if it changes, we do something
          "webView:didChangeLocationWithinPageForFrame:" : (function(webView, webFrame) {
              var locationHash = windowObject.evaluateWebScript("window.location.hash");
              //The hash object exposes commands and parameters
              //In example, if you send updateHash('add','artboardName','Mark')
              //You’ll be able to use hash.artboardName to return 'Mark'
              var hash = parseHash(locationHash);
              log(hash);
              //We parse the location hash and check for the command we are sending from the UI
              //If the command exist we run the following code
              if (hash.hasOwnProperty('update')) {
                //In example updating the artboard count based on the current contex.
                //The evaluateWebScript function allows us to call a function from the UI.html with parameters
                //coming from Sketch
                // windowObject.evaluateWebScript("updateInput("+updateContext().document.currentPage().artboards().count()+");");
                windowObject.evaluateWebScript("updateInput("+JSON.stringify(overridesObj)+")");

              } else if (hash.hasOwnProperty('addArtboard')) {
                //If you are sending arguments from the UI
                //You can simply grab them from the hash object
                artboardName = hash.artboardName;
                artboard = MSArtboardGroup.new();
                frame = artboard.frame();
                frame.x = 0;
                frame.y = 0;
                frame.setWidth(100);
                frame.setHeight(100);
                artboard.setName(artboardName);
                doc.currentPage().addLayers([artboard]);

              } else if (hash.hasOwnProperty('buttonPressed')) {
                //If you are sending arguments from the UI
                //You can simply grab them from the hash object
                index = hash.index;
                override = hash.override;

                var addOverrides = setOverridesbyIndex(index, override)
                updateSymboleInstance(addOverrides,layer)
              } else if (hash.hasOwnProperty('close')) {
                //We can also call commands on the window itself, like closing the window
                //This can be run aftr other commands, obviously
                threadDictionary.removeObjectForKey(identifier);
                webViewWindow.close();
              }

          })
      });

      webView.setFrameLoadDelegate_(delegate.getClassInstance());
      webView.setMainFrameURL_(context.plugin.urlForResourceNamed("ui.html").path());
      webViewWindow.contentView().addSubview(webView);
      webViewWindow.center();
      webViewWindow.makeKeyAndOrderFront(nil);
      // Define the close window behaviour on the standard red traffic light button
      var closeButton = webViewWindow.standardWindowButton(NSWindowCloseButton);
      closeButton.setCOSJSTargetFunction(function(sender) {
          COScript.currentCOScript().setShouldKeepAround(false);
          threadDictionary.removeObjectForKey(identifier);
          webViewWindow.close();
      });
      closeButton.setAction("callAction:");
  };

  //Utility functions
  function updateContext() {
      var doc = NSDocumentController.sharedDocumentController().currentDocument();

      return {
          document: doc
      }
  }

  function getTitleFromHandler(handler) {
      for (var i = 0; i < swatches.length; i++) {
          if (swatches[i].handler == handler) {
              return swatches[i].title;
          }
      }
  }

  function parseHash(aURL) {
    aURL = aURL;
    var vars = {};
    var hashes = aURL.slice(aURL.indexOf('#') + 1).split('&');

      for(var i = 0; i < hashes.length; i++) {
         var hash = hashes[i].split('=');

         if(hash.length > 1) {
           vars[hash[0].toString()] = hash[1];
         } else {
          vars[hash[0].toString()] = null;
         }
      }

      return vars;
  }
