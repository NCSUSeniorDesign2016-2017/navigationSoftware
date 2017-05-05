# CNS Reports

## Description

A simple HTML front-end for accessing server-based scripts which perform a CNS database query for users subscribed to CNS alert types, such as Field Notices or Software Updates. The front-end uses angular2 framework, while the server uses very basic php and bash scripts to carry out it's limited functions.

## URL

Current site URL: http://swtg-rtp-web-1.cisco.com/cnsauto/

## Deployment

In order for the site to function, there are a few steps that must be carried out.

1. In the root cnsauto directory run

	```
	npm install
	npm start
	```

	This will open up a localhost instance of the site for development, as well as build and compile the TypeScript files into JavaScript.

2. Copy the following files and directories into the /var/www/html/cnsauto/ folder on a server running apache.

	```
	app
	node_modules
	.htaccess
	index.html
	systemjs.config.js
	```

3. In /var/www/html/cnsauto/app, remove all of the typescript and map files that were used for development.

	```
	cd /var/www/html/cnsauto/app
	rm -f *.map *.ts
	```

4. In /var/www/html/cnsauto/app/csv, change the folder ownership of two directories that apache must write to.

	```
	cd /var/www/html/cnsauto/app/csv
	chown apache:aapche temp logs
	```

5. Change the file ownership of the php and bash scripts so that apache can access them.

	```
	chown apache:apache /var/www/html/cnsauto/app/csv/php/*.php /var/www/html/cnsauto/app/csv/bash/*.sh
	```

6. Finally change the file execution permissions on the same scripts so that they can be run.

	```
	chmod a+x /var/www/html/cnsauto/app/csv/php/*.php /var/www/html/cnsauto/app/csv/bash/*.sh
	```

7. At this point the site should function properly. Visit the URL of your server to log in and view the site.

## Permissions

In order to prevent sensitive customer data from being spread into too many hands, the site allows only a select list of people to access the Download buttons. People not on this list may only use the View function, which does not generate any .CSV files. These un-authorized users are also prevented from accessing the download php script, sql_custom.php. The people who are on the authorized list may Download .CSV files of reports in addition to using the normal View function, and may also download the site access log which tracks who has used the Download and View functions and when.

To modify permissions, a person's user ID must be entered into the root .htaccess file like so:

```
RewriteCond %{HTTP_COOKIE} username=mischmi2;? [or]
RewriteCond %{HTTP_COOKIE} username=tadeckar;?
```

This will cause those users to be issued an admin=true cookie upon logging in, granting access to Download functions. Note that the last person in the RewriteCond list should not have [or] at the end of their line.


