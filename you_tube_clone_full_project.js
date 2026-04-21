// FULL EXTENSION: Subscriptions + Comments (with replies) + Channel Page + Improved UI
// This extends your existing project. Paste/merge carefully.

// ================= DB ADDITIONS (run once) =================
// Add missing tables
/*
CREATE TABLE IF NOT EXISTS subscriptions (
 id INTEGER PRIMARY KEY,
 subscriberUserId INTEGER,
 channelId INTEGER,
 createdAt TEXT,
 UNIQUE(subscriberUserId, channelId)
);

CREATE TABLE IF NOT EXISTS comments (
 id INTEGER PRIMARY KEY,
 videoId INTEGER,
 userId INTEGER,
 parentCommentId INTEGER,
 content TEXT,
 createdAt TEXT
);
*/

// ================= SUBSCRIBE ROUTES =================
app.post('/api/subscribe/:channelId', (req,res)=>{
 const userId = jwt.verify(req.cookies.token,'secret').id;
 try{
  db.prepare('INSERT INTO subscriptions (subscriberUserId,channelId,createdAt) VALUES (?,?,?)')
   .run(userId, req.params.channelId, new Date().toISOString());
  db.prepare('UPDATE channels SET subscriberCount = subscriberCount + 1 WHERE id=?')
   .run(req.params.channelId);
 }catch{}
 res.send('subscribed');
});

app.delete('/api/subscribe/:channelId', (req,res)=>{
 const userId = jwt.verify(req.cookies.token,'secret').id;
 db.prepare('DELETE FROM subscriptions WHERE subscriberUserId=? AND channelId=?')
  .run(userId, req.params.channelId);
 db.prepare('UPDATE channels SET subscriberCount = subscriberCount - 1 WHERE id=?')
  .run(req.params.channelId);
 res.send('unsubscribed');
});

// ================= COMMENTS =================
app.get('/api/videos/:id/comments', (req,res)=>{
 const comments = db.prepare('SELECT * FROM comments WHERE videoId=? ORDER BY createdAt DESC')
  .all(req.params.id);
 res.json(comments);
});

app.post('/api/comments', (req,res)=>{
 const userId = jwt.verify(req.cookies.token,'secret').id;
 db.prepare('INSERT INTO comments (videoId,userId,parentCommentId,content,createdAt) VALUES (?,?,?,?,?)')
  .run(req.body.videoId, userId, req.body.parentCommentId || null, req.body.content, new Date().toISOString());
 res.send('comment added');
});

app.delete('/api/comments/:id', (req,res)=>{
 const userId = jwt.verify(req.cookies.token,'secret').id;
 db.prepare('DELETE FROM comments WHERE id=? AND userId=?').run(req.params.id, userId);
 res.send('deleted');
});

// ================= CHANNEL PAGE =================
app.get('/api/channel/:id', (req,res)=>{
 const channel = db.prepare('SELECT * FROM channels WHERE id=?').get(req.params.id);
 const videos = db.prepare('SELECT * FROM videos WHERE channelId=? ORDER BY createdAt DESC')
  .all(req.params.id);
 res.json({channel, videos});
});

// ================= FRONTEND: HEADER (shared) =================
/* public/components/header.html */
/*
<header style="display:flex;align-items:center;padding:10px;background:#202020;color:white">
  <h2 style="margin-right:20px">MyTube</h2>
  <input id="search" placeholder="Search" style="flex:1;padding:5px" />
  <button onclick="goSearch()">Search</button>
</header>
<script>
function goSearch(){
 location.href='search.html?q='+document.getElementById('search').value;
}
</script>
*/

// ================= CHANNEL PAGE =================
/* public/channel.html */
/*
<!DOCTYPE html>
<html>
<body>
<div id="channel"></div>
<div id="videos"></div>
<script>
const id=new URLSearchParams(location.search).get('id');
fetch('/api/channel/'+id).then(r=>r.json()).then(data=>{
 document.getElementById('channel').innerHTML=`
  <h1>${data.channel.channelName}</h1>
  <p>${data.channel.subscriberCount} subscribers</p>
  <button onclick="sub()">Subscribe</button>
 `;
 const v=document.getElementById('videos');
 data.videos.forEach(x=>{
  v.innerHTML+=`<div>
   <img src="${x.thumbnailUrl}" width="200"/>
   <a href="watch.html?id=${x.id}">${x.title}</a>
  </div>`;
 });
});
function sub(){fetch('/api/subscribe/'+id,{method:'POST'});} 
</script>
</body>
</html>
*/

// ================= WATCH PAGE WITH COMMENTS =================
/* public/watch.html (replace) */
/*
<!DOCTYPE html>
<html>
<body>
<video id="player" controls width="600"></video>
<h2 id="title"></h2>
<button onclick="like()">Like</button>

<h3>Comments</h3>
<input id="cmt" placeholder="Add comment" />
<button onclick="addComment()">Post</button>
<div id="comments"></div>

<script>
const id=new URLSearchParams(location.search).get('id');

fetch('/api/videos/'+id).then(r=>r.json()).then(v=>{
 document.getElementById('player').src=v.videoUrl;
 document.getElementById('title').innerText=v.title;
});

function like(){fetch('/api/videos/'+id+'/like',{method:'POST'});} 

function loadComments(){
 fetch('/api/videos/'+id+'/comments').then(r=>r.json()).then(data=>{
  const c=document.getElementById('comments');
  c.innerHTML='';
  data.forEach(cm=>{
   c.innerHTML+=`<div>
    <p>${cm.content}</p>
    <button onclick="reply(${cm.id})">Reply</button>
   </div>`;
  });
 });
}

function addComment(){
 fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({videoId:id,content:document.getElementById('cmt').value})})
 .then(loadComments);
}

function reply(parentId){
 const txt=prompt('Reply:');
 fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({videoId:id,parentCommentId:parentId,content:txt})})
 .then(loadComments);
}

loadComments();
</script>
</body>
</html>
*/

// ================= IMPROVED HOME UI =================
/* public/index.html (replace grid UI) */
/*
<style>
body{margin:0;font-family:sans-serif;background:#f9f9f9}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;padding:15px}
.card{background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 5px rgba(0,0,0,0.1)}
.card img{width:100%}
.card h3{padding:10px;font-size:16px}
</style>
*/

// ================= RESULT =================
// You now have:
// ✔ Subscriptions system
// ✔ Channel page
// ✔ Comments with replies
// ✔ Improved YouTube-style UI
//
// NEXT upgrades (if you want real YouTube level):
// - Search system
// - History
// - Recommendation algorithm
// - Better UI (sidebar, mobile nav)
