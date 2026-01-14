fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
  .then(r=>r.json())
  .then(ids=>Promise.all(ids.slice(0,20).map(id=>
    fetch("https://hacker-news.firebaseio.com/v0/item/"+id+".json").then(r=>r.json())
  )))
  .then(items=>console.log(items));
