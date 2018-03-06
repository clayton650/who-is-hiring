<h1>Who is hiring?</h1>

**About:** A lightweight frontend only app that provides a better user experience when browsing job listing on [Hacker News whoishiring threads](https://news.ycombinator.com/submitted?id=whoishiring). Features included easy navigation between monthly posts ([currently limited to latest 3 months (4 posts per month)](https://github.com/clayton650/who-is-hiring/blob/master/asset/js/comment.js#L55)), filtering post by keywords, and saving favorites which can be accessed in the favorites tab. Also includes a search sidebar powered by Wikipedia.

**Highlights:** 
- Good object oriented programming example using [javascript object literals](https://github.com/clayton650/who-is-hiring/blob/master/asset/js/app.js).
- Sync'd page state with URL using [these utils](https://github.com/clayton650/who-is-hiring/blob/master/asset/js/util.js)
- [Restructured third party data](https://github.com/clayton650/who-is-hiring/blob/master/asset/js/comment.js#L160) to better support app's functionality 
- [Custom infinit scroll implementation](https://github.com/clayton650/who-is-hiring/blob/master/asset/js/index.js#L210) using [waypoints.js](http://imakewebthings.com/waypoints/)

**Libraries:** Bootstrap, JQuery, Waypoints.js, Moment.js

**APIs:**  Content provided by [Hacker News](https://news.ycombinator.com/submitted?id=whoishiring) via their [Firebase API](https://github.com/HackerNews/API), sidebar search powered by [Wikipedia's API](https://en.wikipedia.org/w/api.php?)

**Demo: [Click Here](https://clayton650.github.io/who-is-hiring/)** 

**Install and Use:**

```
git@github.com:clayton650/who-is-hiring.git
cd who-is-hiring
open index.html
```

**Help, maintenance, and contributor:** claytonhthompson@gmail.com
