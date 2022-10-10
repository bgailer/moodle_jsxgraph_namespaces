# Namespaces for JSXGraph development in Moodle

## About this repository
This repository contains a JavaScript-file with multiple Namespaces that provide methods to interact with JSXGraph applets. There is also a CSS-file with styles for the namespace.

## Motivation
The namespaces are used in our project **IdeaL** to provide workarounds for current limitations due to our JSXGraph Version and to provide some utility-functions as well as factory-functions to create custom JSXGraph elements. This can be very useful in some cases, because you do not want to always include many lines of code for some functions that you use very often for your applets. For instance, our current JSXGraph Version has no support for Fullscreen or Responsiveness yet, what leads to some workarounds that have to be applied to all applets. To avoid the copy-paste, we decided to create this JavaScript-file with is grouped into several namespaces. This file is statically hosted with github pages so that we can include it with a simple script tag and style tag into our STACK questions. We plan to host these two files on our Moodle server in the future.


