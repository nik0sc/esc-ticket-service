# esc-ticket-service

**You don't need microservices.** Your referential integrity constraints and fast database server-side joins are not worth the 
mythical creature of Scalability unless you are literally Google or Netflix. Honestly we should have just used MongoDB if I'd 
known we'd take the microservices requirement seriously.

I will just leave this paragraph from the final report I had to submit:

> I personally do not think that the project was successful. The main reason would have to be a combination of insufficient 
> development time, learning curve, and feature creep. We put in consistent work throughout the term (speaking for myself, 
> please check my Git repositories to verify this), so it is not a case of last-minute work. Splitting the backend application 
> into user and ticket microservices took almost a week of combined refactoring and testing to make sure there were no 
> regressions, and for (quite frankly) minimal impact to the end-user experience.

Anyway, just `npm install` and `node app.js` if you, gentle reader, wish to behold this project. Although you do need to set up 
the MySQL instance, create tables, and promote it with `DATABASE_URL`. For best results, deploy to a 
[Dokku](http://dokku.viewdocs.io/dokku/) instance on [DigitalOcean](http://digitalocean.com/) for your own el cheapo 
Heroku-compatible SaaS.

`async` and `await` are great. You can actually read the code top to bottom.
