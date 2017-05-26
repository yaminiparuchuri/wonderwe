### Using Git ###

# We have 2 main branches: #
	1] 'develop' --> This is where we push new changes to once they are working.  This is the codebase for dev.wonderwe.com and qa.wonderwe.com
	
	2] 'master' --> This is the production code.  Only Venkat has the authority to merge code into this branch.  We will push to 'master' only once the code has been thoroughly tested on qa.wonderwe.com and on a regularly scheduled release day.
	 - If there is a bug fix or immediate need see 'Exceptions'

* Process for working on new code: *
	Go to the 'develop' branch --> 'git checkout develop'
	Pull all changes for all branches --> 'git pull --all'
	Create a new branch (replace 'mybranchname' with the name you want to add) --> 'git checkout -b mybranchname develop'

Now make changes to the code.  When you're ready to commit and push your changes then follow the below steps:

* Saving your changes: *
	Find out what files you modified, and see which branch you are on --> 'git status'
	Add the files to be committed ('.' will include all modified files, or you can add them individually) --> 'git add .'
	Commit your changes ('your message' is a note about what changes you made) --> 'git commit -m "your message" '
	Push the changes to your branch ('mybranchname' is the name of the branch you are on) --> 'git push origin mybranchname'

Now your changes are saved to the remote repository.  But they only exist for the branch you are on.  If they are working the way you want, then you should create a merge request so that your changes can be added to the 'develop' branch.  Here's how:

* Making a merge request: *
	Login to Gitlab (enter ) --> Go to http://gitlab.scriptbees.com
	Click on 'Merge Requests' --> Click on 'New Merge Request'
	On the left side select the branch you created, on the right side always select 'develop' --> Typye in a description for the merge and click 'submit merge request'
	Email Venkat to review the merge.  That's it!
	After the branch has been successfully merged it will be deleted.

* Exceptions *
	If you are just changing a style and want to see that go immediately to production.  Follow all the above steps except also submit a merge request to 'master' branch.  This should only be done for CSS changes as other changes might break the app.


