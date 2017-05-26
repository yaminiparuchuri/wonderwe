[cause-node] = backend server, nodeJS, sql queries
[knowledgebase] = nodeJS project [Raneto] for http://support.wonderwe.com (this project requires special setup to work on localhost)
[logos] = This can be ignored and should be deleted.  We used this for our initial import of 50 unclaimed organizations
[nodejobs] = batch process jobs that run on certain actions and at certain times
[Test] = unit testing.  If you change any javascript or html id/class be sure that the test is updated to reflect that change
[website] = this is the frontend, canJS, controllers, views, and models are here.  More on this below
[wonderwe-org] = this is the www.wonderwe.org static html website

# Cause-Node #
- package.json includes all the node modules that are used by app.js - You must run from terminal 'sudo npm install' to download the external modules in order for node to run
- sql-queries.xml is where all the mySQL queries exist.  This is used frequently for grabbing different data from the database

# website #
- We are using 'docpad' which means that the contents of 'src' folder will be converted to html and exported to the 'out' folder.  Be sure to change CSS And HTML from the 'styles' folder and 'layouts' folder respectively.
- out/js is where all of our javascript files are



## .mustache ##
Mustache is the template engine we use.  These files are saved in the website/out/js/views/ directory.  This is where all the HTML is stored and anytime you see {{user.name}} that is where it will spit out the data for that variable

## .scss ##
We don't use vanilla css, instead we use 'sass' and the files end in .scss   These style sheets are saved in the website/src/styles directory and then you can see we have dashboard.scss and public.scss   These two files have @import to include all the partials.  We have partials to keep our project more organized and easier to find specific styles instead of just having one giant scss file!

## .js ##
Most javascript you will use will be in the website/out/js/controllers directory.  This is where we take the endpoints and are able to manipulate them before exposes them to the .mustache templates.